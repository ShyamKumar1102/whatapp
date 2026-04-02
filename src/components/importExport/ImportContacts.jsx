import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FolderOpen, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ImportContacts({ onImport, isImporting = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      setImportResult({
        success: false,
        message: 'Please select a CSV file'
      });
      return;
    }

    try {
      const result = await onImport(file);
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: false,
        message: error.message || 'Import failed'
      });
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Upload className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Import Contacts
        </h2>
      </div>
      
      <div className="text-xs text-muted-foreground mb-1">
        Upload a CSV with columns:
      </div>
      <code className="text-xs bg-muted px-1 rounded">
        name, phone, stage, status
      </code>
      
      <p className="text-xs text-muted-foreground mb-4 mt-2">
        Example: Rahul Sharma,+919876543210,New,open
      </p>
      
      <div
        className={`rounded-lg border-2 border-dashed border-border bg-background hover:bg-accent transition-colors cursor-pointer flex flex-col items-center justify-center h-36 gap-2 ${
          dragActive ? 'border-primary bg-accent' : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          {dragActive ? 'Drop CSV file here' : 'Click to select CSV file'}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports .csv files
        </p>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {isImporting && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Processing CSV file...
        </div>
      )}
      
      {importResult && (
        <Alert 
          variant={importResult.success ? "default" : "destructive"} 
          className="mt-4"
        >
          {importResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>
            {importResult.message}
            {importResult.data && (
              <div className="mt-2 text-xs">
                <p>✅ {importResult.data.successCount} contacts imported</p>
                {importResult.data.errorCount > 0 && (
                  <p>❌ {importResult.data.errorCount} errors</p>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}