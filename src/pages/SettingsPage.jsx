import { useState } from 'react';
import { Save, Key, Webhook, Building, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export default function SettingsPage() {
  const [webhookUrl] = useState(`${BACKEND}/webhook`);
  const [settings, setSettings] = useState({
    apiToken: '', phoneNumberId: '', verifyToken: '',
    displayName: '', industry: '', about: '', email: '', notifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${BACKEND}/api/settings`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          META_ACCESS_TOKEN:    settings.apiToken,
          META_PHONE_NUMBER_ID: settings.phoneNumberId,
          META_VERIFY_TOKEN:    settings.verifyToken,
          business:             { displayName: settings.displayName, industry: settings.industry, about: settings.about, email: settings.email },
          notifications:        settings.notifications,
        }),
      });
    } catch { /* backend saves to .env — ok if fails */ }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const set = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your WhatsApp CRM</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Key className="w-4 h-4" /> API Configuration</h2>
        <div className="space-y-4">
          <div>
            <Label>WhatsApp API Token</Label>
            <Input type="password" placeholder="••••••••••••" value={settings.apiToken} onChange={e => set('apiToken', e.target.value)} className="mt-1.5 font-mono" />
            <p className="text-xs text-muted-foreground mt-1">Permanent System User Token from Meta Business Manager</p>
          </div>
          <div>
            <Label>Phone Number ID</Label>
            <Input placeholder="Enter Phone Number ID" value={settings.phoneNumberId} onChange={e => set('phoneNumberId', e.target.value)} className="mt-1.5" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Webhook className="w-4 h-4" /> Webhook</h2>
        <div>
          <Label>Webhook URL</Label>
          <div className="flex gap-2 mt-1.5">
            <Input readOnly value={webhookUrl} className="font-mono text-xs flex-1" />
            <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Register this URL in Meta Developer Console → WhatsApp → Configuration</p>
        </div>
        <div>
          <Label>Verify Token</Label>
          <Input placeholder="my_crm_webhook_verify_token_2024" value={settings.verifyToken} onChange={e => set('verifyToken', e.target.value)} className="mt-1.5 font-mono" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Building className="w-4 h-4" /> Business Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Display Name</Label><Input placeholder="Business Name" value={settings.displayName} onChange={e => set('displayName', e.target.value)} className="mt-1.5" /></div>
          <div><Label>Industry</Label><Input placeholder="E-commerce" value={settings.industry} onChange={e => set('industry', e.target.value)} className="mt-1.5" /></div>
          <div><Label>About</Label><Input placeholder="Tell customers about your business" value={settings.about} onChange={e => set('about', e.target.value)} className="mt-1.5" /></div>
          <div><Label>Email</Label><Input placeholder="support@business.com" value={settings.email} onChange={e => set('email', e.target.value)} className="mt-1.5" /></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Receive alerts for new messages</p>
          </div>
          <Switch checked={settings.notifications} onCheckedChange={v => set('notifications', v)} />
        </div>
      </div>

      <Button onClick={handleSave} className="w-full gap-2" disabled={saving}>
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </Button>
    </div>
  );
}
