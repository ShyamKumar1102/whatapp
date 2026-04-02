import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ReminderFilters from '@/components/reminders/ReminderFilters';
import ReminderCard from '@/components/reminders/ReminderCard';
import ReminderModal from '@/components/reminders/ReminderModal';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for now - replace with API calls
  useEffect(() => {
    const mockReminders = [
      {
        id: 1,
        title: 'Follow up with John Doe',
        description: 'Check on the proposal status',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Prepare monthly report',
        description: 'Compile analytics and performance metrics',
        due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Team meeting preparation',
        description: 'Review agenda and prepare slides',
        due_date: null,
        status: 'completed',
        created_at: new Date().toISOString()
      }
    ];
    setReminders(mockReminders);
  }, []);

  useEffect(() => {
    let filtered = reminders;
    
    if (activeFilter === 'due') {
      filtered = reminders.filter(r => {
        if (!r.due_date || r.status === 'completed') return false;
        const dueDate = new Date(r.due_date);
        const now = new Date();
        return dueDate <= now;
      });
    } else if (activeFilter !== 'all') {
      filtered = reminders.filter(r => r.status === activeFilter);
    }
    
    setFilteredReminders(filtered);
  }, [reminders, activeFilter]);

  const handleCreateReminder = () => {
    setEditingReminder(null);
    setIsModalOpen(true);
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setIsModalOpen(true);
  };

  const handleSaveReminder = async (formData) => {
    setIsLoading(true);
    try {
      // Mock save - replace with API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingReminder) {
        // Update existing
        setReminders(prev => prev.map(r => 
          r.id === editingReminder.id 
            ? { ...r, ...formData, updated_at: new Date().toISOString() }
            : r
        ));
      } else {
        // Create new
        const newReminder = {
          id: Date.now(),
          ...formData,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setReminders(prev => [newReminder, ...prev]);
      }
      
      setIsModalOpen(false);
      setEditingReminder(null);
    } catch (error) {
      console.error('Error saving reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
      // Mock delete - replace with API call
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleCompleteReminder = async (id) => {
    try {
      // Mock complete - replace with API call
      setReminders(prev => prev.map(r => 
        r.id === id 
          ? { ...r, status: 'completed', updated_at: new Date().toISOString() }
          : r
      ));
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reminders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {reminders.length} total reminders
          </p>
        </div>
        <Button variant="default" onClick={handleCreateReminder}>
          <Plus className="h-4 w-4 mr-2" />
          New Reminder
        </Button>
      </div>

      <ReminderFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        reminders={reminders}
      />

      <div className="mt-4">
        {filteredReminders.length === 0 ? (
          <div className="mt-4 rounded-xl border-2 border-dashed border-border bg-card flex items-center justify-center h-40">
            <p className="text-sm text-muted-foreground">No reminders found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={handleEditReminder}
                onDelete={handleDeleteReminder}
                onComplete={handleCompleteReminder}
              />
            ))}
          </div>
        )}
      </div>

      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        reminder={editingReminder}
        isLoading={isLoading}
      />
    </div>
  );
}