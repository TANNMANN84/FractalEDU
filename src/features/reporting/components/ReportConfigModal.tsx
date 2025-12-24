
import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, Loader2, Download, Filter, Calendar } from 'lucide-react';
import { useAppStore } from '@/store';
import { storageService } from '@/services/storageService';
import { PDFDocument } from 'pdf-lib';

interface Props {
  type: 'student' | 'class' | 'compliance';
  onClose: () => void;
}

export const ReportConfigModal: React.FC<Props> = ({ type, onClose }) => {
  const { students, classes, monitoringDocs, teacherProfile, rapidTests, rapidResults, exams } = useAppStore();
  
  // Selection State
  const [selectedId, setSelectedId] = useState(''); // Student ID or Class ID
  const [subType, setSubType] = useState<string>('general');
  const [term, setTerm] = useState<string>('1');

  // Filter State
  const [studentFilterMode, setStudentFilterMode] = useState<'all' | 'class' | 'cohort'>('all');
  const [filterValue, setFilterValue] = useState<string>('');

  // Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Set default subtypes
  useEffect(() => {
      if (type === 'student') setSubType('general');
      if (type === 'class') setSubType('academic-overview');
      if (type === 'compliance') setTerm('1');
  }, [type]);

  // Reset selection when filter changes
  useEffect(() => {
      setSelectedId('');
  }, [studentFilterMode, filterValue]);

  // Derived Data for Filters
  const uniqueCohorts = useMemo(() => Array.from(new Set(students.map(s => s.cohort))).sort(), [students]);
  
  const filteredStudents = useMemo(() => {
      let list = students;
      if (studentFilterMode === 'class' && filterValue) {
          const cls = classes.find(c => c.id === filterValue);
          list = cls ? list.filter(s => cls.studentIds.includes(s.id)) : [];
      } else if (studentFilterMode === 'cohort' && filterValue) {
          list = list.filter(s => s.cohort === filterValue);
      }
      return list.sort((a,b) => a.name.localeCompare(b.name));
  }, [students, classes, studentFilterMode, filterValue]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusText('Initializing...');

    try {
      // --- DYNAMIC IMPORTS ---
      const [
        { generateStudentDossier },
        { generateClassReport },
        { generateMonitoringReport },
        { pdfMergeService },
        fileSaverModule,
        jsZipModule
      ] = await Promise.all([
        import('../services/studentDossierGenerator'),
        import('../services/classReportGenerator'),
        import('../services/monitoringReportGenerator'),
        import('../services/pdfMergeService'),
        import('file-saver'),
        import('jszip')
      ]);

      const FileSaver = fileSaverModule.default || fileSaverModule;
      const JSZip = (jsZipModule.default || jsZipModule) as any;

      let mainReportBlob: Blob | null = null;
      let evidenceFiles: any[] = [];
      let fileName = 'Report';

      // Context for Generators (Graphing Engine)
      const assessmentContext = {
          rapidTests,
          rapidResults,
          exams
      };

      // --- GENERATION LOGIC ---
      
      if (type === 'student') {
          const student = students.find(s => s.id === selectedId);
          if (!student) throw new Error("Student not found");
          
          fileName = `${student.name.replace(/\s+/g,'_')}_${subType.toUpperCase()}`;
          setStatusText(`Generating ${subType} report...`);
          
          mainReportBlob = await generateStudentDossier(
              student, 
              teacherProfile?.name || 'Staff', 
              0, 
              { type: subType as any },
              assessmentContext
          );

          // Collect Evidence Files
          if (subType === 'general' || subType === 'nccd' || subType === 'academic') {
              setStatusText('Fetching attachments...');
              for (const log of student.evidenceLog || []) {
                  if (log.file) {
                      const content = await storageService.getFileContent(log.file.id);
                      if (content) evidenceFiles.push({ ...log, fileContent: content, fileName: log.file.name, fileType: 'application/pdf' }); 
                  }
              }
          }

      } else if (type === 'class') {
          const cls = classes.find(c => c.id === selectedId);
          if (!cls) throw new Error("Class not found");
          const classStudents = students.filter(s => cls.studentIds.includes(s.id));
          
          fileName = `${cls.name.replace(/\s+/g,'_')}_ClassReport`;
          setStatusText('Analyzing class data...');
          
          mainReportBlob = await generateClassReport(
              cls, 
              classStudents, 
              subType as any,
              assessmentContext
          );

      } else if (type === 'compliance') {
          const cls = classes.find(c => c.id === selectedId);
          if (!cls) throw new Error("Class not found");
          const doc = monitoringDocs.find(d => d.classId === cls.id);
          if (!doc) throw new Error("No monitoring document found for this class.");
          
          fileName = `${cls.name}_Monitoring_Term${term}`;
          setStatusText('Generating Junior Monitoring Report...');
          
          const classStudents = students.filter(s => cls.studentIds.includes(s.id));
          const monBlob = await generateMonitoringReport(doc, cls, classStudents, term as any);
          
          if (term === 'whole-year') {
              setStatusText('Appending Class Report...');
              // Generate Class Report
              const classBlob = await generateClassReport(
                  cls, 
                  classStudents, 
                  'academic-overview',
                  assessmentContext
              );
              
              // Merge Mon + Class
              const pdfDoc = await PDFDocument.load(await monBlob.arrayBuffer());
              const classPdf = await PDFDocument.load(await classBlob.arrayBuffer());
              const copiedPages = await pdfDoc.copyPages(classPdf, classPdf.getPageIndices());
              copiedPages.forEach(p => pdfDoc.addPage(p));
              const mergedBytes = await pdfDoc.save();
              mainReportBlob = new Blob([mergedBytes as any], { type: 'application/pdf' });
          } else {
              mainReportBlob = monBlob;
          }
      }

      // --- MERGE & DOWNLOAD ---
      if (mainReportBlob) {
          setStatusText('Finalizing package...');
          const result = await pdfMergeService.mergeReports(mainReportBlob, evidenceFiles);
          
          if (result.unmergedFiles.length > 0) {
              const zip = new JSZip();
              zip.file(`${fileName}.pdf`, result.pdfBlob);
              const folder = zip.folder("Attachments");
              result.unmergedFiles.forEach((f: any) => folder?.file(f.name, f.data));
              const zipContent = await zip.generateAsync({type: "blob"});
              FileSaver.saveAs(zipContent, `${fileName}_Package.zip`);
          } else {
              FileSaver.saveAs(result.pdfBlob, `${fileName}.pdf`);
          }
      }

    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">
                {type === 'student' ? 'Student Report Configuration' : type === 'class' ? 'Class Report Configuration' : 'Monitoring Report'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-6 mb-8">
            
            {/* STUDENT FILTERS */}
            {type === 'student' && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase">Filter Students</label>
                        <Filter className="w-4 h-4 text-slate-400" />
                    </div>
                    
                    {/* Filter Type Toggle */}
                    <div className="flex gap-2">
                        {['all', 'class', 'cohort'].map(m => (
                            <button
                                key={m}
                                onClick={() => { setStudentFilterMode(m as any); setFilterValue(''); }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${
                                    studentFilterMode === m 
                                    ? 'bg-white text-brand-600 border border-brand-200 shadow-sm' 
                                    : 'text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {m === 'all' ? 'All' : m}
                            </button>
                        ))}
                    </div>

                    {/* Filter Context Dropdown */}
                    {studentFilterMode === 'class' && (
                        <select 
                            value={filterValue} 
                            onChange={e => setFilterValue(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md text-sm outline-none focus:border-brand-500"
                        >
                            <option value="">-- Select Class --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    )}

                    {studentFilterMode === 'cohort' && (
                        <select 
                            value={filterValue} 
                            onChange={e => setFilterValue(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md text-sm outline-none focus:border-brand-500"
                        >
                            <option value="">-- Select Cohort --</option>
                            {uniqueCohorts.map((c: string) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                </div>
            )}

            {/* MAIN SELECTOR */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {type === 'student' ? 'Select Student' : 'Select Class'}
                </label>
                <select 
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    disabled={isGenerating}
                >
                    <option value="">-- Select --</option>
                    {type === 'student' 
                        ? filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                        : classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    }
                </select>
                {type === 'student' && filteredStudents.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No students match current filters.</p>
                )}
            </div>

            {/* SUB-TYPE SELECTOR */}
            {type === 'student' && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Report Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['general', 'hpge', 'literacy', 'numeracy', 'academic', 'nccd'].map(t => (
                            <button
                                key={t}
                                onClick={() => setSubType(t)}
                                className={`px-3 py-2 text-xs font-bold uppercase rounded border transition-all ${
                                    subType === t 
                                    ? 'bg-brand-600 text-white border-brand-600' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {type === 'class' && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Report Type</label>
                    <div className="flex gap-2">
                        <button onClick={() => setSubType('academic-overview')} className={`flex-1 py-2 text-xs font-bold uppercase rounded border ${subType === 'academic-overview' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200'}`}>Academic</button>
                        <button onClick={() => setSubType('statistics')} className={`flex-1 py-2 text-xs font-bold uppercase rounded border ${subType === 'statistics' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200'}`}>Statistics</button>
                    </div>
                </div>
            )}

            {type === 'compliance' && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Term Selection</label>
                    <div className="flex flex-wrap gap-2">
                        {['1','2','3','4','whole-year'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTerm(t)}
                                className={`px-4 py-2 text-xs font-bold uppercase rounded border ${
                                    term === t 
                                    ? 'bg-amber-600 text-white border-amber-600' 
                                    : 'bg-white border-slate-200'
                                }`}
                            >
                                {t === 'whole-year' ? 'Whole Year' : `Term ${t}`}
                            </button>
                        ))}
                    </div>
                    {term === 'whole-year' && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">Includes Class Academic Report as an appendix.</p>
                    )}
                </div>
            )}
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !selectedId}
          className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
          {isGenerating ? statusText : "Generate Report"}
        </button>
      </div>
    </div>
  );
};
