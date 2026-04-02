import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Send, Clock, FileText, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { campaigns as mockCampaigns } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft:     { label: 'Draft',     icon: FileText,    className: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Scheduled', icon: Clock,       className: 'bg-info/10 text-info' },
  sent:      { label: 'Sent',      icon: CheckCircle, className: 'bg-accent text-accent-foreground' },
  pending:   { label: 'Pending',   icon: Clock,       className: 'bg-warning/10 text-warning' },
};

const emptyForm = { name: '', template: '', scheduledAt: '' };

export default function CampaignsPage() {
  const location = useLocation();
  const [campaigns, setCampaigns]   = useState(mockCampaigns);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(emptyForm);

  // Auto-open when navigated from Templates page
  useEffect(() => {
    if (location.state?.templateName) {
      setForm({ name: '', template: location.state.templateName, scheduledAt: '' });
      setEditTarget(null);
      setDialogOpen(true);
    }
  }, [location.state]);

  const openNew = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (campaign) => {
    setEditTarget(campaign);
    setForm({ name: campaign.name, template: campaign.template || '', scheduledAt: campaign.scheduledAt || '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editTarget) {
      setCampaigns(prev => prev.map(c =>
        c.id === editTarget.id ? { ...c, name: form.name, template: form.template, scheduledAt: form.scheduledAt } : c
      ));
    } else {
      setCampaigns(prev => [...prev, {
        id:           Date.now().toString(),
        name:         form.name,
        template:     form.template,
        status:       form.scheduledAt ? 'scheduled' : 'draft',
        contactCount: 0,
        sentCount:    0,
        scheduledAt:  form.scheduledAt || null,
        createdAt:    new Date().toISOString().split('T')[0],
      }]);
    }
    setDialogOpen(false);
  };

  const handleSend = (campaign) => {
    if (!confirm(`Send "${campaign.name}" to all contacts?`)) return;
    setCampaigns(prev => prev.map(c =>
      c.id === campaign.id ? { ...c, status: 'sent', sentCount: c.contactCount || 100 } : c
    ));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage broadcast campaigns</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      <div className="grid gap-4">
        {campaigns.map(campaign => {
          const status   = statusConfig[campaign.status] || statusConfig.draft;
          const progress = campaign.contactCount > 0 ? (campaign.sentCount / campaign.contactCount) * 100 : 0;
          return (
            <div key={campaign.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{campaign.name}</h3>
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', status.className)}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {campaign.contactCount} contacts · Created {campaign.createdAt}
                    {campaign.scheduledAt && ` · Scheduled for ${campaign.scheduledAt}`}
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
                    <span>Delivery Progress</span>
                    <span>{campaign.sentCount}/{campaign.contactCount}</span>
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

      {/* New / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Campaign Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Diwali Sale 2024" className="mt-1.5" />
            </div>
            <div>
              <Label>Template Name</Label>
              <Input value={form.template} onChange={e => setForm({ ...form, template: e.target.value })} placeholder="e.g. diwali_sale" className="mt-1.5" />
            </div>
            <div>
              <Label>Schedule Date (optional)</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="mt-1.5" />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.name.trim()}>
              {editTarget ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
