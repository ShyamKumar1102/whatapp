import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Send, Clock, FileText, CheckCircle, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const statusConfig = {
  draft:     { label: 'Draft',     icon: FileText,    className: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Scheduled', icon: Clock,       className: 'bg-info/10 text-info' },
  sent:      { label: 'Sent',      icon: CheckCircle, className: 'bg-accent text-accent-foreground' },
  pending:   { label: 'Pending',   icon: Clock,       className: 'bg-warning/10 text-warning' },
};

const emptyForm = { name: '', template: '', scheduledAt: '' };

export default function CampaignsPage() {
  const location = useLocation();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(emptyForm);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND}/api/campaigns`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setCampaigns(data.data);
    } catch { /* keep existing */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  // Auto-open when navigated from Templates
  useEffect(() => {
    if (location.state?.templateName) {
      setForm({ name: '', template: location.state.templateName, scheduledAt: '' });
      setEditTarget(null);
      setDialogOpen(true);
    }
  }, [location.state]);

  const openNew = () => { setEditTarget(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c) => { setEditTarget(c); setForm({ name: c.name, template: c.template_name || '', scheduledAt: c.scheduled_at || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editTarget) {
        const res  = await fetch(`${BACKEND}/api/campaigns/${editTarget.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ name: form.name, template_name: form.template, scheduled_at: form.scheduledAt || null }) });
        const data = await res.json();
        if (data.success) setCampaigns(prev => prev.map(c => c.id === editTarget.id ? data.data : c));
      } else {
        const res  = await fetch(`${BACKEND}/api/campaigns`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ name: form.name, template_name: form.template, scheduled_at: form.scheduledAt || null }) });
        const data = await res.json();
        if (data.success) setCampaigns(prev => [...prev, data.data]);
      }
    } catch { /* ignore */ }
    setDialogOpen(false);
  };

  const handleSend = async (campaign) => {
    if (!confirm(`Send "${campaign.name}" to all contacts?`)) return;
    try {
      const res  = await fetch(`${BACKEND}/api/campaigns/${campaign.id}/send`, { method: 'PATCH', headers: getHeaders() });
      const data = await res.json();
      if (data.success) setCampaigns(prev => prev.map(c => c.id === campaign.id ? data.data : c));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await fetch(`${BACKEND}/api/campaigns/${id}`, { method: 'DELETE', headers: getHeaders() });
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage broadcast campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={openNew}>
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </div>
      </div>

      {loading && campaigns.length === 0 ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No campaigns yet. Create your first campaign.</p>}
          {campaigns.map(campaign => {
            const status   = statusConfig[campaign.status] || statusConfig.draft;
            const total    = campaign.contact_count || campaign.contactCount || 0;
            const sent     = campaign.sent_count    || campaign.sentCount    || 0;
            const progress = total > 0 ? (sent / total) * 100 : 0;
            return (
              <div key={campaign.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{campaign.name}</h3>
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', status.className)}>{status.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {total} contacts · Created {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : campaign.createdAt}
                      {(campaign.scheduled_at || campaign.scheduledAt) && ` · Scheduled for ${campaign.scheduled_at || campaign.scheduledAt}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {campaign.status === 'draft' && (
                      <Button size="sm" variant="default" className="gap-1.5 text-xs" onClick={() => handleSend(campaign)}>
                        <Send className="w-3 h-3" /> Send
                      </Button>
                    )}
                    {campaign.status !== 'sent' && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openEdit(campaign)}>
                        <Edit className="w-3 h-3" /> Edit
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(campaign.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {campaign.status === 'sent' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Delivery Progress</span><span>{sent}/{total}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? 'Edit Campaign' : 'New Campaign'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Campaign Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Diwali Sale 2024" className="mt-1.5" /></div>
            <div><Label>Template Name</Label><Input value={form.template} onChange={e => setForm({ ...form, template: e.target.value })} placeholder="e.g. diwali_sale" className="mt-1.5" /></div>
            <div><Label>Schedule Date (optional)</Label><Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="mt-1.5" /></div>
            <Button onClick={handleSave} className="w-full" disabled={!form.name.trim()}>{editTarget ? 'Save Changes' : 'Create Campaign'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
