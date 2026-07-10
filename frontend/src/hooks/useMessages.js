import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import * as roomService from "../services/room.service.js";
import { queryKeys } from "../lib/queryKeys.js";
import { SOCKET_EVENTS } from "../config/index.js";
import { useSocketEmit } from "./useSocketEvent.js";

let tempId = 0;
const nextTempId = () => `temp-${(tempId += 1)}`;

export function useMessages(roomId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.messages(roomId),
    queryFn: () => roomService.listMessages(roomId),
    enabled: Boolean(roomId) && enabled,
  });
}

/**
 * Optimistic send. The bubble appears before the server has heard of it, then
 * the ack either replaces the temporary message with the real one, or marks it
 * failed so the user can retry. The message is never sent over HTTP — the
 * socket both persists it and broadcasts it.
 */
export function useSendMessage(roomId, author) {
  const queryClient = useQueryClient();
  const emit = useSocketEmit();
  const key = queryKeys.messages(roomId);

  const patch = useCallback(
    (id, changes) =>
      queryClient.setQueryData(key, (messages = []) =>
        messages.map((message) => (message.id === id ? { ...message, ...changes } : message))
      ),
    [queryClient, key]
  );

  return useCallback(
    async (text) => {
      const id = nextTempId();

      queryClient.setQueryData(key, (messages = []) => [
        ...messages,
        {
          id,
          roomId,
          text,
          username: author.username,
          createdAt: new Date().toISOString(),
          status: "sending",
        },
      ]);

      const ack = await emit(SOCKET_EVENTS.MESSAGE_SEND, { roomId, text });

      if (!ack?.ok) {
        patch(id, { status: "failed", error: ack?.error });
        return ack;
      }

      /**
       * Swap the placeholder for the server's message in one update. The ack and
       * the `message:new` broadcast race each other, so: if the broadcast won,
       * simply drop the placeholder; if the ack won, promote it in place. Either
       * way the bubble never disappears and never doubles.
       */
      queryClient.setQueryData(key, (messages = []) => {
        const alreadyBroadcast = messages.some((message) => message.id === ack.message.id);

        return alreadyBroadcast
          ? messages.filter((message) => message.id !== id)
          : messages.map((message) => (message.id === id ? ack.message : message));
      });

      return ack;
    },
    [queryClient, key, roomId, author.username, emit, patch]
  );
}
