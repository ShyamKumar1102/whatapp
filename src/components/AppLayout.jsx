import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import Topbar from '@/components/Topbar';
import { useStore } from '@/store/useStore.js';

export default function AppLayout() {
  const { initApp, sidebarCollapsed } = useStore();

  useEffect(() => {
    initApp();
  }, []);

  return (
    <div className="h-screen flex overflow-hidden">
      <AppSidebar />
      {/* On mobile, sidebar is fixed overlay so we don't reserve space for it */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
        <Topbar />
        <main className="flex-1 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
