import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClassGroup, Student, RapidTest, RapidResult, Exam } from '@/types';

interface AssessmentContext {
    rapidTests: RapidTest[];
    rapidResults: RapidResult[];
    exams: Exam[];
}

export const generateClassReport = async (
  classGroup: ClassGroup,
  students: Student[],
  type: 'academic-overview' | 'statistics',
  context?: AssessmentContext
): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  // --- BRANDING HEADER ---
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`${classGroup.name} Report`, margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subject: ${classGroup.subject} | Generated: ${new Date().toLocaleDateString()}`, margin, 30);

  let yPos = 55;

  if (type === 'statistics') {
      // --- STATISTICS SECTION ---
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text("Class Statistics Overview", margin, yPos);
      yPos += 8;
      
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      doc.setTextColor(30);
      doc.setFont('helvetica', 'normal');

      // Stats Calculation
      const total = students.length;
      const atsi = students.filter(s => s.isAtsi || s.profile?.isAtsi).length;
      const nccd = students.filter(s => s.nccd?.active && s.nccd.isNCCD).length;
      const eald = students.filter(s => s.profile?.eald).length;
      const learningPlan = students.filter(s => s.hasLearningPlan || s.plans?.learning?.active).length;
      const learningSupport = students.filter(s => 
          s.evidenceLog?.some(l => l.tags?.includes('Learning Support') || l.type === 'Learning Support')
      ).length;

      const statsData = [
          ['Total Students', total.toString()],
          ['ATSI', `${atsi} (${total > 0 ? ((atsi/total)*100).toFixed(1) : 0}%)`],
          ['NCCD', `${nccd} (${total > 0 ? ((nccd/total)*100).toFixed(1) : 0}%)`],
          ['EALD', `${eald} (${total > 0 ? ((eald/total)*100).toFixed(1) : 0}%)`],
          ['Formal Learning Plans', `${learningPlan} (${total > 0 ? ((learningPlan/total)*100).toFixed(1) : 0}%)`],
          ['Learning Support Tags', `${learningSupport} (${total > 0 ? ((learningSupport/total)*100).toFixed(1) : 0}%)`],
      ];

      autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Count']],
          body: statsData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 4 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // NCCD Breakdown
      doc.text("NCCD Breakdown", margin, yPos);
      yPos += 6;
      
      const levels = { 'QDTP': 0, 'Supplementary': 0, 'Substantial': 0, 'Extensive': 0 };
      students.filter(s => s.nccd?.active).forEach(s => {
          if (s.nccd?.level && levels[s.nccd.level] !== undefined) {
              levels[s.nccd.level]++;
          }
      });

      const nccdBody = Object.entries(levels).map(([lvl, count]) => [lvl, count]);
      
      autoTable(doc, {
          startY: yPos,
          head: [['Level of Adjustment', 'Students']],
          body: nccdBody,
          theme: 'striped',
          headStyles: { fillColor: [100, 116, 139] }
      });

  } else {
      // --- SECTION 1: COHORT GROWTH GRAPHS (VECTOR ENGINE) ---
      if (context && context.rapidTests.length > 0) {
          doc.setFontSize(14);
          doc.setTextColor(16, 185, 129);
          doc.setFont('helvetica', 'bold');
          doc.text("1. Cohort Growth Analytics", margin, yPos);
          yPos += 8;
          
          doc.setDrawColor(16, 185, 129);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 10;

          doc.setTextColor(30);

          const studentIds = students.map(s => s.id);
          const growthData = context.rapidTests.map(test => {
              // Get all results for this test within this class
              const classResults = context.rapidResults.filter(r => r.testId === test.id && studentIds.includes(r.studentId));
              if (classResults.length === 0) return null;

              const max = test.questions.reduce((a,b) => a+b.maxMarks, 0);
              if (max === 0) return null;

              let totalPre = 0, countPre = 0;
              let totalPost = 0, countPost = 0;

              classResults.forEach(r => {
                  const pre = Object.values(r.preTestScores || {}).reduce((a,b) => a+(b||0), 0);
                  const post = Object.values(r.postTestScores || {}).reduce((a,b) => a+(b||0), 0);
                  
                  if (Object.keys(r.preTestScores || {}).length > 0) { totalPre += pre; countPre++; }
                  if (Object.keys(r.postTestScores || {}).length > 0) { totalPost += post; countPost++; }
              });

              if (countPre === 0 && countPost === 0) return null;

              const avgPre = countPre > 0 ? (totalPre / countPre) : 0;
              const avgPost = countPost > 0 ? (totalPost / countPost) : 0;

              return {
                  name: test.name,
                  pre: Math.round((avgPre / max) * 100),
                  post: Math.round((avgPost / max) * 100),
                  count: Math.max(countPre, countPost)
              };
          }).filter(Boolean);

          if (growthData.length > 0) {
              const startX = 50;
              const barHeight = 8;
              const maxBarWidth = 100;
              const gap = 15;

              growthData.forEach(pt => {
                  if (!pt) return;
                  if (yPos > 270) { doc.addPage(); yPos = 20; }

                  doc.setFontSize(9);
                  doc.setTextColor(60);
                  doc.text(`${pt.name} (n=${pt.count})`, margin, yPos + 6);

                  // Track
                  doc.setFillColor(241, 245, 249);
                  doc.roundedRect(startX, yPos, maxBarWidth, barHeight * 2 + 1, 1, 1, 'F');

                  // Pre
                  if (pt.pre > 0) {
                      doc.setFillColor(148, 163, 184); // Grey
                      const w = (pt.pre / 100) * maxBarWidth;
                      doc.rect(startX, yPos, w, barHeight, 'F');
                      doc.setTextColor(255);
                      doc.setFontSize(7);
                      if (w > 10) doc.text(`${pt.pre}%`, startX + 2, yPos + 5.5);
                  }

                  // Post
                  if (pt.post > 0) {
                      doc.setFillColor(79, 70, 229); // Indigo
                      const w = (pt.post / 100) * maxBarWidth;
                      doc.rect(startX, yPos + barHeight, w, barHeight, 'F');
                      doc.setTextColor(255);
                      doc.setFontSize(7);
                      if (w > 10) doc.text(`${pt.post}%`, startX + 2, yPos + barHeight + 5.5);
                  }

                  // Growth Label
                  const growth = pt.post - pt.pre;
                  doc.setFontSize(9);
                  if (growth > 0) {
                      doc.setTextColor(22, 163, 74);
                      doc.text(`+${growth}%`, startX + maxBarWidth + 5, yPos + 8);
                  }

                  yPos += gap + 5;
              });
              yPos += 10;
          } else {
              doc.setFontSize(10);
              doc.setTextColor(150);
              doc.text("No diagnostic data recorded for this class.", margin, yPos);
              yPos += 15;
          }
      }

      // --- SECTION 2: EXTERNAL MEASURES ---
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text("2. External Measures", margin, yPos);
      yPos += 8;
      
      doc.setDrawColor(16, 185, 129);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Helper to count bands
      const countBands = (year: 'year7' | 'year9', domain: string) => {
          const bands = { 'Exceeding': 0, 'Strong': 0, 'Developing': 0, 'Needs additional support': 0 };
          students.forEach(s => {
              const val = (s.naplan?.[year] as any)?.[domain];
              if (val && bands[val as keyof typeof bands] !== undefined) {
                  bands[val as keyof typeof bands]++;
              }
          });
          return bands;
      };

      // NAPLAN Summary
      doc.setFontSize(12);
      doc.setTextColor(60);
      doc.text("NAPLAN Distribution (Year 9)", margin, yPos);
      yPos += 6;

      const n9Read = countBands('year9', 'reading');
      const n9Num = countBands('year9', 'numeracy');
      const n9Writ = countBands('year9', 'writing');

      const naplanBody = [
          ['Exceeding', n9Read.Exceeding, n9Num.Exceeding, n9Writ.Exceeding],
          ['Strong', n9Read.Strong, n9Num.Strong, n9Writ.Strong],
          ['Developing', n9Read.Developing, n9Num.Developing, n9Writ.Developing],
          ['Needs Support', n9Read['Needs additional support'], n9Num['Needs additional support'], n9Writ['Needs additional support']],
      ];

      autoTable(doc, {
          startY: yPos,
          head: [['Band', 'Reading', 'Numeracy', 'Writing']],
          body: naplanBody,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Check-in & VALID
      doc.text("Check-in & VALID Science Averages", margin, yPos);
      yPos += 6;

      let ciReadSum = 0, ciReadCount = 0;
      let ciNumSum = 0, ciNumCount = 0;
      let validSum = 0, validCount = 0;

      students.forEach(s => {
          // Latest check-in
          if (s.academicData?.checkIn && s.academicData.checkIn.length > 0) {
              const latest = [...s.academicData.checkIn].sort((a,b) => b.year - a.year)[0];
              if (latest.reading) { ciReadSum += latest.reading; ciReadCount++; }
              if (latest.numeracy) { ciNumSum += latest.numeracy; ciNumCount++; }
          }
          if (s.academicData?.validScience?.level) {
              validSum += s.academicData.validScience.level;
              validCount++;
          }
      });

      const avgStats = [
          ['Check-in Reading', ciReadCount > 0 ? (ciReadSum / ciReadCount).toFixed(1) + '%' : 'N/A'],
          ['Check-in Numeracy', ciNumCount > 0 ? (ciNumSum / ciNumCount).toFixed(1) + '%' : 'N/A'],
          ['VALID Science Level', validCount > 0 ? (validSum / validCount).toFixed(1) : 'N/A']
      ];

      autoTable(doc, {
          startY: yPos,
          head: [['Assessment', 'Class Average']],
          body: avgStats,
          theme: 'striped',
          tableWidth: 100
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;

      // --- INTERNAL MEASURES ---
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text("3. Targeted Learning", margin, yPos);
      yPos += 8;
      
      doc.setDrawColor(16, 185, 129);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      const sortedByTarget = [...students].sort((a,b) => (b.academicTarget || 0) - (a.academicTarget || 0));
      const topTarget = sortedByTarget.slice(0, 5).map(s => [s.name, s.academicTarget || '-']);
      const bottomTarget = sortedByTarget.slice(-5).reverse().map(s => [s.name, s.academicTarget || '-']);

      autoTable(doc, {
          startY: yPos,
          head: [['Top 5 Academic Targets', 'Target'], ['Bottom 5 Academic Targets', 'Target']],
          body: topTarget.map((t, i) => [t[0], t[1], bottomTarget[i] ? bottomTarget[i][0] : '', bottomTarget[i] ? bottomTarget[i][1] : '']),
          theme: 'plain',
          headStyles: { fillColor: [100, 116, 139] }
      });
  }

  // --- FOOTER ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount} | FractalEDU Reporting`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return doc.output('blob');
};
