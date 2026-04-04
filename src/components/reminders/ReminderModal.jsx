import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const REMINDER_TYPES = [
  { key: 'general',    label: 'General',            color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { key: 'quotation',  label: 'Quotation to Send',  color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  { key: 'invoice',    label: 'Invoice to Collect',  color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  { key: 'payment',    label: 'Payment Collection',  color: 'bg-green-500/10 text-green-600 border-green-200' },
];

export { REMINDER_TYPES };

export default function ReminderModal({ isOpen, onClose, onSave, reminder = null, isLoading = false }) {
  const [formData, setFormData] = useState({ title: '', description: '', due_date: '', type: 'general', amount: '' });

  useEffect(() => {
    if (reminder) {
      setFormData({
        title:       reminder.title || '',
        description: reminder.description || '',
        due_date:    reminder.due_date ? new Date(reminder.due_date).toISOString().slice(0, 16) : '',
        type:        reminder.type || 'general',
        amount:      reminder.amount || '',
      });
    } else {
      setFormData({ title: '', description: '', due_date: '', type: 'general', amount: '' });
    }
  }, [reminder, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave({ ...formData, due_date: formData.due_date || null, amount: formData.amount ? parseFloat(formData.amount) : null });
  };

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const showAmount = ['quotation', 'invoice', 'payment'].includes(formData.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{reminder ? 'Edit Reminder' : 'New Reminder'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {REMINDER_TYPES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => set('type', t.key)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    formData.type === t.key
                      ? t.color + ' border-current'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={formData.title} onChange={e => set('title', e.target.value)} placeholder="Enter reminder title" required />
          </div>

          {showAmount && (
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" min="0" step="0.01" value={formData.amount} onChange={e => set('amount', e.target.value)} placeholder="e.g. 15000" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={e => set('description', e.target.value)} placeholder="Enter details (optional)" rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" type="datetime-local" value={formData.due_date} onChange={e => set('due_date', e.target.value)} />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !formData.title.trim()}>
              {isLoading ? 'Saving...' : 'Save Reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}