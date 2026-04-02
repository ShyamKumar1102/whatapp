import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function ExportContacts({ onExport, isExporting = false }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Download className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Export Contacts
        </h2>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Download all contacts as a CSV file including name, phone, stage, status, and assigned agent.
      </p>
      
      <Button 
        variant="default" 
        onClick={onExport}
        disabled={isExporting}
      >
        <Download className="h-4 w-4 mr-2" />
        {isExporting ? 'Preparing Download...' : 'Download CSV'}
      </Button>
    </div>
  );
}