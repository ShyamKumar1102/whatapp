import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, Clock, XCircle, Send, Trash2, Copy, RefreshCw, Upload, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const statusStyles = {
  approved: { icon: CheckCircle, className: 'bg-accent text-accent-foreground' },
  pending:  { icon: Clock,       className: 'bg-warning/10 text-warning' },
  rejected: { icon: XCircle,     className: 'bg-destructive/10 text-destructive' },
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const fileInputRef = useRef(null);

  const [templates, setTemplates]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [uploadOpen, setUploadOpen]   = useState(false);
  const [submitOpen, setSubmitOpen]   = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Marketing', language: 'en_US', body: '' });
  const [submitForm, setSubmitForm] = useState({ name: '', category: 'MARKETING', language: 'en_US', body: '' });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND}/api/templates`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setTemplates(data.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.body) return;
    try {
      const res  = await fetch(`${BACKEND}/api/templates`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) setTemplates(prev => [...prev, data.data]);
    } catch { /* ignore */ }
    setForm({ name: '', category: 'Marketing', language: 'en_US', body: '' });
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${BACKEND}/api/templates/${id}`, { method: 'DELETE', headers: getHeaders() });
    } catch { /* ignore */ }
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted.');
  };

  const handleCopy = (body) => navigator.clipboard.writeText(body);

  const handleUseTemplate = (template) => {
    if (template.status !== 'approved') { toast.error('Only approved templates can be used in campaigns.'); return; }
    navigate('/campaigns', { state: { templateName: template.name, templateBody: template.body } });
  };

  // ── Bulk Upload ───────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const text = await file.text();
      let parsed = [];

      if (file.name.endsWith('.json')) {
        const json = JSON.parse(text);
        parsed = Array.isArray(json) ? json : [json];
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        parsed = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.replace(/"/g, '').trim());
          return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
        });
      }

      let success = 0, failed = 0;
      for (const t of parsed) {
        if (!t.name || !t.body) { failed++; continue; }
        try {
          const res  = await fetch(`${BACKEND}/api/templates`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ name: t.name, category: t.category || 'Marketing', language: t.language || 'en_US', body: t.body }) });
          const data = await res.json();
          if (data.success) { setTemplates(prev => [...prev, data.data]); success++; }
          else failed++;
        } catch { failed++; }
      }
      setUploadResult({ success, failed, total: parsed.length });
    } catch (err) {
      setUploadResult({ error: 'Invalid file format. ' + err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Submit to Meta ────────────────────────────────────────────
  const handleSubmitToMeta = async () => {
    if (!submitForm.name || !submitForm.body) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`${BACKEND}/api/templates/submit-meta`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(submitForm) });
      const data = await res.json();
      if (data.success) {
        toast.success(`Template submitted! Status: ${data.status || 'pending'} · Meta ID: ${data.metaId || 'N/A'}`);
        await fetchTemplates();
        setSubmitOpen(false);
        setSubmitForm({ name: '', category: 'MARKETING', language: 'en_US', body: '' });
      } else {
        toast.error(data.message || 'Submission failed');
      }
    } catch { toast.error('Failed to submit. Check your Meta credentials in Settings.'); }
    finally { setSubmitting(false); }
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
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setUploadOpen(true)}>
                <Upload className="w-4 h-4" /> Bulk Upload
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSubmitOpen(true)}>
                <FileUp className="w-4 h-4" /> Submit to Meta
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" /> Create
              </Button>
            </>
          )}
        </div>
      </div>

      {templates.length === 0 && !loading && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No templates yet. Create one or upload a file.</p>
        </div>
      )}

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
                  {isAdmin && <button onClick={() => handleUseTemplate(template)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Use in campaign"><Send className="w-3.5 h-3.5 text-muted-foreground" /></button>}
                  {isAdmin && <button onClick={() => setConfirmDeleteId(template.id)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog open={!!confirmDeleteId} title="Delete Template" description="This template will be permanently deleted." confirmLabel="Delete" onConfirm={() => handleDelete(confirmDeleteId)} onCancel={() => setConfirmDeleteId(null)} />

      {/* Create Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Template Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. welcome_message" className="mt-1.5" /></div>
            <div>
              <Label>Category</Label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option>Marketing</option><option>Utility</option><option>Authentication</option>
              </select>
            </div>
            <div>
              <Label>Message Body</Label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Hello {{1}}, your order {{2}} is confirmed!" rows={4} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="text-xs text-muted-foreground mt-1">Use {`{{1}}`}, {`{{2}}`} for dynamic variables</p>
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={!form.name || !form.body}>Save Template</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={v => { setUploadOpen(v); setUploadResult(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Upload Templates</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Supported formats: JSON or CSV</p>
              <p>JSON: <code className="bg-muted px-1 rounded">[{`{"name","category","language","body"}`}]</code></p>
              <p>CSV columns: <code className="bg-muted px-1 rounded">name, category, language, body</code></p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm">{uploading ? 'Uploading...' : 'Click to select JSON or CSV file'}</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden" />
            {uploadResult && (
              <div className={cn('p-3 rounded-lg text-xs', uploadResult.error ? 'bg-destructive/10 text-destructive' : 'bg-accent text-accent-foreground')}>
                {uploadResult.error
                  ? uploadResult.error
                  : `✅ ${uploadResult.success} imported, ❌ ${uploadResult.failed} failed out of ${uploadResult.total} total`}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Download sample: <button onClick={() => { const blob = new Blob(['[{"name":"welcome_msg","category":"Marketing","language":"en_US","body":"Hello {{1}}! Welcome."}]'], {type:'application/json'}); const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'templates_sample.json'}); a.click(); }} className="text-primary underline">templates_sample.json</button></p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit to Meta Dialog */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Template to Meta</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              This will submit the template directly to Meta for approval. Requires <span className="font-medium text-foreground">META_ACCESS_TOKEN</span> and <span className="font-medium text-foreground">META_WABA_ID</span> in Settings.
            </div>
            <div><Label>Template Name</Label><Input value={submitForm.name} onChange={e => setSubmitForm({ ...submitForm, name: e.target.value.toLowerCase().replace(/\s+/g,'_') })} placeholder="e.g. welcome_message (lowercase, underscores)" className="mt-1.5" /></div>
            <div>
              <Label>Category</Label>
              <select value={submitForm.category} onChange={e => setSubmitForm({ ...submitForm, category: e.target.value })} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
            </div>
            <div>
              <Label>Language</Label>
              <select value={submitForm.language} onChange={e => setSubmitForm({ ...submitForm, language: e.target.value })} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="en_US">English (US)</option>
                <option value="en_GB">English (UK)</option>
                <option value="hi">Hindi</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
            <div>
              <Label>Message Body</Label>
              <textarea value={submitForm.body} onChange={e => setSubmitForm({ ...submitForm, body: e.target.value })} placeholder="Hello {{1}}, welcome to our service!" rows={4} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="text-xs text-muted-foreground mt-1">Use {`{{1}}`}, {`{{2}}`} for variables. Meta will review this content.</p>
            </div>
            <Button onClick={handleSubmitToMeta} className="w-full" disabled={submitting || !submitForm.name || !submitForm.body}>
              {submitting ? 'Submitting...' : 'Submit to Meta for Approval'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
