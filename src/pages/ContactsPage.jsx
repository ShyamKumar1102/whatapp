import { useState, useEffect } from 'react';
import { Search, Plus, X, Phone, MessageSquare, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export default function ContactsPage() {
  const navigate = useNavigate();
  const { setSelectedChat, chats, loadContacts, contacts } = useStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', tags: '' });
  const [filterTag, setFilterTag] = useState('');
  const [loading, setLoading] = useState(false);

  // Load fresh contacts from backend on mount
  useEffect(() => { loadContacts(); }, []);

  const filtered = contacts.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
    const matchesFilter = !filterTag || (c.tags || []).includes(filterTag);
    return matchesSearch && matchesFilter;
  });

  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))];

  const handleAdd = async () => {
    if (!newContact.name || !newContact.phone) return;
    setLoading(true);
    const body = {
      name: newContact.name,
      phone: newContact.phone,
      tags: newContact.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(`${BACKEND}/api/contacts`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) await loadContacts(); // reload from backend
    } catch { /* ignore */ }
    setNewContact({ name: '', phone: '', tags: '' });
    setDialogOpen(false);
    setLoading(false);
  };

  const handleDelete = async (contactId) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await fetch(`${BACKEND}/api/contacts/${contactId}`, { method: 'DELETE', headers: getHeaders() });
      await loadContacts(); // reload from backend
    } catch { /* ignore */ }
  };

  const handleMessage = (contact) => {
    const existingChat = chats.find(c => c.contact?.phone === contact.phone);
    if (existingChat) setSelectedChat(existingChat.id);
    navigate('/chats');
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">{contacts.length} total contacts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Add Contact</Button>
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
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-muted/50 border-none text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {allTags.map(tag => (
            <Button key={tag} variant={filterTag === tag ? 'default' : 'outline'} size="sm" onClick={() => setFilterTag(filterTag === tag ? '' : tag)} className="text-xs">{tag}</Button>
          ))}
          {filterTag && <Button variant="ghost" size="sm" onClick={() => setFilterTag('')}><X className="w-3 h-3" /></Button>}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
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
                  <div className="flex gap-1 flex-wrap">
                    {(contact.tags || []).map(tag => <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>)}
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
                    <button onClick={() => handleDelete(contact.id)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No contacts found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
