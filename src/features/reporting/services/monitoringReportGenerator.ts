import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonitoringDoc, ClassGroup, Term, Student } from '@/types';

export const generateMonitoringReport = async (
  docData: MonitoringDoc,
  classGroup: ClassGroup,
  students: Student[],
  term: Term | 'whole-year',
  teacherNameFallback: string = 'Staff'
): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  // --- BRANDING HEADER ---
  doc.setFillColor(63, 81, 181); // Indigo 500
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("Junior Monitoring Filing Report", margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 30);

  // --- CLASS INFO CARD ---
  let yPos = 55;
  
  doc.setDrawColor(200);
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(margin, yPos, pageWidth - (margin*2), 35, 2, 2, 'FD');
  
  doc.setTextColor(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(classGroup.name, margin + 5, yPos + 12);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Subject: ${classGroup.subject}`, margin + 5, yPos + 22);
  doc.text(`Scope: ${term === 'whole-year' ? 'Whole Year Report' : 'Term ' + term}`, margin + 5, yPos + 28);
  
  // Determine Teacher Name
  let displayTeacher = teacherNameFallback;
  if (term !== 'whole-year' && docData.teacherSignOff[term]?.teacherName) {
      displayTeacher = docData.teacherSignOff[term].teacherName;
  } else if (term === 'whole-year') {
      // Try to find any signature, starting from latest
      displayTeacher = docData.teacherSignOff['4']?.teacherName || docData.teacherSignOff['3']?.teacherName || docData.teacherSignOff['2']?.teacherName || docData.teacherSignOff['1']?.teacherName || teacherNameFallback;
  }

  // Determine Year Level
  let yearLevel = (classGroup as any).yearGroup || (classGroup as any).year;
  if (!yearLevel) {
      const match = classGroup.name.match(/^(\d+)/);
      yearLevel = match ? `Year ${match[1]}` : 'N/A';
  }

  // Right side of card
  doc.text(`Teacher: ${displayTeacher}`, pageWidth - margin - 60, yPos + 12);
  doc.text(`Year Level: ${yearLevel}`, pageWidth - margin - 60, yPos + 22);

  yPos += 45;

  // --- COMPLIANCE TABLES ---
  const termsToProcess: Term[] = term === 'whole-year' ? ['1', '2', '3', '4'] : [term];

  for (const t of termsToProcess) {
      // Check page break
      if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
      }

      // Section Header
      doc.setFontSize(12);
      doc.setTextColor(63, 81, 181);
      doc.setFont('helvetica', 'bold');
      doc.text(`Term ${t} Monitoring`, margin, yPos);
      yPos += 6;

      const tSign = docData.teacherSignOff[t];
      const htSign = docData.headTeacherSignOff[t];

      // 1. PROGRAM & PLANNING
      doc.setFontSize(10);
      doc.setTextColor(30);
      doc.setFont('helvetica', 'bold');
      doc.text("1. Program & Planning", margin, yPos);
      yPos += 4;

      const programFiles = docData.teachingPrograms[t] || [];
      const programRows = programFiles.length > 0 
          ? programFiles.map(f => ['Teaching Program', f.name, 'Attached'])
          : [['Teaching Program', 'No files attached', 'Pending']];
      
      // Add Scope & Sequence row if it's Term 1 or just generally
      if (t === '1') {
          programRows.unshift(['Scope & Sequence', docData.scopeAndSequence ? 'Sighted & Verified' : 'Not Sighted', docData.scopeAndSequence ? 'Compliant' : 'Pending']);
      }

      autoTable(doc, {
          startY: yPos,
          head: [['Item', 'Details', 'Status']],
          body: programRows,
          theme: 'grid',
          headStyles: { fillColor: [241, 245, 249], textColor: 60, fontStyle: 'bold', lineColor: 200, lineWidth: 0.1 },
          styles: { fontSize: 10, cellPadding: 4 },
          columnStyles: { 
              0: { cellWidth: 50, fontStyle: 'bold' },
              2: { cellWidth: 30, halign: 'center' }
          },
          didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 2) {
                  const text = data.cell.raw as string;
                  if (text === 'Compliant' || text === 'Attached' || text === 'Submitted') data.cell.styles.textColor = [22, 163, 74];
                  else data.cell.styles.textColor = [220, 38, 38];
              }
          }
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;

      // 2. STUDENT PERFORMANCE & SUPPORT
      doc.text("2. Student Performance & Support", margin, yPos);
      yPos += 4;

      const perfRows = [
          ['Marks & Ranks', docData.marksAndRanks[t] ? 'Data Submitted' : 'Missing', docData.marksAndRanks[t] ? 'Submitted' : 'Pending'],
          ['Semester Reports', docData.semesterReports[t] ? 'Reports Filed' : (t==='2'||t==='4' ? 'Missing' : 'N/A'), docData.semesterReports[t] ? 'Submitted' : (t==='2'||t==='4' ? 'Pending' : '-')],
          ['Specific Learning Needs', docData.specificLearningNeeds[t] || 'No specific notes recorded.', docData.specificLearningNeeds[t] ? 'Logged' : '-']
      ];

      // Students Causing Concern
      const concerns = docData.studentsCausingConcern[t] || [];
      if (concerns.length > 0) {
          concerns.forEach(c => {
              perfRows.push(['Student Concern', `${c.name} (${c.category})`, 'Logged']);
          });
      } else {
          perfRows.push(['Student Concerns', 'Nil to report', 'Nil']);
      }

      autoTable(doc, {
          startY: yPos,
          head: [['Item', 'Details', 'Status']],
          body: perfRows,
          theme: 'grid',
          headStyles: { fillColor: [241, 245, 249], textColor: 60, fontStyle: 'bold', lineColor: 200, lineWidth: 0.1 },
          styles: { fontSize: 10, cellPadding: 4 },
          columnStyles: { 
              0: { cellWidth: 50, fontStyle: 'bold' },
              2: { cellWidth: 30, halign: 'center' }
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) {
                const text = data.cell.raw as string;
                if (text === 'Submitted' || text === 'Logged' || text === 'Nil') data.cell.styles.textColor = [22, 163, 74];
                else if (text === 'Pending') data.cell.styles.textColor = [220, 38, 38];
            }
        }
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;

      // 3. COMPLIANCE & NESA
      doc.text("3. Compliance & NESA", margin, yPos);
      yPos += 4;

      const complianceRows = [];
      
      // Illness / Misadventure
      const illness = docData.illnessMisadventure[t] || [];
      if (illness.length > 0) {
          illness.forEach(i => complianceRows.push(['Illness/Misadventure', `${i.name} - ${i.type}`, 'Recorded']));
      } else {
          complianceRows.push(['Illness/Misadventure', 'Nil to report', 'Nil']);
      }

      // Malpractice
      const mal = docData.malpractice[t] || [];
      if (mal.length > 0) {
          mal.forEach(m => complianceRows.push(['Malpractice', `${m.name} - ${m.incident}`, 'Recorded']));
      } else {
          complianceRows.push(['Malpractice', 'Nil to report', 'Nil']);
      }

      autoTable(doc, {
          startY: yPos,
          head: [['Item', 'Details', 'Status']],
          body: complianceRows,
          theme: 'grid',
          headStyles: { fillColor: [241, 245, 249], textColor: 60, fontStyle: 'bold', lineColor: 200, lineWidth: 0.1 },
          styles: { fontSize: 10, cellPadding: 4 },
          columnStyles: { 
              0: { cellWidth: 50, fontStyle: 'bold' },
              2: { cellWidth: 30, halign: 'center' }
          }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;

      // 4. SIGN OFF BLOCK
      // Check space
      if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = 20;
      }

      doc.setDrawColor(200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(margin, yPos, pageWidth - (margin*2), 40, 2, 2, 'FD');
      
      // Teacher Sig
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Class Teacher", margin + 10, yPos + 10);
      
      if (tSign?.date) {
          if ('signatureImage' in tSign && tSign.signatureImage && tSign.signatureImage !== null) {
              try {
                  doc.addImage(tSign.signatureImage, 'PNG', margin + 10, yPos + 12, 40, 15);
              } catch (e) {
                  doc.setFont('helvetica', 'italic');
                  doc.setTextColor(0);
                  doc.text(tSign.teacherName, margin + 10, yPos + 25);
              }
          } else {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(14);
              doc.setTextColor(0);
              doc.text(tSign.teacherName, margin + 10, yPos + 25);
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(22, 163, 74);
          doc.text(`Signed: ${new Date(tSign.date).toLocaleDateString()}`, margin + 10, yPos + 35);
      } else {
          doc.setFontSize(10);
          doc.setTextColor(220, 38, 38);
          doc.text("Pending Signature", margin + 10, yPos + 25);
      }

      // Head Teacher Sig
      const htX = pageWidth / 2 + 10;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Head Teacher", htX, yPos + 10);

      if (htSign?.date) {
          if ('signatureImage' in htSign && htSign.signatureImage && htSign.signatureImage !== null) {
              try {
                  doc.addImage(htSign.signatureImage, 'PNG', htX, yPos + 12, 40, 15);
              } catch (e) {
                  doc.setFont('helvetica', 'italic');
                  doc.setTextColor(0);
                  doc.text(htSign.teacherName, htX, yPos + 25);
              }
          } else {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(14);
              doc.setTextColor(0);
              doc.text(htSign.teacherName, htX, yPos + 25);
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(22, 163, 74);
          doc.text(`Signed: ${new Date(htSign.date).toLocaleDateString()}`, htX, yPos + 35);
      } else {
          doc.setFontSize(10);
          doc.setTextColor(220, 38, 38);
          doc.text("Pending Signature", htX, yPos + 25);
      }

      yPos += 55;
  }

  // --- STUDENT PROFILER SNAPSHOT ---
  if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
  
  doc.setFontSize(12);
  doc.setTextColor(63, 81, 181);
  doc.setFont('helvetica', 'bold');
  doc.text("Student Profiler Snapshot", margin, yPos);
  yPos += 6;

  const snapshotRows = students.map(s => [
      s.name,
      s.support.level !== 'none' ? s.support.level : '-',
      s.nccd?.active ? 'Yes' : '-',
      (s.evidenceLog || []).length.toString(),
      (s.wellbeing.notes || '').length > 0 ? 'Yes' : '-'
  ]);

  autoTable(doc, {
      startY: yPos,
      head: [['Student', 'Support', 'NCCD', 'Logs', 'Wellbeing']],
      body: snapshotRows,
      theme: 'striped',
      headStyles: { fillColor: [100, 116, 139] },
      styles: { fontSize: 9, cellPadding: 3 }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // --- GLOBAL ASSESSMENT TASKS & WORK SAMPLES (If any exist) ---
  // We list these at the end as they often span terms or are stored globally in the doc structure
  if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
  
  doc.setFontSize(12);
  doc.setTextColor(63, 81, 181);
  doc.setFont('helvetica', 'bold');
  doc.text("Assessment Evidence & Work Samples", margin, yPos);
  yPos += 6;

  const assessmentRows = [];
  
  // Tasks
  const tasks = [
      { name: 'Assessment Task 1', files: docData.assessmentTask1 },
      { name: 'Assessment Task 2', files: docData.assessmentTask2 },
      { name: 'Assessment Task 3', files: docData.assessmentTask3 },
      { name: 'Pre/Post Diagnostic', files: docData.prePostDiagnostic }
  ];

  tasks.forEach(t => {
      if (t.files && t.files.length > 0) {
          t.files.forEach(f => assessmentRows.push(['Assessment Task', t.name, f.name]));
      }
  });

  // Work Samples
  if (docData.scannedWorkSamples) {
      Object.entries(docData.scannedWorkSamples).forEach(([key, val]) => {
          if (val.top) assessmentRows.push(['Work Sample (High)', key, val.top.name]);
          if (val.middle) assessmentRows.push(['Work Sample (Mid)', key, val.middle.name]);
          if (val.low) assessmentRows.push(['Work Sample (Low)', key, val.low.name]);
      });
  }

  if (assessmentRows.length > 0) {
      autoTable(doc, {
          startY: yPos,
          head: [['Category', 'Context', 'File Name']],
          body: assessmentRows,
          theme: 'grid',
          headStyles: { fillColor: [241, 245, 249], textColor: 60, fontStyle: 'bold', lineColor: 200, lineWidth: 0.1 },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } }
      });
  } else {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'italic');
      doc.text("No additional assessment files or work samples attached.", margin, yPos + 5);
  }

  // --- FOOTER ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount} | FractalEDU Compliance System`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return doc.output('blob');
};
