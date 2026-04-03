import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import Topbar from '@/components/Topbar';
import { useStore } from '@/store/useStore.js';
import useReminderNotifications from '@/hooks/useReminderNotifications';

export default function AppLayout() {
  const { initApp, setSelectedChat } = useStore();
  const navigate = useNavigate();
  useReminderNotifications();

  useEffect(() => { initApp(); }, []);

  // Handle click on toast notification → navigate to chat
  useEffect(() => {
    const handler = (e) => {
      setSelectedChat(e.detail.chatId);
      navigate('/chats');
    };
    window.addEventListener('navigate-to-chat', handler);
    return () => window.removeEventListener('navigate-to-chat', handler);
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
