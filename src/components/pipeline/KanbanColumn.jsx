import { Badge } from '@/components/ui/badge';
import ContactCard from './ContactCard';

export default function KanbanColumn({ stage, stages, onMoveContact, onOpenChat }) {
  const getStageColor = (color) => {
    const colorMap = {
      'grey': 'bg-gray-400',
      'blue': 'bg-blue-500',
      'orange': 'bg-orange-400',
      'green': 'bg-green-500'
    };
    return colorMap[color] || 'bg-gray-400';
  };

  return (
    <div className="min-w-[280px] w-[280px] flex flex-col">
      <div className="rounded-xl border bg-card shadow-sm flex flex-col h-full">
        {/* Column Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full ${getStageColor(stage.color)}`}
              style={{ backgroundColor: stage.color === 'grey' ? '#9ca3af' : undefined }}
            />
            <h3 className="text-sm font-semibold text-foreground">
              {stage.name}
            </h3>
          </div>
          <Badge variant="secondary">
            {stage.contacts?.length || 0}
          </Badge>
        </div>
        
        {/* Cards Area */}
        <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1">
          {stage.contacts?.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              stages={stages}
              onMove={onMoveContact}
              onOpenChat={onOpenChat}
            />
          ))}
          
          {(!stage.contacts || stage.contacts.length === 0) && (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
              No contacts in this stage
            </div>
          )}
        </div>
      </div>
    </div>
  );
}