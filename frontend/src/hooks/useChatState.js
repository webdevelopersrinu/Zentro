import { useCallback, useEffect, useMemo, useState } from "react";

import { useMyRooms, useDiscoverRooms, useJoinRoom } from "./useRooms.js";
import { useRealtimeSync } from "./useRealtimeSync.js";
import { useRoomSubscriptions } from "./useRoomSubscriptions.js";
import { useToast } from "../context/ToastContext.jsx";

/**
 * All of the chat screen's CLIENT state — which room is open, which rooms have
 * unread activity, which room is mid-join. Server state stays in React Query.
 */
export function useChatState() {
  const { data: myRooms = [], isLoading: loadingRooms } = useMyRooms();
  const { data: discoverRooms = [] } = useDiscoverRooms();
  const join = useJoinRoom();
  const { toast } = useToast();

  const [activeRoomId, setActiveRoomId] = useState(null);
  const [unreadRoomIds, setUnreadRoomIds] = useState(() => new Set());

  const markUnread = useCallback((roomId) => {
    setUnreadRoomIds((current) => new Set(current).add(roomId));
  }, []);

  useRealtimeSync({ activeRoomId, onUnread: markUnread });

  // Subscribe the socket to every room we belong to — including rooms created
  // or joined after the socket connected, which the server cannot auto-join.
  useRoomSubscriptions(myRooms);

  const selectRoom = useCallback((roomId) => {
    setActiveRoomId(roomId);
    setUnreadRoomIds((current) => {
      if (!current.has(roomId)) return current;
      const next = new Set(current);
      next.delete(roomId);
      return next;
    });
  }, []);

  /** Public rooms admit you instantly; private ones only record a request. */
  const joinRoom = useCallback(
    (room) =>
      join.mutate(room.id, {
        onSuccess: (result) => {
          if (result.joined) {
            toast(`Joined #${room.name}`, { variant: "success" });
            setActiveRoomId(room.id);
          } else {
            toast(`Request sent to the creator of #${room.name}`);
          }
        },
        onError: (error) => toast(error.message, { variant: "error" }),
      }),
    [join, toast]
  );

  const activeRoom = useMemo(
    () =>
      myRooms.find((room) => room.id === activeRoomId) ??
      discoverRooms.find((room) => room.id === activeRoomId) ??
      null,
    [myRooms, discoverRooms, activeRoomId]
  );

  // A room we left, or were rejected from, must not stay open.
  useEffect(() => {
    if (activeRoomId && !activeRoom) setActiveRoomId(null);
  }, [activeRoomId, activeRoom]);

  return {
    myRooms,
    discoverRooms,
    loadingRooms,
    activeRoom,
    activeRoomId,
    unreadRoomIds,
    joiningRoomId: join.isPending ? join.variables : null,
    selectRoom,
    joinRoom,
  };
}
