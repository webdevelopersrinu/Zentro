import { ChatHeader } from "./ChatHeader.jsx";
import { MessageList } from "./MessageList.jsx";
import { MessageComposer } from "./MessageComposer.jsx";
import { TypingIndicator } from "./TypingIndicator.jsx";
import { useMessages, useSendMessage } from "../../hooks/useMessages.js";
import { useTyping } from "../../hooks/useTyping.js";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./ConversationPanel.module.css";

export function ConversationPanel({ room, connected, onToggleMembers, onToggleSidebar }) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(room.id);
  const send = useSendMessage(room.id, user);
  const { typists, handleKeystroke, stopTyping } = useTyping(room.id);

  return (
    <section className={styles.panel} aria-label={`Conversation in ${room.name}`}>
      <ChatHeader
        room={room}
        onToggleMembers={onToggleMembers}
        onToggleSidebar={onToggleSidebar}
      />

      <MessageList
        roomId={room.id}
        messages={messages}
        loading={isLoading}
        currentUsername={user.username}
        onRetry={(message) => send(message.text)}
      />

      <TypingIndicator typists={typists} />

      <MessageComposer
        roomName={room.name}
        disabled={!connected}
        onSend={send}
        onKeystroke={handleKeystroke}
        onStopTyping={stopTyping}
      />
    </section>
  );
}
