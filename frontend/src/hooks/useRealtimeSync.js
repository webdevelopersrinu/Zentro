import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../lib/queryKeys.js";
import { SOCKET_EVENTS } from "../config/index.js";
import { useSocketEvent } from "./useSocketEvent.js";
import { useToast } from "../context/ToastContext.jsx";

/**
 * The bridge between the socket and the cache.
 *
 * Incoming events WRITE INTO the cache; they never trigger a refetch. Refetching
 * the whole message list on every arriving message would be an N+1 disaster —
 * the socket already handed us the data.
 */
export function useRealtimeSync({ activeRoomId, onUnread }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refreshRoomLists = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    queryClient.invalidateQueries({ queryKey: queryKeys.discover });
  };

  useSocketEvent(SOCKET_EVENTS.MESSAGE_NEW, (message) => {
    queryClient.setQueryData(queryKeys.messages(message.roomId), (messages = []) =>
      messages.some((existing) => existing.id === message.id)
        ? messages
        : [...messages, message]
    );

    // A message in a room you are not looking at earns a dot, not a toast.
    if (message.roomId !== activeRoomId) onUnread(message.roomId);
  });

  /**
   * Presence carries its own roomId — the user may be in several rooms, and the
   * event is not necessarily about the one on screen.
   */
  const setPresence = (roomId, userId, online) => {
    const key = queryKeys.members(roomId);
    const members = queryClient.getQueryData(key);
    if (!members) return;

    // Somebody we have never seen: they joined the room, so the roster and the
    // member counts are both stale.
    if (!members.some((member) => member.id === userId)) {
      queryClient.invalidateQueries({ queryKey: key });
      refreshRoomLists();
      return;
    }

    queryClient.setQueryData(key, (current) =>
      current.map((member) => (member.id === userId ? { ...member, online } : member))
    );
  };

  useSocketEvent(SOCKET_EVENTS.PRESENCE_JOINED, ({ roomId, userId }) =>
    setPresence(roomId, userId, true)
  );

  useSocketEvent(SOCKET_EVENTS.PRESENCE_LEFT, ({ roomId, userId }) =>
    setPresence(roomId, userId, false)
  );

  useSocketEvent(SOCKET_EVENTS.REQUEST_NEW, ({ roomId, roomName, from }) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.requests(roomId) });
    refreshRoomLists(); // the sidebar shows a pending-request badge
    toast(`${from.name} wants to join #${roomName}`);
  });

  useSocketEvent(SOCKET_EVENTS.REQUEST_APPROVED, ({ roomName }) => {
    refreshRoomLists();
    toast(`You were approved for #${roomName}`, { variant: "success" });
  });

  useSocketEvent(SOCKET_EVENTS.REQUEST_REJECTED, ({ roomName }) => {
    refreshRoomLists();
    toast(`Your request for #${roomName} was declined`, { variant: "warning" });
  });

  useSocketEvent(SOCKET_EVENTS.ROOM_INVITED, ({ roomName, from }) => {
    refreshRoomLists();
    toast(`${from} added you to #${roomName}`, { variant: "success" });
  });
}
