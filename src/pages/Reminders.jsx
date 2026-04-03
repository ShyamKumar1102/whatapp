import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ReminderFilters from '@/components/reminders/ReminderFilters';
import ReminderCard from '@/components/reminders/ReminderCard';
import ReminderModal from '@/components/reminders/ReminderModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useRole } from '@/hooks/useRole';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { isAdmin } = useRole();

  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const token = localStorage.getItem('crm_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  // Load reminders from backend on mount
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res  = await fetch(`${BACKEND}/api/reminders`, { headers });
        const data = await res.json();
        if (data.success) setReminders(data.data || []);
      } catch { /* ignore */ }
    };
    fetchReminders();
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
      if (editingReminder) {
        const res = await fetch(`${BACKEND}/api/reminders/${editingReminder.id}`, { method: 'PUT', headers, body: JSON.stringify(formData) });
        const data = await res.json();
        if (data.success) {
          setReminders(prev => prev.map(r => r.id === editingReminder.id ? { ...r, ...formData } : r));
        }
      } else {
        const res = await fetch(`${BACKEND}/api/reminders`, { method: 'POST', headers, body: JSON.stringify(formData) });
        const data = await res.json();
        if (data.success) {
          setReminders(prev => [data.data, ...prev]);
        } else {
          // fallback: add locally
          setReminders(prev => [{ id: Date.now(), ...formData, status: 'pending', created_at: new Date().toISOString() }, ...prev]);
        }
      }
      setIsModalOpen(false);
      setEditingReminder(null);
    } catch {
      // offline fallback
      if (editingReminder) {
        setReminders(prev => prev.map(r => r.id === editingReminder.id ? { ...r, ...formData } : r));
      } else {
        setReminders(prev => [{ id: Date.now(), ...formData, status: 'pending', created_at: new Date().toISOString() }, ...prev]);
      }
      setIsModalOpen(false);
      setEditingReminder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await fetch(`${BACKEND}/api/reminders/${id}`, { method: 'DELETE', headers });
    } catch { /* ignore */ }
    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success('Reminder deleted.');
  };

  const handleCompleteReminder = async (id) => {
    try {
      await fetch(`${BACKEND}/api/reminders/${id}/complete`, { method: 'PATCH', headers });
    } catch { /* ignore */ }
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reminders</h1>
          <p className="text-sm text-muted-foreground mt-1">{reminders.length} total reminders</p>
        </div>
        {isAdmin && (
          <Button variant="default" onClick={handleCreateReminder}>
            <Plus className="h-4 w-4 mr-2" /> New Reminder
          </Button>
        )}
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
                onEdit={isAdmin ? handleEditReminder : undefined}
                onDelete={isAdmin ? (id) => setConfirmDeleteId(id) : undefined}
                onComplete={isAdmin ? handleCompleteReminder : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!confirmDeleteId} title="Delete Reminder" description="This reminder will be permanently deleted." confirmLabel="Delete" onConfirm={() => handleDeleteReminder(confirmDeleteId)} onCancel={() => setConfirmDeleteId(null)} />
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