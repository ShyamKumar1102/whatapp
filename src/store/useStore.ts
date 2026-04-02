import { create } from 'zustand';
import type { Chat, Message, Contact } from '@/lib/mock-data';
import { chats as mockChats, messages as mockMessages, contacts as mockContacts } from '@/lib/mock-data';

interface AppState {
  chats: Chat[];
  messages: Message[];
  contacts: Contact[];
  selectedChatId: string | null;
  isDarkMode: boolean;
  sidebarCollapsed: boolean;
  setSelectedChat: (id: string | null) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  addMessage: (message: Message) => void;
}

export const useStore = create<AppState>((set) => ({
  chats: mockChats,
  messages: mockMessages,
  contacts: mockContacts,
  selectedChatId: null,
  isDarkMode: false,
  sidebarCollapsed: false,
  setSelectedChat: (id) => set({ selectedChatId: id }),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      document.documentElement.classList.toggle('dark', next);
      return { isDarkMode: next };
    }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
}));
