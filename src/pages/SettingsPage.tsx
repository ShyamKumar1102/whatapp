import { useState } from 'react';
import { Save, Key, Webhook, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const [webhookUrl] = useState('https://yourapp.com/api/webhook');

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your WhatsApp CRM</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Key className="w-4 h-4" /> API Configuration</h2>
        <div className="space-y-4">
          <div><Label>WhatsApp API Token</Label><Input type="password" placeholder="••••••••••••" className="mt-1.5 font-mono" /></div>
          <div><Label>Phone Number ID</Label><Input placeholder="Enter Phone Number ID" className="mt-1.5" /></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Webhook className="w-4 h-4" /> Webhook</h2>
        <div>
          <Label>Webhook URL</Label>
          <div className="flex gap-2 mt-1.5">
            <Input readOnly value={webhookUrl} className="font-mono text-xs flex-1" />
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(webhookUrl)}>Copy</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Use this URL in your Meta App webhook settings</p>
        </div>
        <div><Label>Verify Token</Label><Input placeholder="Your verify token" className="mt-1.5 font-mono" /></div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Building className="w-4 h-4" /> Business Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Display Name</Label><Input placeholder="Business Name" className="mt-1.5" /></div>
          <div><Label>Industry</Label><Input placeholder="E-commerce" className="mt-1.5" /></div>
          <div><Label>About</Label><Input placeholder="Tell customers about your business" className="mt-1.5" /></div>
          <div><Label>Email</Label><Input placeholder="support@business.com" className="mt-1.5" /></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Receive alerts for new messages</p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>

      <Button className="w-full gap-2"><Save className="w-4 h-4" /> Save Settings</Button>
    </div>
  );
}
