import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReminderCard({ reminder, onEdit, onDelete, onComplete }) {
  const getBadgeVariant = (status, dueDate) => {
    if (status === 'completed') return 'default';
    
    if (dueDate) {
      const due = new Date(dueDate);
      const now = new Date();
      if (due <= now) return 'destructive'; // Due/overdue
    }
    
    return 'secondary'; // Pending
  };

  const getBadgeText = (status, dueDate) => {
    if (status === 'completed') return 'completed';
    
    if (dueDate) {
      const due = new Date(dueDate);
      const now = new Date();
      if (due <= now) return 'due';
    }
    
    return 'pending';
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {reminder.title}
          </h3>
          {reminder.description && (
            <p className="text-xs text-muted-foreground mb-2">
              {reminder.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDueDate(reminder.due_date)}
          </p>
        </div>
        <Badge variant={getBadgeVariant(reminder.status, reminder.due_date)}>
          {getBadgeText(reminder.status, reminder.due_date)}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        {reminder.status !== 'completed' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onComplete(reminder.id)}
            className="text-primary hover:text-primary"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Complete
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onEdit(reminder)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onDelete(reminder.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}