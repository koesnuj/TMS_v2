import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plan, PlanItem } from '../api/plan';

interface ExportData {
  plan: Plan;
  items: PlanItem[];
}

/**
 * Export to PDF
 */
export const exportToPDF = ({ plan, items }: ExportData) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text(`Test Run Report: ${plan.name}`, 14, 22);

  // Metadata
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Status: ${plan.status} | Total Cases: ${items.length}`, 14, 32);
  
  // Summary Stats
  const stats = items.reduce((acc, item) => {
    acc[item.result] = (acc[item.result] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let summaryText = 'Summary: ';
  Object.entries(stats).forEach(([key, value]) => {
    summaryText += `${key}: ${value}  `;
  });
  doc.text(summaryText, 14, 40);

  // Table Data
  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    item.testCase.title,
    item.assignee || '-',
    item.result,
    item.comment || '-',
    item.executedAt ? new Date(item.executedAt).toLocaleDateString() : '-'
  ]);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [['#', 'Title', 'Assignee', 'Result', 'Comment', 'Executed Date']],
    body: tableData,
    headStyles: { fillColor: [79, 70, 229] }, // Indigo color
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 }, // #
      1: { cellWidth: 'auto' }, // Title
      2: { cellWidth: 25 }, // Assignee
      3: { cellWidth: 25 }, // Result
      4: { cellWidth: 40 }, // Comment
      5: { cellWidth: 25 }, // Date
    }
  });

  // Save
  doc.save(`${plan.name}_report.pdf`);
};

/**
 * Export to Excel
 */
export const exportToExcel = ({ plan, items }: ExportData) => {
  // Summary Sheet
  const stats = items.reduce((acc, item) => {
    acc[item.result] = (acc[item.result] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summaryData = [
    ['Test Plan Name', plan.name],
    ['Description', plan.description || '-'],
    ['Status', plan.status],
    ['Total Cases', items.length],
    ['Created At', new Date(plan.createdAt).toLocaleString()],
    [],
    ['Result Summary'],
    ...Object.entries(stats).map(([key, value]) => [key, value, `${((value / items.length) * 100).toFixed(1)}%`])
  ];

  // Details Sheet
  const detailsData = [
    ['ID', 'Title', 'Priority', 'Assignee', 'Result', 'Comment', 'Executed At', 'Updated At'],
    ...items.map(item => [
      item.testCaseId,
      item.testCase.title,
      item.testCase.priority,
      item.assignee || '-',
      item.result,
      item.comment || '-',
      item.executedAt ? new Date(item.executedAt).toLocaleString() : '-',
      new Date(item.updatedAt).toLocaleString()
    ])
  ];

  // Create Workbook
  const wb = XLSX.utils.book_new();
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);

  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  XLSX.utils.book_append_sheet(wb, detailsWs, 'Details');

  // Save
  XLSX.writeFile(wb, `${plan.name}_report.xlsx`);
};

