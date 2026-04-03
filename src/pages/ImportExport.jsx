import { useState } from 'react';
import ExportContacts from '@/components/importExport/ExportContacts';
import ImportContacts from '@/components/importExport/ImportContacts';
import CSVTemplate from '@/components/importExport/CSVTemplate';
import { toast } from 'sonner';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export default function ImportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${BACKEND}/api/contacts/export`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      triggerDownload(blob, `contacts_${new Date().toISOString().split('T')[0]}.csv`);
    } catch {
      // Fallback: build CSV from localStorage contacts
      const token = localStorage.getItem('crm_token');
      try {
        const res = await fetch(`${BACKEND}/api/contacts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const rows = ['name,phone,tags'];
          data.data.forEach(c => rows.push(`"${c.name}","${c.phone}","${(c.tags || []).join(';')}"`));
          const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
          triggerDownload(blob, `contacts_${new Date().toISOString().split('T')[0]}.csv`);
        }
      } catch {
        toast.error('Export failed. Make sure the backend is running.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file) => {
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      const res = await fetch(`${BACKEND}/api/contacts/import`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message, data: { successCount: data.data?.length || 0, errorCount: 0 } };
      }
      throw new Error(data.message || 'Import failed');
    } catch (err) {
      throw new Error(err.message || 'Import failed. Check your CSV format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const res = await fetch(`${BACKEND}/api/contacts/template`, { headers: getHeaders() });
      if (res.ok) {
        const blob = await res.blob();
        triggerDownload(blob, 'contacts_template.csv');
      } else {
        // Fallback: generate template locally
        const csv = 'name,phone,tags\n"John Doe","+91 98765 43210","VIP;Retail"\n"Jane Smith","+91 87654 32109","New"';
        const blob = new Blob([csv], { type: 'text/csv' });
        triggerDownload(blob, 'contacts_template.csv');
      }
    } catch {
      const csv = 'name,phone,tags\n"John Doe","+91 98765 43210","VIP;Retail"\n"Jane Smith","+91 87654 32109","New"';
      const blob = new Blob([csv], { type: 'text/csv' });
      triggerDownload(blob, 'contacts_template.csv');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Import / Export</h1>
        <p className="text-sm text-muted-foreground mt-1">Bulk import contacts from CSV or export all contacts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ExportContacts onExport={handleExport} isExporting={isExporting} />
          <CSVTemplate onDownloadTemplate={handleDownloadTemplate} isDownloading={isDownloadingTemplate} />
        </div>
        <div>
          <ImportContacts onImport={handleImport} isImporting={isImporting} />
        </div>
      </div>
    </div>
  );
}
