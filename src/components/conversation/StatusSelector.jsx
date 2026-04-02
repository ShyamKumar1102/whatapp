import { cn } from '@/lib/utils';

export default function StatusSelector({ currentStatus, onStatusChange }) {
  const statuses = [
    { value: 'open', label: 'Open', color: 'bg-green-500' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-400' }
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground p-4">
        Conversation Status
      </h3>
      <div className="mx-4 rounded-xl border bg-background overflow-hidden divide-y divide-border">
        {statuses.map((status) => (
          <div
            key={status.value}
            className={cn(
              'flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors',
              currentStatus === status.value && 'bg-accent'
            )}
            onClick={() => onStatusChange(status.value)}
          >
            <div className={cn('w-3 h-3 rounded-full', status.color)} />
            <span className="text-sm text-foreground">{status.label}</span>
            {currentStatus === status.value && (
              <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}