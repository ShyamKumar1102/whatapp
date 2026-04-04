import { cn } from '@/lib/utils';

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'due',       label: 'Overdue' },
  { key: 'pending',   label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'payment',   label: '💰 Payment' },
  { key: 'invoice',   label: '🧾 Invoice' },
  { key: 'quotation', label: '📄 Quotation' },
];

export default function ReminderFilters({ activeFilter, onFilterChange, reminders }) {
  const getCount = (key) => {
    if (key === 'all') return reminders.length;
    if (key === 'due') return reminders.filter(r => r.status !== 'completed' && r.due_date && new Date(r.due_date) <= new Date()).length;
    if (['payment','invoice','quotation'].includes(key)) return reminders.filter(r => r.type === key && r.status !== 'completed').length;
    return reminders.filter(r => r.status === key).length;
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {FILTERS.map(f => {
        const count = getCount(f.key);
        return (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border shrink-0',
              activeFilter === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            {f.label}{count > 0 && <span className="ml-1.5 bg-current/20 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}