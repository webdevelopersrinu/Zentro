import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as roomService from "../services/room.service.js";
import { queryKeys } from "../lib/queryKeys.js";

export function useMembers(roomId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.members(roomId),
    queryFn: () => roomService.listMembers(roomId),
    enabled: Boolean(roomId) && enabled,
  });
}

/** Creator-only. The server rejects anyone else, so we simply do not render it. */
export function useRequests(roomId, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.requests(roomId),
    queryFn: () => roomService.listRequests(roomId),
    enabled: Boolean(roomId) && enabled,
  });
}

/**
 * Approve and reject share everything but the verb, so they share a factory.
 * The row disappears optimistically; a failure puts it back.
 */
function useRequestDecision(roomId, decide) {
  const queryClient = useQueryClient();
  const key = queryKeys.requests(roomId);

  return useMutation({
    mutationFn: (userId) => decide(roomId, userId),

    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (requests = []) =>
        requests.filter((request) => request.id !== userId)
      );
      return { previous };
    },

    onError: (_error, _userId, context) => {
      queryClient.setQueryData(key, context?.previous);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(roomId) });
    },
  });
}

export const useApproveRequest = (roomId) =>
  useRequestDecision(roomId, roomService.approveRequest);

export const useRejectRequest = (roomId) =>
  useRequestDecision(roomId, roomService.rejectRequest);

export function useInviteUser(roomId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username) => roomService.inviteUser(roomId, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
}
