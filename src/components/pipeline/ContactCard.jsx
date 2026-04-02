import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import MoveDropdown from './MoveDropdown';

export default function ContactCard({ contact, stages, onMove, onOpenChat }) {
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'open': return 'default';
      case 'pending': return 'secondary';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (date) => {
    if (!date) return 'No activity';
    
    const now = new Date();
    const updated = new Date(date);
    const diffTime = Math.abs(now - updated);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const handleMove = (stageId) => {
    onMove(contact.id, stageId);
    setShowMoveDropdown(false);
  };

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
          {getInitials(contact.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {contact.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {contact.phone}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <Badge variant={getBadgeVariant(contact.pipeline_status || contact.status)}>
          {contact.pipeline_status || contact.status || 'open'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {getTimeAgo(contact.updated_at)}
        </span>
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1"
          onClick={() => onOpenChat(contact)}
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Open Chat
        </Button>
        
        {showMoveDropdown ? (
          <div className="flex-1">
            <MoveDropdown
              currentStageId={contact.stage_id}
              stages={stages}
              onMove={handleMove}
            />
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowMoveDropdown(true)}
          >
            Move <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}