
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonitoringDoc, ClassGroup, Term } from '@/types';

export const generateMonitoringReport = async (
  docData: MonitoringDoc,
  classGroup: ClassGroup,
  term: Term | 'whole-year',
  // Note: students passed but mostly unused for basic compliance cert unless we list outliers
  // We keep the signature consistent.
): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFontSize(18);
  doc.text(`Junior Monitoring Report - ${docData.year}`, 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Class: ${classGroup.name} (${classGroup.subject})`, 14, 28);
  doc.text(`Scope: ${term === 'whole-year' ? 'Whole Year' : 'Term ' + term}`, 14, 34);
  
  doc.line(14, 40, pageWidth - 14, 40);
  let yPos = 50;

  const termsToProcess: Term[] = term === 'whole-year' ? ['1', '2', '3', '4'] : [term];

  termsToProcess.forEach(t => {
      // Avoid page break at start if possible, else check Y
      if (yPos > 250) {
          doc.addPage();
          yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`Term ${t} Compliance Check`, 14, yPos);
      yPos += 8;

      const tSign = docData.teacherSignOff[t];
      const htSign = docData.headTeacherSignOff[t];

      const complianceData = [
          ['Teaching Program', (docData.teachingPrograms[t] && docData.teachingPrograms[t].length > 0) ? 'Submitted' : 'Pending'],
          ['Assessment Marks', docData.marksAndRanks[t] ? 'Submitted' : 'Pending'],
          ['Semester Reports', (t === '2' || t === '4') ? (docData.semesterReports[t] ? 'Submitted' : 'Pending') : 'N/A'],
          ['Student Concerns', `${docData.studentsCausingConcern[t]?.length || 0} Logged`],
          ['Teacher Sign-off', tSign?.date ? `${tSign.teacherName} (${new Date(tSign.date).toLocaleDateString()})` : 'Pending'],
          ['Head Teacher Sign-off', htSign?.date ? `${htSign.teacherName} (${new Date(htSign.date).toLocaleDateString()})` : 'Pending'],
      ];

      autoTable(doc, {
          startY: yPos,
          head: [['Requirement', 'Status']],
          body: complianceData,
          theme: 'grid',
          headStyles: { fillColor: [245, 158, 11] }, // Amber
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
  });

  // Disclaimer
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("This document certifies the completion of mandatory monitoring requirements as per NESA guidelines.", 14, doc.internal.pageSize.height - 20);

  return doc.output('blob');
};
