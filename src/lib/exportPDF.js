import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const addHeader = (doc, title) => {
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('WhatsApp CRM', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 210 - 14, 12, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);
};

export const exportContactsPDF = (contacts) => {
  const doc = new jsPDF();
  addHeader(doc, 'Contacts Report');
  autoTable(doc, {
    startY: 30,
    head: [['Name', 'Phone', 'Tags', 'Status']],
    body: contacts.map(c => [
      c.name || '',
      c.phone || '',
      (c.tags || []).join(', '),
      c.is_online ? 'Online' : 'Offline',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  });
  doc.save(`contacts_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportCampaignsPDF = (campaigns) => {
  const doc = new jsPDF();
  addHeader(doc, 'Campaigns Report');
  autoTable(doc, {
    startY: 30,
    head: [['Name', 'Status', 'Contacts', 'Sent', 'Created']],
    body: campaigns.map(c => [
      c.name || '',
      c.status || '',
      c.contact_count || 0,
      c.sent_count || 0,
      c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  });
  doc.save(`campaigns_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportAnalyticsPDF = (stats, chartData, agents, contacts) => {
  const doc = new jsPDF();
  addHeader(doc, 'Analytics Report');

  // Stats summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const summaryData = [
    ['Total Messages', stats?.totalMessages ?? '—'],
    ['Active Chats',   stats?.activeChats ?? '—'],
    ['Campaigns',      stats?.campaigns ?? '—'],
    ['Total Contacts', contacts?.length ?? '—'],
  ];
  autoTable(doc, {
    startY: 36,
    head: [['Metric', 'Value']],
    body: summaryData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: { 0: { cellWidth: 80 } },
    margin: { left: 14 },
    tableWidth: 100,
  });

  // Messages chart data
  if (chartData?.length) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Messages This Week', 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Day', 'Sent', 'Received']],
      body: chartData.map(d => [d.name, d.sent, d.received]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [245, 247, 255] },
    });
  }

  // Agent performance
  if (agents?.length) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Agent Performance', 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Agent', 'Chats Handled']],
      body: agents.map(a => [a.name, a.chats]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [245, 247, 255] },
    });
  }

  doc.save(`analytics_${new Date().toISOString().split('T')[0]}.pdf`);
};
