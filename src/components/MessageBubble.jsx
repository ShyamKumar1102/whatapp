import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Trash2, Copy, Reply } from 'lucide-react';

export default function MessageBubble({ message, onDeleteForMe, onDeleteForEveryone }) {
  const isOutgoing = message.sender === 'user' || message.sender === 'agent';
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);
  const bubbleRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowMenu(true);
    // Position menu near cursor but keep it in viewport
    const x = Math.min(e.clientX, window.innerWidth - 160);
    const y = Math.min(e.clientY, window.innerHeight - 150);
    setMenuPos({ x, y });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const handleDeleteForMe = () => {
    setShowMenu(false);
    if (onDeleteForMe) onDeleteForMe(message.id);
  };

  const handleDeleteForEveryone = () => {
    setShowMenu(false);
    if (onDeleteForEveryone) onDeleteForEveryone(message.id);
  };

  const StatusIcon = () => {
    if (!isOutgoing) return null;
    if (message.deleted_for_everyone) return null;
    if (message.status === 'read')      return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
    if (message.status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
    return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  // Deleted message display
  if (message.deleted_for_me) return null;

  const isDeletedForEveryone = message.deleted_for_everyone;

  return (
    <>
      <div
        ref={bubbleRef}
        className={cn('flex animate-fade-in group', isOutgoing ? 'justify-end' : 'justify-start')}
        onContextMenu={handleContextMenu}
      >
        <div className="relative">
          <div
            className={cn(
              'max-w-[70%] px-3 py-2 rounded-xl text-sm shadow-sm cursor-pointer select-none',
              isOutgoing
                ? 'bg-chat-outgoing rounded-br-sm'
                : 'bg-chat-incoming rounded-bl-sm border border-border',
              isDeletedForEveryone && 'opacity-60 italic'
            )}
          >
            {isDeletedForEveryone ? (
              <p className="text-muted-foreground text-xs flex items-center gap-1">
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

          {/* Hover arrow button */}
          {!isDeletedForEveryone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = bubbleRef.current.getBoundingClientRect();
                setMenuPos({ x: rect.right - 160, y: rect.top + 30 });
                setShowMenu(true);
              }}
              className={cn(
                'absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full bg-background/80 border border-border shadow-sm',
                isOutgoing ? '-left-5' : '-right-5'
              )}
            >
              <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Context Menu — fixed position */}
      {showMenu && (
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-card border border-border rounded-xl shadow-xl py-1 w-48"
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          {!isDeletedForEveryone && (
            <button
              onClick={handleCopy}
              className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover flex items-center gap-3 transition-colors"
            >
              <Copy className="w-4 h-4 text-muted-foreground" />
              Copy
            </button>
          )}

          <button
            onClick={handleDeleteForMe}
            className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover flex items-center gap-3 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" />
            Delete for Me
          </button>

          {/* Delete for Everyone — only for outgoing messages */}
          {isOutgoing && !isDeletedForEveryone && (
            <button
              onClick={handleDeleteForEveryone}
              className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-3 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete for Everyone
            </button>
          )}
        </div>
      )}
    </>
  );
}
