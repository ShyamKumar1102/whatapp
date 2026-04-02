import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import Topbar from '@/components/Topbar';
import { useStore } from '@/store/useStore.js';

export default function AppLayout() {
  const { initApp } = useStore();

  useEffect(() => {
    initApp();
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
