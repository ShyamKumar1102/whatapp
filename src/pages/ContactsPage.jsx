import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Plus, X, Phone, MessageSquare, Trash2, Tag, Send, IndianRupee, FileText, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { useRole } from '@/hooks/useRole';
import { exportContactsPDF } from '@/lib/exportPDF';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export default function ContactsPage() {
  const navigate = useNavigate();
  const { setSelectedChat, chats, loadContacts, contacts } = useStore();
  const { isAdmin } = useRole();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', tags: '' });
  const [filterTag, setFilterTag] = useState('');
  const [loading, setLoading] = useState(false);

  // Tag editing
  const [editTagsContact, setEditTagsContact] = useState(null);
  const [editTagsValue, setEditTagsValue] = useState('');

  // Bulk select
  const [selected, setSelected] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Quick reminder modal
  const [reminderContact, setReminderContact] = useState(null);
  const [reminderForm, setReminderForm] = useState({ type: 'quotation', title: '', amount: '', due_date: '' });
  const [reminderLoading, setReminderLoading] = useState(false);

  const REMINDER_TYPES = [
    { k: 'quotation', l: '📄 Quotation', color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-300' },
    { k: 'invoice',   l: '🧾 Invoice',   color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-300' },
    { k: 'payment',   l: '💰 Payment',   color: 'text-green-600',  bg: 'bg-green-500/10',  border: 'border-green-300' },
  ];

  const handleSendReminder = async () => {
    if (!reminderForm.title.trim() || !reminderContact) return;
    setReminderLoading(true);
    try {
      await fetch(`${BACKEND}/api/reminders`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          title: reminderForm.title,
          due_date: reminderForm.due_date || null,
          contact_id: reminderContact.id,
          type: reminderForm.type,
          amount: reminderForm.amount ? parseFloat(reminderForm.amount) : null,
        }),
      });
      toast.success(`${reminderForm.type.charAt(0).toUpperCase() + reminderForm.type.slice(1)} reminder created for ${reminderContact.name}`);
      setReminderContact(null);
      setReminderForm({ type: 'quotation', title: '', amount: '', due_date: '' });
    } catch { toast.error('Failed to create reminder'); }
    setReminderLoading(false);
  };

  useEffect(() => { loadContacts(); }, []);

  const filtered = contacts.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
    const matchesFilter = !filterTag || (c.tags || []).includes(filterTag);
    return matchesSearch && matchesFilter;
  });

  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))];

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id));

  const handleAdd = async () => {
    if (!newContact.name || !newContact.phone) return;
    setLoading(true);
    const body = { name: newContact.name, phone: newContact.phone, tags: newContact.tags.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      const res = await fetch(`${BACKEND}/api/contacts`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) await loadContacts();
    } catch { /* ignore */ }
    setNewContact({ name: '', phone: '', tags: '' });
    setDialogOpen(false);
    setLoading(false);
  };

  const handleDelete = async (contactId) => {
    try {
      await fetch(`${BACKEND}/api/contacts/${contactId}`, { method: 'DELETE', headers: getHeaders() });
      await loadContacts(); toast.success('Contact deleted.');
    } catch { /* ignore */ }
  };

  const handleMessage = (contact) => {
    const existingChat = chats.find(c => c.contact?.phone === contact.phone);
    if (existingChat) setSelectedChat(existingChat.id);
    navigate('/chats');
  };

  const handleEditTags = (contact) => {
    setEditTagsContact(contact);
    setEditTagsValue((contact.tags || []).join(', '));
  };

  const handleSaveTags = async () => {
    if (!editTagsContact) return;
    const tags = editTagsValue.split(',').map(t => t.trim()).filter(Boolean);
    try {
      await fetch(`${BACKEND}/api/contacts/${editTagsContact.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ tags }) });
      await loadContacts(); toast.success('Tags updated.');
    } catch { /* ignore */ }
    setEditTagsContact(null);
  };

  const handleSendCampaign = () => {
    navigate('/campaigns', { state: { selectedContactIds: selected } });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">{contacts.length} total contacts</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {selected.length > 0 && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleSendCampaign}>
              <Send className="w-3.5 h-3.5" /> Campaign ({selected.length})
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => exportContactsPDF(contacts)}>
            <span className="text-[10px] font-bold">PDF</span>
          </Button>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div><Label>Name</Label><Input value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} placeholder="Contact name" className="mt-1.5" /></div>
                  <div><Label>Phone</Label><Input value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="+91 98765 43210" className="mt-1.5" /></div>
                  <div><Label>Tags (comma separated)</Label><Input value={newContact.tags} onChange={e => setNewContact({ ...newContact, tags: e.target.value })} placeholder="VIP, Retail" className="mt-1.5" /></div>
                  <Button onClick={handleAdd} className="w-full" disabled={loading}>{loading ? 'Adding...' : 'Add Contact'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-muted/50 border-none text-sm" />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map(tag => (
              <Button key={tag} variant={filterTag === tag ? 'default' : 'outline'} size="sm" onClick={() => setFilterTag(filterTag === tag ? '' : tag)} className="text-xs h-7 px-2">{tag}</Button>
            ))}
            {filterTag && <Button variant="ghost" size="sm" onClick={() => setFilterTag('')} className="h-7 w-7 p-0"><X className="w-3 h-3" /></Button>}
          </div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {filtered.map(contact => (
          <div key={contact.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <input type="checkbox" checked={selected.includes(contact.id)} onChange={() => toggleSelect(contact.id)} className="rounded" />
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">{(contact.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{contact.name}</p>
                <p className="text-xs text-muted-foreground">{contact.phone}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleMessage(contact)} className="p-1.5 rounded hover:bg-muted"><MessageSquare className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={() => window.open(`tel:${contact.phone}`, '_self')} className="p-1.5 rounded hover:bg-muted"><Phone className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={() => { setReminderContact(contact); setReminderForm({ type: 'quotation', title: '', amount: '', due_date: '' }); }} className="p-1.5 rounded hover:bg-muted" title="Quotation / Invoice / Payment"><IndianRupee className="w-4 h-4 text-green-600" /></button>
                {isAdmin && <button onClick={() => setConfirmDeleteId(contact.id)} className="p-1.5 rounded hover:bg-muted"><Trash2 className="w-4 h-4 text-destructive" /></button>}
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {(contact.tags || []).map(tag => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
              <button onClick={() => handleEditTags(contact)} className="p-0.5 rounded hover:bg-muted"><Tag className="w-3 h-3 text-muted-foreground" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No contacts found</p>}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-3 px-4 w-8"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" /></th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tags</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(contact => (
              <tr key={contact.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors">
                <td className="py-3 px-4"><input type="checkbox" checked={selected.includes(contact.id)} onChange={() => toggleSelect(contact.id)} className="rounded" /></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-primary">{(contact.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                    </div>
                    <span className="font-medium text-foreground">{contact.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{contact.phone}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 flex-wrap items-center">
                    {(contact.tags || []).map(tag => <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>)}
                    <button onClick={() => handleEditTags(contact)} className="p-0.5 rounded hover:bg-muted transition-colors" title="Edit tags"><Tag className="w-3 h-3 text-muted-foreground" /></button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {contact.is_online || contact.isOnline
                    ? <span className="flex items-center gap-1.5 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-online" /> Online</span>
                    : <span className="text-xs text-muted-foreground">{contact.last_seen || contact.lastSeen || 'Offline'}</span>}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleMessage(contact)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Message"><MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => window.open(`tel:${contact.phone}`, '_self')} className="p-1.5 rounded hover:bg-muted transition-colors" title="Call"><Phone className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => { setReminderContact(contact); setReminderForm({ type: 'quotation', title: '', amount: '', due_date: '' }); }} className="p-1.5 rounded hover:bg-muted transition-colors" title="Quotation / Invoice / Payment"><IndianRupee className="w-3.5 h-3.5 text-green-600" /></button>
                    {isAdmin && <button onClick={() => setConfirmDeleteId(contact.id)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No contacts found</td></tr>}
          </tbody>
        </table>
      </div>

      <ConfirmDialog open={!!confirmDeleteId} title="Delete Contact" description="This contact will be permanently deleted." confirmLabel="Delete" onConfirm={() => handleDelete(confirmDeleteId)} onCancel={() => setConfirmDeleteId(null)} />

      {/* Quick Quotation / Invoice / Payment Reminder Modal */}
      <Dialog open={!!reminderContact} onOpenChange={open => !open && setReminderContact(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Reminder — {reminderContact?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2">
              {REMINDER_TYPES.map(t => (
                <button key={t.k} type="button" onClick={() => setReminderForm(f => ({ ...f, type: t.k }))}
                  className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                    reminderForm.type === t.k ? `${t.bg} ${t.color} ${t.border}` : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                  }`}>{t.l}</button>
              ))}
            </div>
            <div><Label>Title *</Label><Input className="mt-1.5" placeholder={`e.g. ${reminderForm.type === 'quotation' ? 'Quotation for project' : reminderForm.type === 'invoice' ? 'Invoice #001' : 'Payment collection'}`} value={reminderForm.title} onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Amount (₹)</Label><Input className="mt-1.5" type="number" min="0" step="0.01" placeholder="e.g. 25000" value={reminderForm.amount} onChange={e => setReminderForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><Label>Due Date</Label><Input className="mt-1.5" type="datetime-local" value={reminderForm.due_date} onChange={e => setReminderForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleSendReminder} disabled={reminderLoading || !reminderForm.title.trim()}>
              {reminderLoading ? 'Saving...' : 'Create Reminder'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tags Dialog */}
      <Dialog open={!!editTagsContact} onOpenChange={open => !open && setEditTagsContact(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Tags — {editTagsContact?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Tags (comma separated)</Label>
              <Input value={editTagsValue} onChange={e => setEditTagsValue(e.target.value)} placeholder="VIP, Retail, Enterprise" className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">Current: {editTagsValue || 'none'}</p>
            </div>
            <Button onClick={handleSaveTags} className="w-full">Save Tags</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
