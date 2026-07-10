import { Lock } from "lucide-react";

import { Button } from "../ui/Button.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";

/**
 * Shown instead of the conversation when a private room is selected but not
 * joined. Messages are never fetched — the server would 403 anyway, and asking
 * would be a needless request.
 */
export function LockedRoomCard({ room, requesting, onRequest }) {
  const requested = room.hasRequested;

  return (
    <EmptyState
      icon={Lock}
      title={`#${room.name} is private`}
      body={
        requested
          ? "Your request is waiting for the creator to approve it."
          : "Ask the creator for access. They'll see your request straight away."
      }
      action={
        <Button loading={requesting} disabled={requested} onClick={() => onRequest(room)}>
          {requested ? "Requested ✓" : "Request to join"}
        </Button>
      }
    />
  );
}
