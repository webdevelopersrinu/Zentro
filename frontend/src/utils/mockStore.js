// Client-Side Mock Store & Real-Time Simulator

const INITIAL_ROOMS = [
  { id: 'general', name: 'general', creator: 'system' },
  { id: 'gaming', name: 'gaming', creator: 'system' },
  { id: 'study', name: 'study', creator: 'system' }
];

const INITIAL_USERS = [
  { username: 'alice', online: true },
  { username: 'bob', online: true },
  { username: 'charlie', online: false },
  { username: 'alex23', online: true },
  { username: 'alicia', online: false }
];

const BOT_RESPONSES = {
  general: [
    "Hey! Welcome to the general chat room.",
    "Did anyone see the latest update?",
    "It's a great day to build some frontend apps! 🚀",
    "How's everyone doing today?",
    "Awesome, we are chatting in real-time!"
  ],
  gaming: [
    "Anyone up for some gaming tonight?",
    "What game are we playing? 🎮",
    "I just hit a new high score!",
    "That match was intense!",
    "GG, well played everyone!"
  ],
  study: [
    "Let's focus and get this project finished! 📚",
    "Does anyone understand this regex?",
    "Study sessions are much better when sharing notes.",
    "Could someone explain this algorithm to me?",
    "Take a break, stay hydrated! 💧"
  ]
};

const getStored = (key, fallback) => {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : fallback;
};

const setStored = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

class MockStore {
  constructor() {
    this.listeners = [];
    this.typingListeners = [];

    this.users = getStored('chat_users', INITIAL_USERS);
    this.rooms = getStored('chat_rooms', INITIAL_ROOMS);
    
    const defaultMembers = {};
    this.rooms.forEach(r => {
      defaultMembers[r.id] = ['alice', 'bob', 'charlie'];
    });
    this.roomMembers = getStored('chat_room_members', defaultMembers);

    const defaultMessages = {
      general: [
        { id: 1, sender: 'bob', text: 'Hey everyone! 👋', timestamp: '10:02 AM' }
      ],
      gaming: [
        { id: 1, sender: 'bob', text: 'Anyone up for a game? 🎮', timestamp: '09:45 AM' }
      ],
      study: [
        { id: 1, sender: 'charlie', text: 'Reviewing the design specifications.', timestamp: '10:15 AM' }
      ]
    };
    this.messages = getStored('chat_messages', defaultMessages);
    this.unreads = getStored('chat_unreads', {});
    this.currentUser = getStored('chat_current_user', null);
    this.activeRoomId = getStored('chat_active_room', 'general');
    this.typingUsers = {};
    this.typingTimeout = null;

    this.startBackgroundSimulation();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  subscribeTyping(callback) {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter(l => l !== callback);
    };
  }

  notify() {
    setStored('chat_users', this.users);
    setStored('chat_rooms', this.rooms);
    setStored('chat_room_members', this.roomMembers);
    setStored('chat_messages', this.messages);
    setStored('chat_unreads', this.unreads);
    setStored('chat_current_user', this.currentUser);
    setStored('chat_active_room', this.activeRoomId);

    this.listeners.forEach(l => l(this.getState()));
  }

  notifyTyping() {
    this.typingListeners.forEach(l => l({ ...this.typingUsers }));
  }

  getState() {
    return {
      currentUser: this.currentUser,
      rooms: this.rooms,
      activeRoomId: this.activeRoomId,
      messages: this.messages[this.activeRoomId] || [],
      members: this.getMembersForRoom(this.activeRoomId),
      unreads: this.unreads,
      typing: this.typingUsers[this.activeRoomId] || []
    };
  }

  login(username) {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) return { success: false, error: 'Username cannot be empty.' };

    this.currentUser = cleanUsername;
    
    if (!this.users.some(u => u.username === cleanUsername)) {
      this.users.push({ username: cleanUsername, online: true });
    } else {
      this.users = this.users.map(u => u.username === cleanUsername ? { ...u, online: true } : u);
    }

    this.rooms.forEach(r => {
      if (!this.roomMembers[r.id]) this.roomMembers[r.id] = [];
      if (!this.roomMembers[r.id].includes(cleanUsername)) {
        this.roomMembers[r.id].push(cleanUsername);
      }
    });

