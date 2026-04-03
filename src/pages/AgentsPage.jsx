import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, ShieldCheck, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useRole } from '@/hooks/useRole';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const emptyForm = { name: '', email: '', password: '', role: 'agent' };

export default function AgentsPage() {
  const { isAdmin } = useRole();
  const [agents, setAgents]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND}/api/agents`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setAgents(data.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { setError('Name, email and password are required'); return; }
    setSaving(true); setError('');
    try {
      const res  = await fetch(`${BACKEND}/api/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { await fetchAgents(); setDialogOpen(false); setForm(emptyForm); }
      else setError(data.message || 'Failed to create agent');
    } catch { setError('Failed to create agent'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${BACKEND}/api/agents/${id}`, { method: 'DELETE', headers: getHeaders() });
      setAgents(prev => prev.filter(a => a.id !== id));
      toast.success('Agent removed.');
    } catch { /* ignore */ }
  };

  const roleConfig = {
    admin: { label: 'Admin', className: 'bg-primary/10 text-primary' },
    agent: { label: 'Agent', className: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">{agents.length} team members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAgents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {isAdmin && (
            <Button size="sm" className="gap-1.5" onClick={() => { setForm(emptyForm); setError(''); setDialogOpen(true); }}>
              <Plus className="w-4 h-4" /> Add Agent
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Agent</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              {isAdmin && <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td colSpan={5} className="py-4 px-4"><div className="h-4 bg-muted rounded animate-pulse w-3/4" /></td>
                </tr>
              ))
            ) : agents.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No agents found</td></tr>
            ) : agents.map(agent => {
              const role = roleConfig[agent.role] || roleConfig.agent;
              return (
                <tr key={agent.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {agent.role === 'admin'
                          ? <ShieldCheck className="w-4 h-4 text-primary" />
                          : <User className="w-4 h-4 text-primary" />}
                      </div>
                      <span className="font-medium text-foreground">{agent.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{agent.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${role.className}`}>{role.label}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${agent.is_active !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {agent.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setConfirmId(agent.id)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Agent</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Agent name" className="mt-1.5" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="agent@company.com" className="mt-1.5" /></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" className="mt-1.5" /></div>
            <div>
              <Label>Role</Label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={handleCreate} className="w-full" disabled={saving}>{saving ? 'Creating...' : 'Create Agent'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!confirmId} title="Delete Agent" description="This will deactivate the agent. Are you sure?" confirmLabel="Delete" onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />
    </div>
  );
}
