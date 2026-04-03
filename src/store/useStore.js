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
  // Auto-logout on 401 — token expired or invalid
  if (res.status === 401) {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    window.location.href = '/login';
    return { success: false, message: 'Session expired' };
  }
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
    const { chats, messages, selectedChatId, addNotification } = get();
    set({ messages: [...messages, message] });
    set({
      chats: chats.map(c =>
        c.id === message.chatId
          ? { ...c, lastMessage: message.content, lastMessageTime: 'Just now', unreadCount: c.id === selectedChatId ? 0 : (c.unreadCount || 0) + 1 }
          : c
      ),
    });
    if (message.sender === 'contact' && message.chatId !== selectedChatId) {
      const chat = chats.find(c => c.id === message.chatId);
      const name = chat?.contact?.name || message.contact?.name || 'Someone';
      addNotification({ text: `New message from ${name}`, chatId: message.chatId });
      import('sonner').then(({ toast }) => {
        toast(`💬 ${name}`, {
          description: message.content?.slice(0, 60) || 'New message',
          duration: 6000,
          action: {
            label: 'Open',
            onClick: () => window.dispatchEvent(new CustomEvent('navigate-to-chat', { detail: { chatId: message.chatId } })),
          },
        });
      });
    }
  });

  socket.on('conversation_created', (conv) => {
    const { chats, addNotification } = get();
    if (!chats.find(c => c.id === conv.id)) {
      set({ chats: [{ id: conv.id, contact: conv.contact, lastMessage: '', lastMessageTime: 'Just now', unreadCount: 1, assignedAgent: null }, ...chats] });
      addNotification({ text: `New conversation from ${conv.contact?.name || 'Unknown'}`, chatId: conv.id });
    }
  });

  socket.on('message_status', ({ messageId, status }) => {
    set(state => ({ messages: state.messages.map(m => m.id === messageId ? { ...m, status } : m) }));
  });

  socket.on('conversation_label', ({ id, label }) => {
    set(state => ({ chats: state.chats.map(c => c.id === id ? { ...c, label } : c) }));
  });

  socket.on('conversation_assigned', ({ id, agent_id }) => {
    const { user, addNotification } = get();
    set(state => ({ chats: state.chats.map(c => c.id === id ? { ...c, assignedAgent: agent_id } : c) }));
    // Notify if this agent is the one being assigned
    if (user && (user.id === agent_id || user.name === agent_id)) {
      addNotification({ text: 'A chat was assigned to you', chatId: id });
      import('sonner').then(({ toast }) => {
        toast.info('💬 New chat assigned to you!', {
          duration: 8000,
          action: {
            label: 'Open',
            onClick: () => window.dispatchEvent(new CustomEvent('navigate-to-chat', { detail: { chatId: id } })),
          },
        });
      });
      // Sound
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(660, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
      } catch { /* ignore */ }
    }
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

  // notifications state
  notifications: [],
  addNotification: (notif) => set(state => ({
    notifications: [{ id: Date.now(), read: false, time: 'Just now', ...notif }, ...state.notifications].slice(0, 20),
  })),
  markAllRead: () => set(state => ({ notifications: state.notifications.map(n => ({ ...n, read: true })) })),
  markRead: (id) => set(state => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),

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
    // Check for overdue reminders and add notifications
    try {
      const token = localStorage.getItem('crm_token');
      const res = await fetch(`${BACKEND}/api/reminders`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        const now = new Date();
        const overdue = data.data.filter(r => r.status === 'pending' && r.due_date && new Date(r.due_date) < now);
        overdue.forEach(r => get().addNotification({ text: `⚠️ Overdue reminder: ${r.title}`, chatId: null }));
      }
    } catch { /* ignore */ }
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
          label: conv.label || null,
          pushed_to_admin: conv.pushed_to_admin || false,
          created_at: conv.created_at || null,
          updated_at: conv.updated_at || null,
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
      // Add a welcome notification so bell is not empty
      get().addNotification({ text: 'Welcome back! CRM is ready.', chatId: null });
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
