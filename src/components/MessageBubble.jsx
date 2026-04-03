import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Trash2, Copy, ChevronDown } from 'lucide-react';

export default function MessageBubble({ message, onDeleteForMe, onDeleteForEveryone }) {
  const isOutgoing = message.sender === 'user' || message.sender === 'agent';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  if (message.deleted_for_me) return null;

  const isDeleted = message.deleted_for_everyone;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const handleDeleteMe = () => {
    setShowMenu(false);
    onDeleteForMe?.(message.id);
  };

  const handleDeleteEveryone = () => {
    setShowMenu(false);
    onDeleteForEveryone?.(message.id);
  };

  const StatusIcon = () => {
    if (!isOutgoing || isDeleted) return null;
    if (message.status === 'read')      return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
    if (message.status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
    return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className={cn('flex animate-fade-in group', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div className="relative max-w-[70%]">

        {/* Bubble */}
        <div
          className={cn(
            'px-3 py-2 rounded-xl text-sm shadow-sm',
            isOutgoing ? 'bg-chat-outgoing rounded-br-sm' : 'bg-chat-incoming rounded-bl-sm border border-border',
            isDeleted && 'opacity-60'
          )}
        >
          {isDeleted ? (
            <p className="text-muted-foreground text-xs italic flex items-center gap-1">
              <Trash2 className="w-3 h-3" />
              {isOutgoing ? 'You deleted this message' : 'This message was deleted'}
            </p>
          ) : (
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
          <div className={cn('flex items-center gap-1 mt-1', isOutgoing ? 'justify-end' : 'justify-start')}>
            <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
            <StatusIcon />
          </div>
        </div>

        {/* Dropdown arrow — appears on hover */}
        {!isDeleted && (
          <button
            onClick={() => setShowMenu(v => !v)}
            className={cn(
              'absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity',
              'w-5 h-5 rounded-full bg-muted flex items-center justify-center shadow-sm hover:bg-muted/80',
              isOutgoing ? 'left-[-22px]' : 'right-[-22px]'
            )}
          >
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        )}

        {/* Dropdown menu — positioned relative to bubble */}
        {showMenu && (
          <div
            ref={menuRef}
            className={cn(
              'absolute top-8 z-50 bg-card border border-border rounded-xl shadow-xl py-1 w-48',
              isOutgoing ? 'right-0' : 'left-0'
            )}
          >
            {!isDeleted && (
              <button
                onClick={handleCopy}
                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover flex items-center gap-3 transition-colors"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
                Copy
              </button>
            )}
            <button
              onClick={handleDeleteMe}
              className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover flex items-center gap-3 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
              Delete for Me
            </button>
            {isOutgoing && !isDeleted && (
              <button
                onClick={handleDeleteEveryone}
                className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete for Everyone
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
