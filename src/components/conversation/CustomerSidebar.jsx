import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StatusSelector from './StatusSelector';
import InternalNotes from './InternalNotes';

export default function CustomerSidebar({ 
  conversation, 
  notes, 
  onStatusChange, 
  onAddNote, 
  onPushToAdmin 
}) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="w-80 flex flex-col overflow-y-auto bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Customer Details</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Conversation information and actions
        </p>
      </div>

      {/* Customer Card */}
      <div className="m-4 rounded-xl border bg-background p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
              {getInitials(conversation.contact_name)}
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <span className="text-[10px] font-semibold text-accent-foreground">85</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              {conversation.contact_name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {conversation.contact_phone}
            </p>
            <p className="text-xs text-muted-foreground">
              {conversation.contact_email}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 mb-3">
          <Badge variant="secondary">Customer</Badge>
          <Badge variant="outline">Lead</Badge>
        </div>
        
        <Button 
          className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={onPushToAdmin}
        >
          Push to Admin
        </Button>
      </div>

      {/* Conversation Metadata */}
      <div className="mx-4 rounded-xl border bg-background p-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Conversation Info
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground font-medium">Channel</span>
            <p className="text-foreground font-semibold capitalize">
              {conversation.channel}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Started</span>
            <p className="text-foreground font-semibold">
              {formatDate(conversation.created_at)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Agent</span>
            <p className="text-foreground font-semibold">
              Agent {conversation.assigned_agent_id || '1'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Updated</span>
            <p className="text-foreground font-semibold">
              {formatDate(conversation.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Status Selector */}
      <StatusSelector
        currentStatus={conversation.status}
        onStatusChange={onStatusChange}
      />

      {/* Internal Notes */}
      <div className="mt-6 flex-1">
        <InternalNotes
          notes={notes}
          onAddNote={onAddNote}
        />
      </div>
    </div>
  );
}