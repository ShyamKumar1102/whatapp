import { useState } from 'react';
import { Search, Plus, Filter, MoreHorizontal, X, Phone, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { contacts as mockContacts } from '@/lib/mock-data';
import { useStore } from '@/store/useStore';

export default function ContactsPage() {
  const navigate = useNavigate();
  const { setSelectedChat, chats } = useStore();
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState(mockContacts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', tags: '' });
  const [filterTag, setFilterTag] = useState('');

  const filtered = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchesFilter = !filterTag || c.tags.includes(filterTag);
    return matchesSearch && matchesFilter;
  });

  const allTags = [...new Set(contacts.flatMap(c => c.tags))];

  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const token = localStorage.getItem('crm_token');
  const authHeaders = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const handleAdd = async () => {
    if (!newContact.name || !newContact.phone) return;
    const body = { name: newContact.name, phone: newContact.phone, tags: newContact.tags.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      const res  = await fetch(`${BACKEND}/api/contacts`, { method: 'POST', headers: authHeaders, body: JSON.stringify(body) });
      const data = await res.json();
      setContacts(prev => [...prev, data.success ? data.data : { id: Date.now().toString(), ...body, isOnline: false }]);
    } catch {
      setContacts(prev => [...prev, { id: Date.now().toString(), ...body, isOnline: false }]);
    }
    setNewContact({ name: '', phone: '', tags: '' });
    setDialogOpen(false);
  };

  const handleDelete = async (contactId) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try { await fetch(`${BACKEND}/api/contacts/${contactId}`, { method: 'DELETE', headers: authHeaders }); } catch { /* ignore */ }
    setContacts(contacts.filter(c => c.id !== contactId));
  };

  const handleCall = (contact) => {
    // In a real app, this would integrate with a calling service
    const confirmCall = confirm(`📞 Call ${contact.name} at ${contact.phone}?`);
    if (confirmCall) {
      // Simulate call initiation
      alert(`📞 Calling ${contact.name}...\n\nIn a real implementation, this would:\n- Integrate with VoIP service\n- Use WhatsApp Business API calling\n- Connect to phone system`);
    }
  };

  const handleMessage = (contact) => {
    // Find existing chat with this contact or create indication for new chat
    const existingChat = chats.find(chat => chat.contact.phone === contact.phone);
    if (existingChat) {
      setSelectedChat(existingChat.id);
    }
    // Navigate to chats page
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
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Name</Label>
                <Input 
                  value={newContact.name} 
                  onChange={e => setNewContact({...newContact, name: e.target.value})} 
                  placeholder="Contact name" 
                  className="mt-1.5" 
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={newContact.phone} 
                  onChange={e => setNewContact({...newContact, phone: e.target.value})} 
                  placeholder="+91 98765 43210" 
                  className="mt-1.5" 
                />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input 
                  value={newContact.tags} 
                  onChange={e => setNewContact({...newContact, tags: e.target.value})} 
                  placeholder="VIP, Retail" 
                  className="mt-1.5" 
                />
              </div>
              <Button onClick={handleAdd} className="w-full">Add Contact</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search contacts..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 h-9 bg-muted/50 border-none text-sm" 
          />
        </div>
        <div className="flex gap-2">
          {allTags.map(tag => (
            <Button
              key={tag}
              variant={filterTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className="text-xs"
            >
              {tag}
            </Button>
          ))}
          {filterTag && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterTag('')}
              className="text-xs"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
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
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-primary">
                        {contact.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">{contact.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{contact.phone}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {contact.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {contact.isOnline ? (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-online" /> Online
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{contact.lastSeen || 'Offline'}</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={() => handleMessage(contact)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Send Message"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => handleCall(contact)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Call"
                    >
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => handleDelete(contact.id)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  No contacts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}