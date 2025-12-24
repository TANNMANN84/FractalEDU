
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, RapidTest, RapidResult, Exam } from '@/types';

interface ReportOptions {
    type: 'general' | 'hpge' | 'literacy' | 'numeracy' | 'academic' | 'nccd';
    nccdFrequency?: string;
    terms?: string[];
    includeEvidence?: boolean;
}

interface AssessmentContext {
    rapidTests: RapidTest[];
    rapidResults: RapidResult[];
    exams: Exam[];
    results?: any[];
}

const renderGrowthCharts = (
    doc: jsPDF, 
    student: Student, 
    context: AssessmentContext, 
    startY: number
): number => {
    // 1. Prepare Data
    const studentResults = context.rapidResults.filter(r => r.studentId === student.id);
    const dataPoints = studentResults.map(res => {
        const test = context.rapidTests.find(t => t.id === res.testId);
        if (!test) return null;

        const max = test.questions.reduce((a,b) => a + b.maxMarks, 0);
        if (max === 0) return null;

        const preScore = Object.values(res.preTestScores || {}).reduce((a,b) => a + (b||0), 0);
        const postScore = Object.values(res.postTestScores || {}).reduce((a,b) => a + (b||0), 0);

        // Only include if at least one score exists
        if (preScore === 0 && postScore === 0 && Object.keys(res.preTestScores || {}).length === 0) return null;

        return {
            name: test.name,
            pre: Math.round((preScore / max) * 100),
            post: Math.round((postScore / max) * 100)
        };
    }).filter(Boolean);

    if (dataPoints.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("No diagnostic growth data available.", 14, startY + 10);
        return startY + 20;
    }

    // 2. Setup Chart Canvas
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Diagnostic Growth (Pre vs Post)", 14, startY);
    
    let currentY = startY + 10;
    const chartHeight = 40;
    const barHeight = 8;
    const gap = 15;
    const maxBarWidth = 100;
    const startX = 50; // Labels on left

    // 3. Render Vector Charts
    dataPoints.forEach(pt => {
        if (!pt) return;
        
        // Label
        doc.setFontSize(9);
        doc.setTextColor(60);
        doc.text(pt.name.length > 20 ? pt.name.substring(0, 20) + '...' : pt.name, 14, currentY + 6);

        // Background Track
        doc.setFillColor(241, 245, 249); // Slate 100
        doc.roundedRect(startX, currentY, maxBarWidth, barHeight * 2 + 1, 1, 1, 'F');

        // Pre Bar (Grey)
        if (pt.pre > 0) {
            doc.setFillColor(148, 163, 184); // Slate 400
            const preW = (pt.pre / 100) * maxBarWidth;
            doc.rect(startX, currentY, preW, barHeight, 'F');
            
            // Label
            doc.setFontSize(7);
            doc.setTextColor(255);
            if (preW > 10) doc.text(`${pt.pre}%`, startX + 2, currentY + 5.5);
        }

        // Post Bar (Blue)
        if (pt.post > 0) {
            doc.setFillColor(59, 130, 246); // Blue 500
            const postW = (pt.post / 100) * maxBarWidth;
            doc.rect(startX, currentY + barHeight, postW, barHeight, 'F');

            // Label
            doc.setFontSize(7);
            doc.setTextColor(255);
            if (postW > 10) doc.text(`${pt.post}%`, startX + 2, currentY + barHeight + 5.5);
        }

        // Growth Indicator
        const growth = pt.post - pt.pre;
        doc.setFontSize(9);
        if (growth > 0) {
            doc.setTextColor(22, 163, 74); // Green
            doc.text(`+${growth}%`, startX + maxBarWidth + 5, currentY + 8);
        } else if (growth < 0) {
            doc.setTextColor(220, 38, 38); // Red
            doc.text(`${growth}%`, startX + maxBarWidth + 5, currentY + 8);
        }

        currentY += gap + 5;
    });

    // Legend
    const legendY = currentY;
    doc.setFillColor(148, 163, 184);
    doc.rect(14, legendY, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Pre-Test", 20, legendY + 2.5);

    doc.setFillColor(59, 130, 246);
    doc.rect(40, legendY, 3, 3, 'F');
    doc.text("Post-Test", 46, legendY + 2.5);

    return currentY + 10;
};

const renderExamCharts = (
    doc: jsPDF, 
    student: Student, 
    context: AssessmentContext, 
    startY: number
): number => {
    // 1. Prepare Data
    const studentResults = context.results?.filter(r => r.studentId === student.id) || [];
    
    if (studentResults.length === 0) return startY;

    // 2. Setup Chart Canvas
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Formal Assessment Results", 14, startY);
    
    let currentY = startY + 10;
    const barHeight = 8;
    const maxBarWidth = 100;
    const startX = 50; // Labels on left

    // 3. Render Vector Charts
    studentResults.forEach(res => {
        const exam = context.exams.find(e => e.id === res.examId);
        if (!exam) return;

        // Check page break
        if (currentY > 270) {
            doc.addPage();
            currentY = 20;
        }

        const max = exam.maxMarks || 100;
        const score = res.score || 0;
        const percentage = Math.min(100, Math.max(0, Math.round((score / max) * 100)));

        // Label
        doc.setFontSize(9);
        doc.setTextColor(60);
        doc.text(`${exam.title} (${new Date(exam.date).toLocaleDateString()})`, 14, currentY + 6);

        // Background Track
        doc.setFillColor(241, 245, 249); // Slate 100
        doc.roundedRect(startX, currentY, maxBarWidth, barHeight, 1, 1, 'F');

        // Score Bar (Indigo)
        doc.setFillColor(99, 102, 241); // Indigo 500
        const width = (percentage / 100) * maxBarWidth;
        doc.roundedRect(startX, currentY, width, barHeight, 1, 1, 'F');

        // Text Label
        doc.setFontSize(8);
        doc.setTextColor(255);
        if (width > 12) {
            doc.text(`${score}/${max}`, startX + 2, currentY + 5.5);
        } else {
            doc.setTextColor(0);
            doc.text(`${score}/${max}`, startX + width + 2, currentY + 5.5);
        }

        currentY += 15;
    });

    return currentY + 10;
};

export const generateStudentDossier = async (
  student: Student, 
  teacherName: string, 
  evidenceCount: number, 
  options: ReportOptions,
  context?: AssessmentContext
): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // --- HEADER ---
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text(student.name, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Type: ${options.type.toUpperCase()} | Generated by ${teacherName} on ${new Date().toLocaleDateString()}`, 14, 26);
  doc.line(14, 32, pageWidth - 14, 32);
  
  let yPos = 45;

  // --- FILTER BY TERM (If specified) ---
  let filteredEvidence = student.evidenceLog || [];

  if (options.terms && options.terms.length > 0 && options.terms.length < 4) {
      const getTerm = (d: Date) => {
          const month = d.getMonth(); // 0-11
          if (month <= 3) return '1'; // Jan-Apr
          if (month <= 6) return '2'; // May-Jul
          if (month <= 9) return '3'; // Aug-Oct
          return '4'; // Nov-Dec
      };
      
      filteredEvidence = filteredEvidence.filter(l => {
          return options.terms?.includes(getTerm(new Date(l.date)));
      });
  }

  // --- STRICT EVIDENCE FILTERING ---
  
  if (options.type === 'academic') {
      const exclusionList = ['Behaviour', 'Wellbeing', 'Cultural', 'SeatingPlan', 'Medical', 'Seating Plan'];
      filteredEvidence = filteredEvidence.filter(l => 
          !exclusionList.includes(l.type) && 
          !l.tags?.some(t => exclusionList.includes(t))
      );
  } else if (options.type === 'literacy') {
      const inclusionList = ['Literacy', 'Reading', 'Writing', 'English'];
      filteredEvidence = filteredEvidence.filter(l => 
          inclusionList.includes(l.type) || 
          l.tags?.some(t => inclusionList.includes(t))
      );
  } else if (options.type === 'numeracy') {
      const inclusionList = ['Numeracy', 'Maths', 'Mathematics'];
      filteredEvidence = filteredEvidence.filter(l => 
          inclusionList.includes(l.type) || 
          l.tags?.some(t => inclusionList.includes(t))
      );
  } else if (options.type === 'hpge') {
      const inclusionList = ['HPGE', 'Gifted', 'Extension'];
      filteredEvidence = filteredEvidence.filter(l => 
          inclusionList.includes(l.type) || 
          l.tags?.some(t => inclusionList.includes(t))
      );
  } else if (options.type === 'nccd') {
      filteredEvidence = filteredEvidence.filter(l => 
          (l.tags?.includes('NCCD') || l.type === 'NCCD' || l.tags?.includes('Learning Support')) &&
          !l.content.toLowerCase().includes('consultation')
      );
  }

  // --- FINAL EVIDENCE CHECK ---
  if (options.includeEvidence === false) {
      filteredEvidence = [];
  }

  // --- NCCD SPECIFIC LAYOUT ---
  if (options.type === 'nccd') {
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text("NCCD Student Summary Sheet", 14, yPos);
      yPos += 10;

      // Section 1: Disability Details
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text("1. Disability Details", 14, yPos);
      yPos += 6;
      
      const isActive = student.nccd?.active && student.nccd.isNCCD;
      const nccdInfo = [
          ['Status', isActive ? 'Active' : 'Not Imputed'],
          ['Category', isActive ? (student.nccd?.categories?.join(', ') || student.nccd?.category || 'Not specified') : '-'],
          ['Level of Adjustment', isActive ? (student.nccd?.level || 'Not specified') : '-']
      ];
      
      autoTable(doc, {
          startY: yPos,
          body: nccdInfo,
          theme: 'plain',
          styles: { fontSize: 10, cellPadding: 2 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Section 2: Assessed Needs
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text("2. Evidence of Assessed Needs", 14, yPos);
      yPos += 6;
      
      const needsText = student.support.needs.length > 0 ? student.support.needs.join(', ') : "Ongoing monitoring of learning needs.";
      doc.setFontSize(10);
      doc.setTextColor(0);
      const splitNeeds = doc.splitTextToSize(needsText, pageWidth - 28);
      doc.text(splitNeeds, 14, yPos);
      yPos += (splitNeeds.length * 5) + 8;

      // Section 3: Adjustments
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text("3. Evidence of Adjustments", 14, yPos);
      yPos += 6;
      
      const activeAdjustments = student.adjustments?.filter(a => a.active).map(a => [a.category, a.description]) || [];
      if (activeAdjustments.length > 0) {
          autoTable(doc, {
              startY: yPos,
              head: [['Category', 'Adjustment Strategy']],
              body: activeAdjustments,
              theme: 'grid',
              styles: { fontSize: 9 }
          });
          yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text("No specific adjustments recorded.", 14, yPos);
          yPos += 10;
      }

      // Section 4: Monitoring Evidence
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text("4. Evidence of Monitoring", 14, yPos);
      yPos += 6;
  }

  // --- STANDARD SECTIONS (General, HPGE, etc.) ---
  if (options.type !== 'nccd') {
      // Profile Snapshot
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Student Profile", 14, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(60);
      doc.text(`Cohort: ${student.cohort}  |  Attendance: ${student.profile?.attendanceRate || 0}%`, 14, yPos);
      yPos += 6;
      
      const wellbeingNote = student.wellbeing.notes ? `Wellbeing Note: "${student.wellbeing.notes}"` : "No active wellbeing notes.";
      const splitNotes = doc.splitTextToSize(wellbeingNote, pageWidth - 28);
      doc.text(splitNotes, 14, yPos);
      yPos += (splitNotes.length * 5) + 8;

      // NCCD Status Check
      if (student.nccd?.active && student.nccd.isNCCD) {
          doc.setTextColor(220, 38, 38);
          doc.setFontSize(10);
          doc.text(`NCCD Active: ${student.nccd.level} (${student.nccd.categories?.join(', ') || student.nccd.category})`, 14, yPos);
          yPos += 10;
      } else {
          doc.setTextColor(100);
          doc.setFontSize(10);
          doc.text("NCCD Status: Not Imputed", 14, yPos);
          yPos += 10;
      }

      // Academic Tables (NAPLAN)
      if (student.naplan && (options.type === 'general' || options.type === 'literacy' || options.type === 'numeracy' || options.type === 'academic')) {
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text("Academic Data", 14, yPos);
          yPos += 6;

          const head = [['Year', 'Reading', 'Writing', 'Numeracy', 'Grammar']];
          const body = [];
          if (student.naplan.year9) body.push(['Year 9', student.naplan.year9.reading, student.naplan.year9.writing, student.naplan.year9.numeracy, student.naplan.year9.grammar]);
          if (student.naplan.year7) body.push(['Year 7', student.naplan.year7.reading, student.naplan.year7.writing, student.naplan.year7.numeracy, student.naplan.year7.grammar]);

          // Filter columns based on type
          let finalHead = head;
          let finalBody = body;

          if (options.type === 'literacy') {
              finalHead = [['Year', 'Reading', 'Writing', 'Grammar']];
              finalBody = body.map(r => [r[0], r[1], r[2], r[4]]);
          } else if (options.type === 'numeracy') {
              finalHead = [['Year', 'Numeracy']];
              finalBody = body.map(r => [r[0], r[3]]);
          }

          if (finalBody.length > 0) {
              autoTable(doc, {
                  startY: yPos,
                  head: finalHead,
                  body: finalBody,
                  theme: 'grid',
                  headStyles: { fillColor: [50, 50, 50] },
                  styles: { fontSize: 10 }
              });
              yPos = (doc as any).lastAutoTable.finalY + 10;
          }

          // VECTOR GRAPH: Growth Charts (Academic Report Only)
          if (options.type === 'academic' && context) {
              yPos = renderGrowthCharts(doc, student, context, yPos);
              yPos = renderExamCharts(doc, student, context, yPos);
          }

          // CHECK-IN ASSESSMENT DATA
          if (student.academicData?.checkIn && student.academicData.checkIn.length > 0) {
              const checkInBody = student.academicData.checkIn.map(c => [
                  `Year ${c.year}`, 
                  c.reading ? `${c.reading}%` : '-', 
                  c.numeracy ? `${c.numeracy}%` : '-'
              ]);

              let ciHead = [['Check-in', 'Reading', 'Numeracy']];
              let ciBody = checkInBody;

              if (options.type === 'literacy') {
                  ciHead = [['Check-in', 'Reading']];
                  ciBody = checkInBody.map(r => [r[0], r[1]]);
              } else if (options.type === 'numeracy') {
                  ciHead = [['Check-in', 'Numeracy']];
                  ciBody = checkInBody.map(r => [r[0], r[2]]);
              }

              if (ciBody.length > 0) {
                  doc.setFontSize(11);
                  doc.setTextColor(60);
                  doc.text("Check-in Assessments", 14, yPos + 5);
                  yPos += 8;

                  autoTable(doc, {
                      startY: yPos,
                      head: ciHead,
                      body: ciBody,
                      theme: 'striped',
                      headStyles: { fillColor: [79, 70, 229] }, // Indigo
                      styles: { fontSize: 10 }
                  });
                  yPos = (doc as any).lastAutoTable.finalY + 15;
              }
          }
      }
  }

  // --- EVIDENCE TABLE (Shared) ---
  if (filteredEvidence.length > 0 && options.includeEvidence !== false) {
      if (options.type !== 'nccd') {
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text(`Evidence Logs (${filteredEvidence.length})`, 14, yPos);
          yPos += 6;
      }

      const evidenceBody = filteredEvidence.map(log => [
          new Date(log.date).toLocaleDateString(),
          log.type,
          log.content,
          log.author
      ]);
      
      autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Type', 'Content', 'Author']],
          body: evidenceBody,
          theme: 'striped',
          headStyles: { fillColor: [51, 65, 85] },
          styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
          columnStyles: { 2: { cellWidth: 'auto' } }
      });
  } else if (options.includeEvidence !== false) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("No matching evidence logs found.", 14, yPos);
  }
  
  return doc.output('blob');
};
