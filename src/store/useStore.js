import { create } from 'zustand';
import { io } from 'socket.io-client';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket = null;

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('crm_token');
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res.json();
};

const initSocket = (set, get) => {
  if (socket?.connected) return;
  socket = io(BACKEND, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    set({ socketConnected: true });
    console.log('✅ Socket connected');
  });

  socket.on('disconnect', () => set({ socketConnected: false }));

  socket.on('new_message', (message) => {
    const { chats, messages, selectedChatId } = get();
    set({ messages: [...messages, message] });
    set({
      chats: chats.map(c =>
        c.id === message.chatId
          ? { ...c, lastMessage: message.content, lastMessageTime: 'Just now', unreadCount: c.id === selectedChatId ? 0 : (c.unreadCount || 0) + 1 }
          : c
      ),
    });
  });

  socket.on('conversation_created', (conv) => {
    const { chats } = get();
    if (!chats.find(c => c.id === conv.id)) {
      set({ chats: [{ id: conv.id, contact: conv.contact, lastMessage: '', lastMessageTime: 'Just now', unreadCount: 1, assignedAgent: null }, ...chats] });
    }
  });

  socket.on('message_status', ({ messageId, status }) => {
    set(state => ({ messages: state.messages.map(m => m.id === messageId ? { ...m, status } : m) }));
  });

  socket.on('contact_typing', ({ chatId }) => {
    set(state => ({ chats: state.chats.map(c => c.id === chatId ? { ...c, isTyping: true } : c) }));
    setTimeout(() => {
      set(state => ({ chats: state.chats.map(c => c.id === chatId ? { ...c, isTyping: false } : c) }));
    }, 3000);
  });
};

export const useStore = create((set, get) => ({
  // ── State — starts EMPTY, filled from backend ──────────────
  chats: [],
  messages: [],
  contacts: [],
  selectedChatId: null,
  isDarkMode: false,
  sidebarCollapsed: false,
  socketConnected: false,
  isLoadingMessages: false,
  isLoadingChats: false,

  // Auth
  user: JSON.parse(localStorage.getItem('crm_user') || 'null'),
  token: localStorage.getItem('crm_token') || null,
  isAuthenticated: !!localStorage.getItem('crm_token'),

  // ── Auth ───────────────────────────────────────────────────
  login: async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.success) {
      localStorage.setItem('crm_token', data.token);
      localStorage.setItem('crm_user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isAuthenticated: true });
      initSocket(set, get);
      // Load all real data immediately after login
      await get().loadAllData();
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    socket?.disconnect();
    socket = null;
    set({ token: null, user: null, isAuthenticated: false, socketConnected: false, chats: [], messages: [], contacts: [] });
  },

  // ── Load all data from backend ─────────────────────────────
  loadAllData: async () => {
    await Promise.all([
      get().loadChats(),
      get().loadContacts(),
    ]);
  },

  loadChats: async () => {
    set({ isLoadingChats: true });
    try {
      const data = await apiFetch('/api/conversations');
      if (data.success && data.data) {
        // Map backend conversations to chat format
        const chats = data.data.map(conv => ({
          id: conv.id,
          contact: {
            id: conv.contact?.id || conv.contact_id,
            name: conv.contact?.name || 'Unknown',
            phone: conv.contact?.phone || '',
            isOnline: conv.contact?.is_online || false,
            lastSeen: conv.contact?.last_seen || null,
          },
          lastMessage: conv.lastMessage || '',
          lastMessageTime: conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unreadCount: conv.unreadCount || 0,
          assignedAgent: conv.assigned_agent || null,
          status: conv.status || 'open',
          isTyping: false,
        }));
        set({ chats });
      }
    } catch { /* keep empty */ } finally {
      set({ isLoadingChats: false });
    }
  },

  loadContacts: async () => {
    try {
      const data = await apiFetch('/api/contacts');
      if (data.success && data.data) set({ contacts: data.data });
    } catch { /* keep empty */ }
  },

  // ── Init (called on app mount if already logged in) ────────
  initSocket: () => initSocket(set, get),
  initApp: async () => {
    if (localStorage.getItem('crm_token')) {
      initSocket(set, get);
      await get().loadAllData();
    }
  },

  // ── UI ─────────────────────────────────────────────────────
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDarkMode: () => set(state => {
    const next = !state.isDarkMode;
    document.documentElement.classList.toggle('dark', next);
    return { isDarkMode: next };
  }),

  // ── Chat ───────────────────────────────────────────────────
  setSelectedChat: (id) => {
    set({ selectedChatId: id });
    if (socket && id) socket.emit('join_chat', id);
    set(state => ({ chats: state.chats.map(c => c.id === id ? { ...c, unreadCount: 0 } : c) }));
    if (id) get().loadMessages(id);
  },

  loadMessages: async (chatId) => {
    set({ isLoadingMessages: true });
    try {
      const data = await apiFetch(`/api/messages/${chatId}`);
      if (data.success && data.data) {
        set(state => ({
          messages: [
            ...state.messages.filter(m => m.chatId !== chatId && m.conversation_id !== chatId),
            ...data.data,
          ],
        }));
      }
    } catch { /* keep existing */ } finally {
      set({ isLoadingMessages: false });
    }
  },

  addMessage: async (message) => {
    // Optimistic UI
    set(state => ({
      messages: [...state.messages, message],
      chats: state.chats.map(c =>
        c.id === message.chatId ? { ...c, lastMessage: message.content, lastMessageTime: 'Just now' } : c
      ),
    }));
    if (socket) socket.emit('send_message', message);
    try {
      const data = await apiFetch('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify({ chatId: message.chatId, content: message.content, type: message.type || 'text' }),
      });
      if (data.success && data.data?.id) {
        set(state => ({
          messages: state.messages.map(m => m.id === message.id ? { ...m, ...data.data } : m),
        }));
      }
    } catch { /* message stays in UI */ }
  },
}));
