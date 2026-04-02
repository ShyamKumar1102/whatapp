import { useState } from 'react';
import { ShieldCheck, Upload, Building, Globe, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function VerificationPage() {
  const [status] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const statusConfig = {
    pending: { label: 'Pending Review', className: 'bg-warning/10 text-warning border-warning/20' },
    approved: { label: 'Approved', className: 'bg-accent text-accent-foreground border-primary/20' },
    rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  const s = statusConfig[status];

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Meta Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">Verify your business with Meta</p>
        </div>
        <span className={cn('text-xs font-medium px-3 py-1.5 rounded-full border', s.className)}>{s.label}</span>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Building className="w-4 h-4" /> Business Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Business Name</Label><Input placeholder="Your Business Name" className="mt-1.5" /></div>
          <div><Label>Category</Label><Input placeholder="E-commerce, Retail..." className="mt-1.5" /></div>
          <div><Label>Website</Label><Input placeholder="https://yourbusiness.com" className="mt-1.5" /></div>
          <div><Label>Address</Label><Input placeholder="Business Address" className="mt-1.5" /></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><FileText className="w-4 h-4" /> Meta IDs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Facebook Business Manager ID</Label><Input placeholder="Enter ID" className="mt-1.5" /></div>
          <div><Label>WhatsApp Business Account ID</Label><Input placeholder="Enter ID" className="mt-1.5" /></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Upload className="w-4 h-4" /> Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['GST Certificate', 'PAN Card'].map(doc => (
            <div key={doc} className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">{doc}</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (Max 5MB)</p>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full gap-2"><ShieldCheck className="w-4 h-4" /> Submit for Verification</Button>
    </div>
  );
}
