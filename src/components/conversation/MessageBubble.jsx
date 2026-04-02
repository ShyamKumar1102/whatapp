import { cn } from '@/lib/utils';

export default function MessageBubble({ message }) {
  const isAgent = message.sender_type === 'agent';
  const isSystem = message.sender_type === 'system';
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center mb-4">
        <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex mb-4', isAgent ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[70%] rounded-xl px-4 py-2 text-sm',
        isAgent 
          ? 'ml-auto bg-primary text-primary-foreground'
          : 'mr-auto bg-muted text-foreground'
      )}>
        <p>{message.content}</p>
        <p className="text-[10px] opacity-70 mt-1 text-right">
          {formatTime(message.sent_at)}
        </p>
      </div>
    </div>
  );
}