import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as roomService from "../services/room.service.js";
import { queryKeys } from "../lib/queryKeys.js";

export const useMyRooms = () =>
  useQuery({ queryKey: queryKeys.rooms, queryFn: roomService.listMyRooms });

export const useDiscoverRooms = () =>
  useQuery({ queryKey: queryKeys.discover, queryFn: roomService.listDiscoverableRooms });

/** Both lists must move together, so every room mutation refreshes both. */
const useRefreshRoomLists = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    queryClient.invalidateQueries({ queryKey: queryKeys.discover });
  };
};

export function useCreateRoom() {
  const refresh = useRefreshRoomLists();
  return useMutation({ mutationFn: roomService.createRoom, onSuccess: refresh });
}

/**
 * Public rooms admit you instantly; private ones only record a request. The
 * caller reads `joined` / `requested` from the result to decide what to say.
 */
export function useJoinRoom() {
  const refresh = useRefreshRoomLists();
  return useMutation({ mutationFn: roomService.joinRoom, onSuccess: refresh });
}

export function useLeaveRoom() {
  const refresh = useRefreshRoomLists();
  return useMutation({ mutationFn: roomService.leaveRoom, onSuccess: refresh });
}
