import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, IndianRupee, FileText, Receipt, AlertCircle } from 'lucide-react';
import ReminderFilters from '@/components/reminders/ReminderFilters';
import ReminderCard from '@/components/reminders/ReminderCard';
import ReminderModal from '@/components/reminders/ReminderModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';

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
      filtered = reminders.filter(r => r.status !== 'completed' && r.due_date && new Date(r.due_date) <= new Date());
    } else if (['payment','invoice','quotation'].includes(activeFilter)) {
      filtered = reminders.filter(r => r.type === activeFilter && r.status !== 'completed');
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

  // Payment summary
  const pending = reminders.filter(r => r.status !== 'completed');
  const totalToCollect  = pending.filter(r => ['payment','invoice'].includes(r.type)).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalQuotations = pending.filter(r => r.type === 'quotation').reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const overduePayments = pending.filter(r => ['payment','invoice'].includes(r.type) && r.due_date && new Date(r.due_date) <= new Date()).length;
  const completedThisMonth = reminders.filter(r => r.status === 'completed' && new Date(r.updated_at || r.created_at).getMonth() === new Date().getMonth()).length;

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

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'To Collect',      value: `₹${totalToCollect.toLocaleString('en-IN')}`,  icon: IndianRupee, color: 'text-green-600',  bg: 'bg-green-500/10',  onClick: () => setActiveFilter('payment') },
          { label: 'Quotations',      value: `₹${totalQuotations.toLocaleString('en-IN')}`, icon: FileText,    color: 'text-purple-600', bg: 'bg-purple-500/10', onClick: () => setActiveFilter('quotation') },
          { label: 'Overdue',         value: overduePayments,                                  icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', onClick: () => setActiveFilter('due') },
          { label: 'Done This Month', value: completedThisMonth,                               icon: Receipt,     color: 'text-blue-600',   bg: 'bg-blue-500/10',   onClick: () => setActiveFilter('completed') },
        ].map(item => (
          <button key={item.label} onClick={item.onClick} className={cn('rounded-xl p-3 flex items-center gap-3 text-left transition-all hover:scale-[1.02] cursor-pointer', item.bg)}>
            <item.icon className={cn('w-5 h-5 shrink-0', item.color)} />
            <div>
              <p className={cn('text-lg font-bold leading-tight', item.color)}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{item.label}</p>
            </div>
          </button>
        ))}
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