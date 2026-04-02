import { Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { templates } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const statusStyles = {
  approved: { icon: CheckCircle, className: 'bg-accent text-accent-foreground' },
  pending: { icon: Clock, className: 'bg-warning/10 text-warning' },
  rejected: { icon: XCircle, className: 'bg-destructive/10 text-destructive' },
};

export default function TemplatesPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage WhatsApp message templates</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Create Template</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map(template => {
          const status = statusStyles[template.status];
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
                  <status.icon className="w-3 h-3" />
                  {template.status}
                </span>
              </div>
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground leading-relaxed">{template.body}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Created {template.createdAt}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
