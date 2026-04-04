import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle, FileText, Receipt, IndianRupee, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_CONFIG = {
  general:   { label: 'General',           icon: Bell,         color: 'bg-blue-500/10 text-blue-600',    border: 'border-blue-200' },
  quotation: { label: 'Quotation',          icon: FileText,     color: 'bg-purple-500/10 text-purple-600', border: 'border-purple-200' },
  invoice:   { label: 'Invoice',            icon: Receipt,      color: 'bg-orange-500/10 text-orange-600', border: 'border-orange-200' },
  payment:   { label: 'Payment Collection', icon: IndianRupee,  color: 'bg-green-500/10 text-green-600',   border: 'border-green-200' },
};

export default function ReminderCard({ reminder, onEdit, onDelete, onComplete }) {
  const type = TYPE_CONFIG[reminder.type] || TYPE_CONFIG.general;
  const TypeIcon = type.icon;

  const getBadgeVariant = (status, dueDate) => {
    if (status === 'completed') return 'default';
    if (dueDate && new Date(dueDate) <= new Date()) return 'destructive';
    return 'secondary';
  };

  const getBadgeText = (status, dueDate) => {
    if (status === 'completed') return 'Completed';
    if (dueDate && new Date(dueDate) <= new Date()) return 'Overdue';
    return 'Pending';
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)  return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  return (
    <div className={cn('rounded-xl border bg-card shadow-sm p-4 flex flex-col gap-3', type.border)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', type.color)}>
            <TypeIcon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{type.label}</p>
            <h3 className="text-sm font-semibold text-foreground truncate">{reminder.title}</h3>
          </div>
        </div>
        <Badge variant={getBadgeVariant(reminder.status, reminder.due_date)} className="shrink-0 text-[10px]">
          {getBadgeText(reminder.status, reminder.due_date)}
        </Badge>
      </div>

      {/* Amount */}
      {reminder.amount && (
        <div className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold', type.color)}>
          <IndianRupee className="w-3.5 h-3.5" />
          {Number(reminder.amount).toLocaleString('en-IN')}
        </div>
      )}

      {/* Description + Due */}
      <div className="space-y-1">
        {reminder.description && <p className="text-xs text-muted-foreground">{reminder.description}</p>}
        <p className="text-xs text-muted-foreground">{formatDueDate(reminder.due_date)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1 border-t border-border/50">
        {reminder.status !== 'completed' && onComplete && (
          <Button variant="ghost" size="sm" onClick={() => onComplete(reminder.id)} className="text-primary hover:text-primary text-xs h-7 px-2 flex-1">
            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark Done
          </Button>
        )}
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(reminder)} className="h-7 w-7 p-0">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(reminder.id)} className="text-destructive hover:text-destructive h-7 w-7 p-0">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}