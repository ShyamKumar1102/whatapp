import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ReminderFilters({ activeFilter, onFilterChange, reminders }) {
  const getFilterCount = (filter) => {
    if (filter === 'all') return reminders.length;
    if (filter === 'due') {
      return reminders.filter(r => {
        if (!r.due_date) return false;
        const dueDate = new Date(r.due_date);
        const now = new Date();
        return dueDate <= now && r.status !== 'completed';
      }).length;
    }
    return reminders.filter(r => r.status === filter).length;
  };

  return (
    <Tabs value={activeFilter} onValueChange={onFilterChange} className="mt-4">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
        <TabsTrigger value="all" className="text-xs">All ({getFilterCount('all')})</TabsTrigger>
        <TabsTrigger value="due" className="text-xs">Due ({getFilterCount('due')})</TabsTrigger>
        <TabsTrigger value="pending" className="text-xs">Pending ({getFilterCount('pending')})</TabsTrigger>
        <TabsTrigger value="completed" className="text-xs">Completed ({getFilterCount('completed')})</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}