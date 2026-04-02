import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Topbar() {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search chats, contacts..."
          className="pl-9 h-9 bg-muted/50 border-none text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors">
          <Bell className="w-4.5 h-4.5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">AK</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-none">Admin</p>
            <p className="text-xs text-muted-foreground mt-0.5">Business Account</p>
          </div>
        </div>
      </div>
    </header>
  );
}
