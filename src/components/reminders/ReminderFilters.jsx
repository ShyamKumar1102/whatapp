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
    <Tabs value={activeFilter} onValueChange={onFilterChange} className="mt-6">
      <TabsList>
        <TabsTrigger value="all">
          All ({getFilterCount('all')})
        </TabsTrigger>
        <TabsTrigger value="due">
          Due ({getFilterCount('due')})
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending ({getFilterCount('pending')})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({getFilterCount('completed')})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}