    this.notify();
    return { success: true };
  }

  logout() {
    if (this.currentUser) {
      const user = this.currentUser;
      this.users = this.users.map(u => u.username === user ? { ...u, online: false } : u);
      this.currentUser = null;
      this.notify();
    }
  }

  createRoom(name) {
    const cleanName = name.replace(/\s+/g, '-').replace(/#/g, '').toLowerCase();
    if (!cleanName) return { success: false, error: 'Room name cannot be empty.' };
    if (this.rooms.some(r => r.name === cleanName)) {
      return { success: false, error: 'Room already exists.' };
    }

    const roomId = cleanName;
    const newRoom = { id: roomId, name: cleanName, creator: this.currentUser };
    
    this.rooms.push(newRoom);
    this.roomMembers[roomId] = [this.currentUser];
    this.messages[roomId] = [];
    
    this.activeRoomId = roomId;
    this.notify();
    return { success: true };
  }

  setActiveRoom(roomId) {
    this.activeRoomId = roomId;
    if (this.unreads[roomId]) {
      this.unreads[roomId] = false;
    }
    this.notify();
  }

  getMembersForRoom(roomId) {
    const memberNames = this.roomMembers[roomId] || [];
    return this.users.filter(u => memberNames.includes(u.username));
  }

  searchUsernames(query) {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];
    return this.users.filter(u => u.username.includes(cleanQuery) && u.username !== this.currentUser);
  }

  inviteToRoom(username, roomId) {
    if (!this.roomMembers[roomId]) {
      this.roomMembers[roomId] = [];
    }
    if (!this.roomMembers[roomId].includes(username)) {
      this.roomMembers[roomId].push(username);
      this.notify();
      return true;
    }
    return false;
  }

  sendMessage(text) {
    if (!text.trim()) return;

    const roomId = this.activeRoomId;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage = {
      id: Date.now(),
      sender: this.currentUser,
      text: text,
      timestamp: timestamp
    };

    if (!this.messages[roomId]) {
      this.messages[roomId] = [];
    }

    this.messages[roomId].push(newMessage);
    this.notify();

    this.triggerMockReply(roomId);
  }

  setTyping(roomId, isTyping) {
    if (!this.currentUser) return;
  }

  triggerMockReply(roomId) {
    const members = this.roomMembers[roomId] || [];
    const candidates = members.filter(m => m !== this.currentUser);
    if (candidates.length === 0) return;

    const activeCandidates = this.users
      .filter(u => candidates.includes(u.username) && u.online);
    
    const responder = activeCandidates.length > 0 
      ? activeCandidates[Math.floor(Math.random() * activeCandidates.length)].username
      : candidates[Math.floor(Math.random() * candidates.length)];

    setTimeout(() => {
      this.startTyping(responder, roomId);
      
      setTimeout(() => {
        this.stopTyping(responder, roomId);
        
        const possibleResponses = BOT_RESPONSES[roomId] || BOT_RESPONSES.general;
        const text = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMessage = {
          id: Date.now(),
          sender: responder,
          text: text,
          timestamp: timestamp
        };

        if (!this.messages[roomId]) {
          this.messages[roomId] = [];
        }

        this.messages[roomId].push(newMessage);

        if (this.activeRoomId !== roomId) {
          this.unreads[roomId] = true;
        }

        this.notify();
      }, 1500);
    }, 1000);
  }

  startTyping(username, roomId) {
    if (!this.typingUsers[roomId]) {
      this.typingUsers[roomId] = [];
    }
    if (!this.typingUsers[roomId].includes(username)) {
      this.typingUsers[roomId].push(username);
      this.notifyTyping();
      if (roomId === this.activeRoomId) {
        this.notify();
      }
    }
  }

  stopTyping(username, roomId) {
    if (this.typingUsers[roomId]) {
      this.typingUsers[roomId] = this.typingUsers[roomId].filter(u => u !== username);
      this.notifyTyping();
      if (roomId === this.activeRoomId) {
        this.notify();
      }
    }
  }

  startBackgroundSimulation() {
    setInterval(() => {
      const nonCurrentUsers = this.users.filter(u => u.username !== this.currentUser);
      if (nonCurrentUsers.length === 0) return;

      const randomUser = nonCurrentUsers[Math.floor(Math.random() * nonCurrentUsers.length)];
      this.users = this.users.map(u => 
        u.username === randomUser.username 
          ? { ...u, online: !u.online } 
          : u
      );

      const inactiveRooms = this.rooms.filter(r => r.id !== this.activeRoomId);
      if (inactiveRooms.length > 0 && Math.random() > 0.7) {
        const targetRoom = inactiveRooms[Math.floor(Math.random() * inactiveRooms.length)].id;
        this.triggerMockReply(targetRoom);
      }

      this.notify();
    }, 25000);
  }
}

export const mockStore = new MockStore();
