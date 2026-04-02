import { useState, useRef } from 'react';
import { ShieldCheck, Upload, Building, FileText, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function VerificationPage() {
  const [status, setStatus] = useState('pending');
  const [form, setForm] = useState({ businessName: '', category: '', website: '', address: '', fbManagerId: '', wabaId: '' });
  const [docs, setDocs] = useState({ gst: null, pan: null });
  const gstRef = useRef(null);
  const panRef = useRef(null);

  const statusConfig = {
    pending:  { label: 'Pending Review', className: 'bg-warning/10 text-warning border-warning/20' },
    approved: { label: 'Approved',       className: 'bg-accent text-accent-foreground border-primary/20' },
    rejected: { label: 'Rejected',       className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  const handleFileUpload = (field, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return; }
    setDocs(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = () => {
    if (!form.businessName || !form.fbManagerId || !form.wabaId) {
      alert('Please fill in Business Name, Facebook Business Manager ID, and WhatsApp Business Account ID.');
      return;
    }
    setStatus('pending');
    alert('✅ Verification request submitted!\n\nMeta will review your business details within 2-3 business days.\nYou will receive an email notification once approved.');
  };

  const s = statusConfig[status];

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Meta Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">Verify your business with Meta to unlock full WhatsApp API access</p>
        </div>
        <span className={cn('text-xs font-medium px-3 py-1.5 rounded-full border flex items-center gap-1.5', s.className)}>
          {status === 'approved' && <CheckCircle className="w-3 h-3" />}
          {s.label}
        </span>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building className="w-4 h-4" /> Business Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Business Name *</Label>
            <Input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="Your Business Name" className="mt-1.5" />
          </div>
          <div>
            <Label>Category</Label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select category</option>
              <option>E-commerce</option><option>Retail</option><option>Finance</option>
              <option>Healthcare</option><option>Education</option><option>Technology</option>
            </select>
          </div>
          <div>
            <Label>Website</Label>
            <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://yourbusiness.com" className="mt-1.5" />
          </div>
          <div>
            <Label>Business Address</Label>
            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Business Street, City" className="mt-1.5" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4" /> Meta IDs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Facebook Business Manager ID *</Label>
            <Input value={form.fbManagerId} onChange={e => setForm({ ...form, fbManagerId: e.target.value })} placeholder="Enter ID" className="mt-1.5 font-mono" />
          </div>
          <div>
            <Label>WhatsApp Business Account ID *</Label>
            <Input value={form.wabaId} onChange={e => setForm({ ...form, wabaId: e.target.value })} placeholder="Enter ID" className="mt-1.5 font-mono" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Upload className="w-4 h-4" /> Documents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'gst', label: 'GST Certificate', ref: gstRef },
            { key: 'pan', label: 'PAN Card', ref: panRef },
          ].map(({ key, label, ref }) => (
            <div
              key={key}
              onClick={() => ref.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
            >
              <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => handleFileUpload(key, e.target.files[0])} />
              {docs[key] ? (
                <>
                  <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">{docs[key].name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (Max 5MB)</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full gap-2">
        <ShieldCheck className="w-4 h-4" /> Submit for Verification
      </Button>
    </div>
  );
}
