import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Users, Megaphone,
  FileText, ShieldCheck, BarChart3, Settings, Moon, Sun,
  ChevronLeft, ChevronRight, MessageCircle,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: MessageSquare, label: 'Chats', path: '/chats', badge: 6 },
  { icon: Users, label: 'Contacts', path: '/contacts' },
  { icon: Megaphone, label: 'Campaigns', path: '/campaigns' },
  { icon: FileText, label: 'Templates', path: '/templates' },
  { icon: ShieldCheck, label: 'Verification', path: '/verification' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function AppSidebar() {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode, sidebarCollapsed, toggleSidebar } = useStore();

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-card border-r border-border transition-all duration-300 relative shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-semibold text-foreground text-sm tracking-tight">WA CRM</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative group',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
              )}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.badge && item.badge > 0 && (
                <span className={cn(
                  'ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold',
                  sidebarCollapsed && 'absolute -top-0.5 -right-0.5 ml-0'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border p-2 space-y-0.5">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors w-full"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5 shrink-0" /> : <Moon className="w-4.5 h-4.5 shrink-0" />}
          {!sidebarCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-surface-hover transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
