import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Send, Clock, FileText, CheckCircle, Edit, Trash2, RefreshCw, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';
import { exportCampaignsPDF } from '@/lib/exportPDF';

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

const emptyForm = { name: '', template: '', scheduledAt: '', message: '', imageUrl: '', imageFile: null };

export default function CampaignsPage() {
  const location = useLocation();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef(null);
  const [confirmSendId, setConfirmSendId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { isAdmin } = useRole();

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

  // Auto-open when navigated from Templates or Contacts
  useEffect(() => {
    if (location.state?.templateName) {
      setForm({ ...emptyForm, template: location.state.templateName });
      setEditTarget(null); setDialogOpen(true);
    }
    if (location.state?.selectedContactIds?.length) {
      setForm({ ...emptyForm });
      setEditTarget(null); setDialogOpen(true);
    }
  }, [location.state]);

  const handleOpenNew    = () => { setEditTarget(null); setForm(emptyForm); setImagePreview(null); setDialogOpen(true); };
  const handleConfirmSend   = (campaign) => setConfirmSendId(campaign);
  const handleConfirmDelete = (id) => setConfirmDeleteId(id);
  const handleCancelSend    = () => setConfirmSendId(null);
  const handleCancelDelete  = () => setConfirmDeleteId(null);
  const openEdit = (c) => { setEditTarget(c); setForm({ name: c.name, template: c.template_name || '', scheduledAt: c.scheduled_at || '', message: c.message || '', imageUrl: c.image_url || '', imageFile: null }); setImagePreview(c.image_url || null); setDialogOpen(true); };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, imageFile: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setForm(f => ({ ...f, imageFile: null, imageUrl: '' }));
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setUploading(true);
    try {
      let image_url = form.imageUrl;
      // Upload image first if a new file was selected
      if (form.imageFile) {
        const fd = new FormData();
        fd.append('image', form.imageFile);
        const uploadRes = await fetch(`${BACKEND}/api/campaigns/upload-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('crm_token')}` },
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) image_url = uploadData.url;
      }
      const payload = { name: form.name, template_name: form.template, scheduled_at: form.scheduledAt || null, message: form.message, image_url: image_url || null };
      if (editTarget) {
        const res  = await fetch(`${BACKEND}/api/campaigns/${editTarget.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) setCampaigns(prev => prev.map(c => c.id === editTarget.id ? data.data : c));
      } else {
        const res  = await fetch(`${BACKEND}/api/campaigns`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) setCampaigns(prev => [...prev, data.data]);
      }
    } catch { /* ignore */ } finally { setUploading(false); }
    setDialogOpen(false);
  };

  const handleSend = async (campaign) => {
    try {
      const res  = await fetch(`${BACKEND}/api/campaigns/${campaign.id}/send`, { method: 'PATCH', headers: getHeaders() });
      const data = await res.json();
      if (data.success) { setCampaigns(prev => prev.map(c => c.id === campaign.id ? data.data : c)); toast.success('Campaign sent successfully!'); }
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${BACKEND}/api/campaigns/${id}`, { method: 'DELETE', headers: getHeaders() });
      setCampaigns(prev => prev.filter(c => c.id !== id)); toast.success('Campaign deleted.');
    } catch { /* ignore */ }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
          <p className="text-sm text-muted-foreground mt-1">Create and manage broadcast campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportCampaignsPDF(campaigns)}>
            <span className="text-[10px] font-bold">PDF</span> Export
          </Button>
          {isAdmin && (
            <Button size="sm" className="gap-1.5" onClick={handleOpenNew}>
              <Plus className="w-4 h-4" /> New Campaign
            </Button>
          )}
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
                <div className="flex items-start justify-between gap-3">
                  {campaign.image_url && (
                    <img src={campaign.image_url} alt="campaign" className="w-14 h-14 rounded-lg object-cover shrink-0 border border-border" />
                  )}
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
                    {isAdmin && campaign.status === 'draft' && (
                      <Button size="sm" variant="default" className="gap-1.5 text-xs" onClick={() => handleConfirmSend(campaign)}>
                        <Send className="w-3 h-3" /> Send
                      </Button>
                    )}
                    {isAdmin && campaign.status !== 'sent' && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openEdit(campaign)}>
                        <Edit className="w-3 h-3" /> Edit
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleConfirmDelete(campaign.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
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

      <ConfirmDialog open={!!confirmSendId} title="Send Campaign" description={`Send "${confirmSendId?.name}" to all contacts?`} confirmLabel="Send" variant="default" onConfirm={() => handleSend(confirmSendId)} onCancel={handleCancelSend} />
      <ConfirmDialog open={!!confirmDeleteId} title="Delete Campaign" description="This campaign will be permanently deleted." confirmLabel="Delete" onConfirm={() => handleDelete(confirmDeleteId)} onCancel={handleCancelDelete} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? 'Edit Campaign' : 'New Campaign'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Campaign Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Diwali Sale 2024" className="mt-1.5" /></div>
            <div><Label>Message (optional)</Label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Type your broadcast message..." rows={3} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" /></div>

            {/* Image Upload */}
            <div>
              <Label>Image (optional)</Label>
              <div className="mt-1.5">
                {imagePreview ? (
                  <div className="relative w-full rounded-lg overflow-hidden border border-border">
                    <img src={imagePreview} alt="preview" className="w-full max-h-40 object-cover" />
                    <button onClick={removeImage} className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background border border-border">
                      <X className="w-3.5 h-3.5 text-foreground" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => imageInputRef.current?.click()} className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-xs">Click to upload image</span>
                    <span className="text-[10px]">PNG, JPG, WEBP up to 5MB</span>
                  </button>
                )}
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
            </div>

            <div><Label>Template Name (optional)</Label><Input value={form.template} onChange={e => setForm({ ...form, template: e.target.value })} placeholder="e.g. diwali_sale" className="mt-1.5" /></div>
            <div><Label>Schedule Date (optional)</Label><Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="mt-1.5" /></div>
            <Button onClick={handleSave} className="w-full" disabled={!form.name.trim() || uploading}>{uploading ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Campaign'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
