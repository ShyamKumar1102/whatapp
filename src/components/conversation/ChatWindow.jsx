import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ChatWindow({ 
  conversation, 
  messages, 
  onSendMessage, 
  onSendCompanyDetails,
  isWhatsAppConfigured = false 
}) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'open': return 'default';
      case 'pending': return 'secondary';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Warning Banner */}
      {!isWhatsAppConfigured && (
        <Alert variant="destructive" className="m-4 mb-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>WhatsApp not configured. Messages disabled.</span>
            <Button variant="outline" size="sm">
              Configure Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
            {getInitials(conversation.contact_name)}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {conversation.contact_name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {conversation.contact_phone}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={getBadgeVariant(conversation.status)}>
            {conversation.status}
          </Badge>
          <Badge variant="default">
            <span className="h-2 w-2 rounded-full bg-green-400 mr-1 animate-pulse inline-block" />
            Live
          </Badge>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onSendCompanyDetails={onSendCompanyDetails}
      />
    </div>
  );
}