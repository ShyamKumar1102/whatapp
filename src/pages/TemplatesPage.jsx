import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, Clock, XCircle, Send, Trash2, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const statusStyles = {
  approved: { icon: CheckCircle, className: 'bg-accent text-accent-foreground' },
  pending:  { icon: Clock,        className: 'bg-warning/10 text-warning' },
  rejected: { icon: XCircle,      className: 'bg-destructive/10 text-destructive' },
};

// Fallback templates if backend has no /api/templates endpoint yet
const fallbackTemplates = [
  { id: '1', name: 'Welcome Message',    category: 'Marketing', language: 'English', status: 'approved', body: 'Hello {{1}}! Welcome to our service. We\'re excited to have you on board! 🎉', createdAt: '2024-11-01' },
  { id: '2', name: 'Order Confirmation', category: 'Utility',   language: 'English', status: 'approved', body: 'Hi {{1}}, your order #{{2}} has been confirmed. Expected delivery: {{3}}',    createdAt: '2024-11-15' },
  { id: '3', name: 'Payment Reminder',   category: 'Utility',   language: 'English', status: 'pending',  body: 'Dear {{1}}, your payment of ₹{{2}} is due on {{3}}.',                         createdAt: '2024-12-01' },
];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Marketing', language: 'English', body: '' });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND}/api/templates`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success && data.data?.length) {
        setTemplates(data.data);
      } else {
        setTemplates(fallbackTemplates); // use fallback if endpoint not ready
      }
    } catch {
      setTemplates(fallbackTemplates);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.body) return;
    try {
      const res  = await fetch(`${BACKEND}/api/templates`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => [...prev, data.data]);
      } else {
        // fallback: add locally
        setTemplates(prev => [...prev, { id: Date.now().toString(), ...form, status: 'pending', createdAt: new Date().toISOString().split('T')[0] }]);
      }
    } catch {
      setTemplates(prev => [...prev, { id: Date.now().toString(), ...form, status: 'pending', createdAt: new Date().toISOString().split('T')[0] }]);
    }
    setForm({ name: '', category: 'Marketing', language: 'English', body: '' });
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await fetch(`${BACKEND}/api/templates/${id}`, { method: 'DELETE', headers: getHeaders() });
    } catch { /* ignore */ }
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleCopy = (body) => navigator.clipboard.writeText(body);

  const handleUseTemplate = (template) => {
    if (template.status !== 'approved') { alert('Only approved templates can be used in campaigns.'); return; }
    navigate('/campaigns', { state: { templateName: template.name, templateBody: template.body } });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage WhatsApp message templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" /> Create Template
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map(template => {
          const status = statusStyles[template.status] || statusStyles.pending;
          return (
            <div key={template.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">{template.category}</Badge>
                    <span className="text-xs text-muted-foreground">{template.language}</span>
                  </div>
                </div>
                <span className={cn('flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full', status.className)}>
                  <status.icon className="w-3 h-3" />{template.status}
                </span>
              </div>
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground leading-relaxed">{template.body}</p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-muted-foreground">Created {template.createdAt || template.created_at?.split('T')[0]}</p>
                <div className="flex gap-1">
                  <button onClick={() => handleCopy(template.body)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Copy"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => handleUseTemplate(template)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Use in campaign"><Send className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(template.id)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Template Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Welcome Message" className="mt-1.5" /></div>
            <div>
              <Label>Category</Label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option>Marketing</option><option>Utility</option><option>Authentication</option>
              </select>
            </div>
            <div>
              <Label>Message Body</Label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Hello {{1}}, your order {{2}} is confirmed!" rows={4} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="text-xs text-muted-foreground mt-1">Use {'{{1}}'}, {'{{2}}'} for dynamic variables</p>
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={!form.name || !form.body}>Submit for Approval</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
