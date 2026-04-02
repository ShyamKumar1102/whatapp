import { cn } from '@/lib/utils';

export default function ChatCard({ chat, isSelected, onClick }) {
  const initials = chat.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50',
        isSelected ? 'bg-accent' : 'hover:bg-surface-hover'
      )}
    >
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">{initials}</span>
        </div>
        {chat.contact.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-online border-2 border-card" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground truncate">{chat.contact.name}</span>
          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{chat.lastMessageTime}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-muted-foreground truncate pr-2">{chat.lastMessage}</p>
          {chat.unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold shrink-0">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}