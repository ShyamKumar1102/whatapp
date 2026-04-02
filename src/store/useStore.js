import { create } from 'zustand';
import { io }     from 'socket.io-client';
import { chats as mockChats, messages as mockMessages, contacts as mockContacts } from '@/lib/mock-data';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket = null;

// ── Authenticated fetch helper ────────────────────────────────
const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('crm_token');
  const res   = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      'Content-Type':  'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res.json();
};

// ── Socket init ───────────────────────────────────────────────
const initSocket = (set, get) => {
  if (socket?.connected) return;

  socket = io(BACKEND, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    set({ socketConnected: true });
    console.log('✅ Socket connected');
  });

  socket.on('disconnect', () => set({ socketConnected: false }));

  // Real WhatsApp message arrives from Meta via backend
  socket.on('new_message', (message) => {
    const { chats, messages, selectedChatId } = get();

    set({ messages: [...messages, message] });

    set({
      chats: chats.map(c =>
        c.id === message.chatId
          ? { ...c, lastMessage: message.content, lastMessageTime: 'Just now',
              unreadCount: c.id === selectedChatId ? 0 : (c.unreadCount || 0) + 1 }
          : c
      ),
    });
  });

  // New conversation created by incoming message
  socket.on('conversation_created', (conv) => {
    const { chats } = get();
    if (!chats.find(c => c.id === conv.id)) {
      set({
        chats: [{
          id:              conv.id,
          contact:         conv.contact,
          lastMessage:     '',
          lastMessageTime: 'Just now',
          unreadCount:     1,
          assignedAgent:   null,
        }, ...chats],
      });
    }
  });

  // Message status update (sent → delivered → read)
  socket.on('message_status', ({ messageId, status }) => {
    set(state => ({
      messages: state.messages.map(m => m.id === messageId ? { ...m, status } : m),
    }));
  });

  // Typing indicator from contact
  socket.on('contact_typing', ({ chatId }) => {
    set(state => ({ chats: state.chats.map(c => c.id === chatId ? { ...c, isTyping: true } : c) }));
    setTimeout(() => {
      set(state => ({ chats: state.chats.map(c => c.id === chatId ? { ...c, isTyping: false } : c) }));
    }, 3000);
  });
};

// ── Store ─────────────────────────────────────────────────────
export const useStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────
  chats:           mockChats,
  messages:        mockMessages,
  contacts:        mockContacts,
  selectedChatId:  null,
  isDarkMode:      false,
  sidebarCollapsed: false,
  socketConnected: false,
  isLoadingMessages: false,

  // Auth state
  user:            JSON.parse(localStorage.getItem('crm_user') || 'null'),
  token:           localStorage.getItem('crm_token') || null,
  isAuthenticated: !!localStorage.getItem('crm_token'),

  // ── Auth actions ───────────────────────────────────────────
  login: async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    });
    if (data.success) {
      localStorage.setItem('crm_token', data.token);
      localStorage.setItem('crm_user',  JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isAuthenticated: true });
      initSocket(set, get);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    socket?.disconnect();
    socket = null;
    set({ token: null, user: null, isAuthenticated: false, socketConnected: false });
  },

  // ── App init ───────────────────────────────────────────────
  initSocket:   () => initSocket(set, get),
  loadContacts: async () => {
    try {
      const data = await apiFetch('/api/contacts');
      if (data.success && data.data.length) set({ contacts: data.data });
    } catch { /* use mock data */ }
  },

  // ── UI ─────────────────────────────────────────────────────
  toggleSidebar:  () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDarkMode: () => set(state => {
    const next = !state.isDarkMode;
    document.documentElement.classList.toggle('dark', next);
    return { isDarkMode: next };
  }),

  // ── Chat actions ───────────────────────────────────────────
  setSelectedChat: (id) => {
    set({ selectedChatId: id });
    if (socket && id) socket.emit('join_chat', id);
    set(state => ({
      chats: state.chats.map(c => c.id === id ? { ...c, unreadCount: 0 } : c),
    }));
    // Load messages from backend
    if (id) get().loadMessages(id);
  },

  loadMessages: async (chatId) => {
    set({ isLoadingMessages: true });
    try {
      const data = await apiFetch(`/api/messages/${chatId}`);
      if (data.success && data.data.length) {
        set(state => ({
          messages: [
            ...state.messages.filter(m => m.chatId !== chatId && m.conversation_id !== chatId),
            ...data.data,
          ],
        }));
      }
    } catch { /* use mock */ } finally {
      set({ isLoadingMessages: false });
    }
  },

  // Send message — optimistic UI + backend + Meta API
  addMessage: async (message) => {
    // 1. Show in UI immediately
    set(state => ({
      messages: [...state.messages, message],
      chats:    state.chats.map(c =>
        c.id === message.chatId
          ? { ...c, lastMessage: message.content, lastMessageTime: 'Just now' }
          : c
      ),
    }));

    // 2. Broadcast to other agents via socket
    if (socket) socket.emit('send_message', message);

    // 3. POST to backend → backend calls Meta API
    try {
      const data = await apiFetch('/api/messages/send', {
        method: 'POST',
        body:   JSON.stringify({ chatId: message.chatId, content: message.content, type: message.type || 'text' }),
      });
      if (data.success && data.data?.id) {
        // Replace temp message with server message (has meta_message_id)
        set(state => ({
          messages: state.messages.map(m =>
            m.id === message.id ? { ...m, ...data.data } : m
          ),
        }));
      }
    } catch { /* message stays in UI even if backend is down */ }
  },
}));
