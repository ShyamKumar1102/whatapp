import { useState } from 'react';
import { Bell, Search, LogOut, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore.js';

export default function Topbar() {
  const navigate = useNavigate();
  const { chats, contacts, setSelectedChat, user, logout, toggleSidebar, notifications, markRead, markAllRead } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(query.length > 0);
  };

  const searchResults = searchQuery.length > 0 ? [
    ...chats.filter(c => c.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(c => ({ ...c, type: 'chat' })),
    ...contacts.filter(c =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery)
    ).map(c => ({ ...c, type: 'contact' })),
  ].slice(0, 5) : [];

  const handleResultClick = (result) => {
    if (result.type === 'chat') { setSelectedChat(result.id); navigate('/chats'); }
    else navigate('/contacts');
    setSearchQuery('');
    setShowResults(false);
  };

  const handleNotifClick = (n) => {
    markRead(n.id);
    if (n.chatId) { setSelectedChat(n.chatId); navigate('/chats'); }
    setShowNotif(false);
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 gap-3">
      {/* Left — hamburger + search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button onClick={toggleSidebar} className="md:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors shrink-0">
          <Menu className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setShowResults(searchQuery.length > 0)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="pl-9 h-9 bg-muted/50 border-none text-sm"
          />
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.type}-${result.id || index}`}
                  onClick={() => handleResultClick(result)}
                  className="flex items-center gap-3 p-3 hover:bg-surface-hover cursor-pointer border-b border-border/50 last:border-0"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-primary">
                      {(result.contact?.name || result.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{result.contact?.name || result.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.type === 'chat' ? result.lastMessage : result.phone}</p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize shrink-0">{result.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right — bell + user + logout */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors">
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">
                  Notifications {unread > 0 && <span className="ml-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{unread}</span>}
                </span>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">Mark all read</button>}
                  <button onClick={() => setShowNotif(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">All caught up!</p>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer hover:bg-surface-hover transition-colors ${!n.read ? 'bg-accent/20' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground">{n.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {(user?.name || 'AD').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-none">{user?.name || 'Admin'}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role || 'agent'}</p>
          </div>
        </div>

        <button onClick={() => { logout(); navigate('/login'); }} title="Logout" className="p-2 rounded-lg hover:bg-surface-hover transition-colors">
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
