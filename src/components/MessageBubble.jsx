import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isOutgoing = message.sender === 'user' || message.sender === 'agent';

  const StatusIcon = () => {
    if (!isOutgoing) return null;
    if (message.status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-info" />;
    if (message.status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
    return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className={cn('flex animate-fade-in', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] px-3 py-2 rounded-xl text-sm shadow-sm',
          isOutgoing
            ? 'bg-chat-outgoing rounded-br-sm'
            : 'bg-chat-incoming rounded-bl-sm border border-border'
        )}
      >
        <p className="text-foreground leading-relaxed">{message.content}</p>
        <div className={cn('flex items-center gap-1 mt-1', isOutgoing ? 'justify-end' : 'justify-start')}>
          <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
          <StatusIcon />
        </div>
      </div>
    </div>
  );
}