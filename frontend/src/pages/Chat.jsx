import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatPanel from '../components/ChatPanel';
import MembersPanel from '../components/MembersPanel';
import CreateRoomModal from '../components/CreateRoomModal';
import InviteModal from '../components/InviteModal';
import { mockStore } from '../utils/mockStore';

export default function Chat({ onLogout }) {
  const [storeState, setStoreState] = useState(mockStore.getState());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false);

  // Subscribe to state updates in the store
  useEffect(() => {
    const unsubscribe = mockStore.subscribe((newState) => {
      setStoreState(newState);
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = (text) => {
    mockStore.sendMessage(text);
  };

  const handleRoomSelect = (roomId) => {
    mockStore.setActiveRoom(roomId);
  };

  const handleCreateRoom = (name) => {
    return mockStore.createRoom(name);
  };

  const handleInviteUser = (username, roomId) => {
    return mockStore.inviteToRoom(username, roomId);
  };

  const currentRoom = storeState.rooms.find(r => r.id === storeState.activeRoomId);

  return (
    <div className="chat-layout">
      {/* 3-Column main UI */}
      <Sidebar
        rooms={storeState.rooms}
        activeRoomId={storeState.activeRoomId}
        unreads={storeState.unreads}
        currentUser={storeState.currentUser}
        onRoomSelect={handleRoomSelect}
        onCreateRoomClick={() => setIsCreateOpen(true)}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <ChatPanel
        room={currentRoom}
        messages={storeState.messages}
        typing={storeState.typing}
        currentUser={storeState.currentUser}
        onSendMessage={handleSendMessage}
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
        onMobileMembersToggle={() => setMobileMembersOpen(!mobileMembersOpen)}
      />

      <MembersPanel
        members={storeState.members}
        currentUser={storeState.currentUser}
        onInviteClick={() => setIsInviteOpen(true)}
        mobileOpen={mobileMembersOpen}
        onMobileClose={() => setMobileMembersOpen(false)}
      />

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomId={storeState.activeRoomId}
        roomName={currentRoom ? currentRoom.name : ''}
        onInvite={handleInviteUser}
      />

      <style>{`
        .chat-layout {
          display: flex;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          background-color: var(--color-bg);
          position: relative;
        }

        @media (max-width: 768px) {
          .chat-layout {
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
}
