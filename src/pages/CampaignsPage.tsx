import { Plus, Send, Clock, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { campaigns } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Draft', icon: FileText, className: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Scheduled', icon: Clock, className: 'bg-info/10 text-info' },
  sent: { label: 'Sent', icon: CheckCircle, className: 'bg-accent text-accent-foreground' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-warning/10 text-warning' },
};

export default function CampaignsPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage broadcast campaigns</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> New Campaign</Button>
      </div>

      <div className="grid gap-4">
        {campaigns.map(campaign => {
          const status = statusConfig[campaign.status];
          const progress = campaign.contactCount > 0 ? (campaign.sentCount / campaign.contactCount) * 100 : 0;
          return (
            <div key={campaign.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{campaign.name}</h3>
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', status.className)}>{status.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {campaign.contactCount} contacts · Created {campaign.createdAt}
                    {campaign.scheduledAt && ` · Scheduled for ${campaign.scheduledAt}`}
                  </p>
                </div>
                {campaign.status === 'draft' && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Send className="w-3 h-3" /> Send</Button>
                )}
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
    </div>
  );
}
