import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Users, Megaphone,
  FileText, ShieldCheck, Settings, Moon, Sun,
  ChevronLeft, ChevronRight, MessageCircle,
  Bell, Columns, ArrowLeftRight, Lock, LogOut, UserCog,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRole }  from '@/hooks/useRole';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/',            adminOnly: false },
  { icon: MessageSquare,   label: 'Chats',         path: '/chats',       adminOnly: false, badge: 6 },
  { icon: Users,           label: 'Contacts',      path: '/contacts',    adminOnly: false },
  { icon: Columns,         label: 'Pipeline',      path: '/pipeline',    adminOnly: false },
  { icon: Bell,            label: 'Reminders',     path: '/reminders',   adminOnly: false },
  { icon: FileText,        label: 'Templates',     path: '/templates',   adminOnly: false },
  { icon: Megaphone,       label: 'Campaigns',     path: '/campaigns',   adminOnly: true  },
  { icon: UserCog,         label: 'Agents',        path: '/agents',      adminOnly: true  },
  { icon: ArrowLeftRight,  label: 'Import/Export', path: '/import-export', adminOnly: true },
  { icon: ShieldCheck,     label: 'Verification',  path: '/verification', adminOnly: true },
  { icon: Settings,        label: 'Settings',      path: '/settings',    adminOnly: true  },
];

export default function AppSidebar() {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode, sidebarCollapsed, toggleSidebar, user, logout } = useStore();
  const { isAdmin } = useRole();

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className={cn(
      'h-screen flex flex-col bg-card border-r border-border transition-all duration-300 shrink-0 relative',
      sidebarCollapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-semibold text-foreground text-sm tracking-tight">WhatsApp CRM</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive  = location.pathname === item.path;
          const isLocked  = item.adminOnly && !isAdmin;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : isLocked
                    ? 'text-muted-foreground/40 cursor-pointer'
                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
              )}
              title={isLocked ? 'Admin only' : item.label}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {/* Lock icon for admin-only items when agent */}
              {isLocked && !sidebarCollapsed && (
                <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />
              )}
              {isLocked && sidebarCollapsed && (
                <Lock className="w-2.5 h-2.5 text-muted-foreground/40 absolute -top-0.5 -right-0.5" />
              )}
              {/* Unread badge */}
              {item.badge > 0 && !isLocked && (
                <span className={cn(
                  'min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold',
                  sidebarCollapsed ? 'absolute -top-0.5 -right-0.5' : 'ml-auto'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info + role badge */}
      <div className="border-t border-border p-2 space-y-1 shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-primary-foreground">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.name || 'User'}</p>
              <span className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {isAdmin ? 'Admin' : 'Agent'}
              </span>
            </div>
          </div>
        )}

        <button onClick={toggleDarkMode}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors w-full">
          {isDarkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!sidebarCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full">
          <LogOut className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-surface-hover transition-colors z-10">
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
