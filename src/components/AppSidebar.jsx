import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Users, Megaphone,
  FileText, ShieldCheck, Settings, Moon, Sun,
  ChevronLeft, ChevronRight, MessageCircle,
  Bell, Columns, ArrowLeftRight, Lock, LogOut, UserCog, MoreHorizontal,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRole }  from '@/hooks/useRole';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/',            adminOnly: false },
  { icon: MessageSquare,   label: 'Chats',         path: '/chats',       adminOnly: false },
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

// Bottom nav shows only top 4 items + More
const bottomNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: MessageSquare,   label: 'Chats',     path: '/chats' },
  { icon: Users,           label: 'Contacts',  path: '/contacts' },
  { icon: Bell,            label: 'Reminders', path: '/reminders' },
];

export default function AppSidebar() {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode, sidebarCollapsed, toggleSidebar, user, logout, chats } = useStore();
  const { isAdmin } = useRole();
  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className={cn(
        'hidden md:flex h-screen flex-col bg-card border-r border-border transition-all duration-300 shrink-0 relative',
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
                {!sidebarCollapsed && <span className="truncate flex-1">{item.label}</span>}
                {isLocked && !sidebarCollapsed && <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                {isLocked && sidebarCollapsed && <Lock className="w-2.5 h-2.5 text-muted-foreground/40 absolute -top-0.5 -right-0.5" />}
                {item.path === '/chats' && totalUnread > 0 && !isLocked && (
                  <span className={cn(
                    'min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold',
                    sidebarCollapsed ? 'absolute -top-0.5 -right-0.5' : 'ml-auto'
                  )}>
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-border p-2 space-y-1 shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-[10px] font-semibold text-primary-foreground">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{user?.name || 'User'}</p>
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                  {isAdmin ? 'Admin' : 'Agent'}
                </span>
              </div>
            </div>
          )}
          <button onClick={toggleDarkMode} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors w-full">
            {isDarkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            {!sidebarCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full">
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        <button onClick={toggleSidebar} className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-surface-hover transition-colors z-10">
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around px-2 h-16 safe-area-pb">
        {bottomNavItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors relative min-w-[48px]',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.path === '/chats' && totalUnread > 0 && (
                <span className="absolute top-0 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-semibold px-1">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </Link>
          );
        })}
        {/* More button */}
        <button onClick={() => setShowMobileMenu(true)} className={cn(
          'flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[48px]',
          showMobileMenu ? 'text-primary' : 'text-muted-foreground'
        )}>
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* ── Mobile More Menu Overlay ── */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <div className="relative bg-card rounded-t-2xl border-t border-border p-4 pb-8">
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">{initials}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.name || 'User'}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                  {isAdmin ? 'Admin' : 'Agent'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {navItems.filter(i => !bottomNavItems.find(b => b.path === i.path)).map(item => {
                const isLocked = item.adminOnly && !isAdmin;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors',
                      isActive ? 'bg-accent border-primary/20 text-primary' : 'border-border text-muted-foreground hover:bg-muted',
                      isLocked && 'opacity-40'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={toggleDarkMode} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
              <button onClick={() => { logout(); setShowMobileMenu(false); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
