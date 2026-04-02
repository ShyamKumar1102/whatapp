import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download } from 'lucide-react';

export default function CSVTemplate({ onDownloadTemplate, isDownloading = false }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <FileSpreadsheet className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          CSV Template
        </h2>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Download a blank CSV template with the correct column headers to ensure your import file is properly formatted.
      </p>
      
      <Button 
        variant="outline" 
        onClick={onDownloadTemplate}
        disabled={isDownloading}
      >
        <Download className="h-4 w-4 mr-2" />
        {isDownloading ? 'Preparing Template...' : 'Download Template'}
      </Button>
    </div>
  );
}