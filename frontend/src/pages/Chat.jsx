import { useState } from "react";
import { Compass, MessageSquare } from "lucide-react";

import { Sidebar } from "../components/chat/Sidebar.jsx";
import { ConversationPanel } from "../components/chat/ConversationPanel.jsx";
import { MembersPanel } from "../components/chat/MembersPanel.jsx";
import { LockedRoomCard } from "../components/chat/LockedRoomCard.jsx";
import { ConnectionBanner } from "../components/chat/ConnectionBanner.jsx";
import { CreateRoomModal } from "../components/modals/CreateRoomModal.jsx";
import { InviteModal } from "../components/modals/InviteModal.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { useChatState } from "../hooks/useChatState.js";
import { useCreateRoom } from "../hooks/useRooms.js";
import { useSocket } from "../context/SocketContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { cx } from "../lib/cx.js";
import styles from "./Chat.module.css";

export default function Chat() {
  const chat = useChatState();
  const { isReady } = useSocket();
  const { toast } = useToast();
  const createRoom = useCreateRoom();

  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [drawer, setDrawer] = useState(null); // 'sidebar' | 'members' | null

  const handleCreate = ({ name, visibility }, close) =>
    createRoom.mutate(
      { name, visibility },
      {
        onSuccess: (room) => {
          close();
          chat.selectRoom(room.id);
          toast(`Created #${room.name}`, { variant: "success" });
        },
        onError: (error) => toast(error.message, { variant: "error" }),
      }
    );

  const room = chat.activeRoom;

  return (
    <div className={styles.layout}>
      <div className={cx(styles.sidebar, drawer === "sidebar" && styles.open)}>
        <Sidebar
          myRooms={chat.myRooms}
          discoverRooms={chat.discoverRooms}
          loading={chat.loadingRooms}
          activeRoomId={chat.activeRoomId}
          unreadRoomIds={chat.unreadRoomIds}
          joiningRoomId={chat.joiningRoomId}
          onSelectRoom={(id) => {
            chat.selectRoom(id);
            setDrawer(null);
          }}
          onJoinRoom={chat.joinRoom}
          onCreateRoom={() => setCreating(true)}
        />
      </div>

      <main className={styles.main}>
        <ConnectionBanner visible={!isReady} />

        {!room ? (
          <EmptyState
            icon={chat.myRooms.length ? MessageSquare : Compass}
            title={chat.myRooms.length ? "Pick a room" : "You're not in any rooms yet"}
            body={
              chat.myRooms.length
                ? "Choose a room from the sidebar to start talking."
                : "Browse the public rooms in the sidebar and join one."
            }
          />
        ) : !room.isMember ? (
          <LockedRoomCard
            room={room}
            requesting={chat.joiningRoomId === room.id}
            onRequest={chat.joinRoom}
          />
        ) : (
          <ConversationPanel
            room={room}
            connected={isReady}
            onToggleSidebar={() => setDrawer("sidebar")}
            onToggleMembers={() => setDrawer("members")}
          />
        )}
      </main>

      {room?.isMember && (
        <div className={cx(styles.members, drawer === "members" && styles.open)}>
          <MembersPanel room={room} onInvite={() => setInviting(true)} />
        </div>
      )}

      {drawer && (
        <button
          type="button"
          className={styles.scrim}
          aria-label="Close panel"
          onClick={() => setDrawer(null)}
        />
      )}

      <CreateRoomModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={handleCreate}
        submitting={createRoom.isPending}
      />

      {room?.isMember && (
        <InviteModal open={inviting} onClose={() => setInviting(false)} room={room} />
      )}
    </div>
  );
}
