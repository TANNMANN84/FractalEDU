import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { ReviewPackage } from '@/types';
import { FileText, Download, Printer, ChevronDown, AlertTriangle, CheckCircle, TrendingUp, Users, Calendar, FileCheck, GraduationCap, BarChart, Shield, Filter, Loader2, Search } from 'lucide-react';
import { generateMonitoringReport } from './services/monitoringReportGenerator';
import { storageService } from '@/services/storageService';
import { StudentReportConfigModal } from './templates/StudentReportConfigModal';

export const Reporting: React.FC = () => {
    const { classes, students, monitoringDocs, teacherProfile, rapidTests, rapidResults, exams, results } = useAppStore();
    
    // Mode State
    const [mode, setMode] = useState<'class' | 'student' | 'compliance'>('class');
    
    // Selection State
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [complianceTerm, setComplianceTerm] = useState<string>('1');
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusText, setStatusText] = useState('');
    
    // Student Config Modal State
    const [studentConfig, setStudentConfig] = useState<{ isOpen: boolean; type: string } | null>(null);

    const selectedClass = classes.find(c => c.id === selectedClassId);
    const classStudents = selectedClass 
        ? students.filter(s => selectedClass.studentIds.includes(s.id))
        : [];
    
    const monitoringDoc = selectedClass 
        ? monitoringDocs.find(d => d.classId === selectedClass.id)
        : null;
    
    const selectedStudent = students.find(s => s.id === selectedStudentId);

    // Student Filter Logic
    const filteredStudents = useMemo(() => {
        if (selectedClassId) return students.filter(s => selectedClass?.studentIds.includes(s.id));
        return students.sort((a,b) => a.name.localeCompare(b.name));
    }, [students, selectedClassId, selectedClass]);

    const handleExportPackage = () => {
        if (!selectedClass || !monitoringDoc) return;

        const pkg: ReviewPackage = {
            // @ts-ignore - ensuring compatibility with Settings.tsx import logic
            dataType: 'reviewPackage',
            classGroup: selectedClass,
            students: classStudents,
            monitoringDoc: monitoringDoc,
            profilerSnapshot: [],
            files: undefined
        };

        const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedClass.name.replace(/[^a-z0-9]/gi, '_')}_ReviewPackage.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDownloadCompliancePDF = async () => {
        if (!selectedClass || !monitoringDoc) return; // Should handle 'no doc' case gracefully in generator if needed, but UI prevents it
        setIsGenerating(true);
        setStatusText('Gathering compliance data...');
        
        try {
            const [
                { generateMonitoringReport },
                { pdfMergeService },
                fileSaverModule,
                jsZipModule
            ] = await Promise.all([
                import('./services/monitoringReportGenerator'),
                import('./services/pdfMergeService'),
                import('file-saver'),
                import('jszip')
            ]);

            const FileSaver = fileSaverModule.default || fileSaverModule;
            const JSZip = (jsZipModule.default || jsZipModule) as any;

            // 1. Generate Base PDF
            const blob = await generateMonitoringReport(monitoringDoc, selectedClass, classStudents, complianceTerm as any, teacherProfile?.name);
            
            // 2. Collect Attachments
            setStatusText('Fetching attachments...');
            const filesMap = new Map<string, {id: string, name: string, type: any}>();
            const collect = (f: any) => { if(f?.id) filesMap.set(f.id, f); };
            const collectList = (fs: any[]) => { if(fs) fs.forEach(collect); };

            // Common Docs
            collect(monitoringDoc.scopeAndSequence);
            collect(monitoringDoc.assessmentSchedule);
            
            // Term Specifics
            const terms = complianceTerm === 'whole-year' ? ['1','2','3','4'] : [complianceTerm];
            terms.forEach(t => {
                // @ts-ignore
                collectList(monitoringDoc.teachingPrograms[t]);
                // @ts-ignore
                collect(monitoringDoc.semesterReports[t]);
                // @ts-ignore
                collect(monitoringDoc.marksAndRanks[t]);
                // @ts-ignore
                monitoringDoc.studentsCausingConcern[t]?.forEach((c: any) => collect(c.file));
                // @ts-ignore
                collectList(monitoringDoc.illnessMisadventure[t]);
                // @ts-ignore
                collectList(monitoringDoc.malpractice[t]);
            });

            // Global Assessments
            collectList(monitoringDoc.assessmentTask1);
            collectList(monitoringDoc.assessmentTask2);
            collectList(monitoringDoc.assessmentTask3);
            collectList(monitoringDoc.prePostDiagnostic);
            Object.values(monitoringDoc.scannedWorkSamples).forEach((ws: any) => {
                collect(ws.top); collect(ws.middle); collect(ws.low);
            });

            // Fetch Content
            const evidenceFiles: any[] = [];
            for (const file of filesMap.values()) {
                 const content = await storageService.getFileContent(file.id);
                 if (content) evidenceFiles.push({ fileName: file.name, fileType: file.type, fileContent: content });
            }

            // 3. Merge & Package
            setStatusText('Finalizing package...');
            const result = await pdfMergeService.mergeReports(blob, evidenceFiles);
            const fileName = `${selectedClass.name}_Monitoring_Term${complianceTerm}`;

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
        } catch (e) {
            console.error(e);
            alert("Failed to generate compliance package.");
        } finally {
            setIsGenerating(false);
            setStatusText('');
        }
    };

    // Generic Generator Handler
    const handleGenerateReport = async (
        generatorType: 'student' | 'class', 
        subType: string,
        options?: { terms?: string[], includeEvidence?: boolean }
    ) => {
        setIsGenerating(true);
        setStatusText('Initializing...');

        try {
            const [
                { generateStudentDossier },
                { generateClassReport },
                { pdfMergeService },
                fileSaverModule,
                jsZipModule
            ] = await Promise.all([
                import('./services/studentDossierGenerator'),
                import('./services/classReportGenerator'),
                import('./services/pdfMergeService'),
                import('file-saver'),
                import('jszip')
            ]);

            const FileSaver = fileSaverModule.default || fileSaverModule;
            const JSZip = (jsZipModule.default || jsZipModule) as any;
            
            const assessmentContext = { rapidTests, rapidResults, exams, results };
            let mainReportBlob: Blob | null = null;
            let evidenceFiles: any[] = [];
            let fileName = 'Report';

            if (generatorType === 'student' && selectedStudent) {
                fileName = `${selectedStudent.name.replace(/\s+/g,'_')}_${subType.toUpperCase()}`;
                setStatusText(`Generating ${subType} report...`);
                
                mainReportBlob = await generateStudentDossier(
                    selectedStudent, 
                    teacherProfile?.name || 'Staff', 
                    0, 
                    { type: subType as any, ...options },
                    assessmentContext
                );

                // Attachments
                if (['general', 'nccd', 'academic'].includes(subType) && options?.includeEvidence !== false) {
                    setStatusText('Fetching attachments...');
                    for (const log of selectedStudent.evidenceLog || []) {
                        if (log.file) {
                            const content = await storageService.getFileContent(log.file.id);
                            if (content) evidenceFiles.push({ ...log, fileContent: content, fileName: log.file.name, fileType: 'application/pdf' }); 
                        }
                    }
                }
            } else if (generatorType === 'class' && selectedClass) {
                fileName = `${selectedClass.name.replace(/\s+/g,'_')}_${subType}`;
                setStatusText('Analyzing class data...');
                mainReportBlob = await generateClassReport(
                    selectedClass, 
                    classStudents, 
                    subType as any,
                    assessmentContext
                );
            }

            if (mainReportBlob) {
                setStatusText('Finalizing...');
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
            setStatusText('');
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header & Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reporting Suite</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Select a mode to view data and generate reports.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    
                    {/* Mode Switcher */}
                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm mr-2">
                        <button 
                            onClick={() => setMode('class')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded transition-colors ${mode === 'class' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            <BarChart className="w-4 h-4" /> Class Reports
                        </button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button 
                            onClick={() => setMode('student')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded transition-colors ${mode === 'student' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            <GraduationCap className="w-4 h-4" /> Student Profiles
                        </button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button 
                            onClick={() => setMode('compliance')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded transition-colors ${mode === 'compliance' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            <Shield className="w-4 h-4" /> Compliance
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTEXTUAL TOOLBAR */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center">
                
                {/* Class Selector (Always visible for Class/Compliance, optional filter for Student) */}
                <div className="relative min-w-[200px]">
                    <select 
                        value={selectedClassId} 
                        onChange={(e) => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm"
                    >
                        <option value="">{mode === 'student' ? 'All Classes (Filter)' : 'Select a Class...'}</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Student Selector (Only Student Mode) */}
                {mode === 'student' && (
                    <div className="relative min-w-[250px]">
                        <select 
                            value={selectedStudentId} 
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-10 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm"
                        >
                            <option value="">Select Student...</option>
                            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                )}

                {/* Term Selector (Only Compliance Mode) */}
                {mode === 'compliance' && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {['1','2','3','4','whole-year'].map(t => (
                            <button
                                key={t}
                                onClick={() => setComplianceTerm(t)}
                                className={`px-3 py-1 text-xs font-bold uppercase rounded ${complianceTerm === t ? 'bg-white dark:bg-slate-600 shadow text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                {t === 'whole-year' ? 'Year' : `T${t}`}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1"></div>

                {/* ACTION BUTTONS */}
                {mode === 'class' && selectedClass && (
                    <>
                        <button onClick={() => handleGenerateReport('class', 'statistics')} disabled={isGenerating} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm font-bold transition-colors">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <BarChart className="w-4 h-4"/>} Stats PDF
                        </button>
                        <button onClick={() => handleGenerateReport('class', 'academic-overview')} disabled={isGenerating} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm font-bold transition-colors">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4"/>} Academic PDF
                        </button>
                        <button onClick={handleExportPackage} className="flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-bold transition-colors shadow-sm">
                            <Download className="w-4 h-4"/> Export Package
                        </button>
                    </>
                )}

                {mode === 'student' && selectedStudent && (
                    <div className="flex gap-2">
                        <button onClick={() => setStudentConfig({ isOpen: true, type: 'general' })} disabled={isGenerating} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-xs font-bold uppercase">General</button>
                        <button onClick={() => setStudentConfig({ isOpen: true, type: 'academic' })} disabled={isGenerating} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-xs font-bold uppercase">Academic</button>
                        <button onClick={() => setStudentConfig({ isOpen: true, type: 'nccd' })} disabled={isGenerating} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-xs font-bold uppercase">NCCD</button>
                        <button onClick={() => setStudentConfig({ isOpen: true, type: 'hpge' })} disabled={isGenerating} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-xs font-bold uppercase">HPGE</button>
                    </div>
                )}

                {mode === 'compliance' && selectedClass && (
                    <button onClick={handleDownloadCompliancePDF} disabled={isGenerating || !monitoringDoc} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-bold transition-colors shadow-sm">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileCheck className="w-4 h-4"/>} Download
                    </button>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            {mode === 'class' && selectedClass ? (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col print:shadow-none print:border-none print:absolute print:inset-0 print:z-50">
                    {/* Report Header */}
                    <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 print:bg-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{selectedClass.name}</h1>
                                <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> {selectedClass.subject}</span>
                                    <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {classStudents.length} Students</span>
                                    <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Cohort: {classStudents[0]?.cohort || 'Mixed'}</span>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Generated</div>
                                <div className="text-lg font-medium text-slate-800 dark:text-slate-200 flex items-center justify-end gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Body */}
                    <div className="flex-1 overflow-y-auto p-8 print:overflow-visible">
                        
                        {/* Monitoring / Handover Section */}
                        <div className="mb-8 break-inside-avoid">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Monitoring & Wellbeing Handover
                            </h3>
                            {monitoringDoc ? (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm">
                                    <span className="font-bold">Monitoring Document Active</span>
                                    <p className="mt-1 text-xs opacity-80">Handover notes and compliance data are attached to this class.</p>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-500 italic text-sm">
                                    No monitoring document initialized for this class.
                                </div>
                            )}
                        </div>

                        {/* Student List */}
                        <div className="break-before-auto">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <CheckCircle className="w-5 h-5 text-brand-500" />
                                Class List
                            </h3>
                            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Support Level</th>
                                            <th className="px-4 py-3">NCCD / ATSI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {classStudents.map(student => (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 break-inside-avoid">
                                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{student.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                        student.support.level === 'extensive' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                        student.support.level === 'substantial' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                        student.support.level === 'supplementary' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                        'bg-slate-100 text-slate-500 border border-slate-200'
                                                    }`}>
                                                        {student.support.level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                                    <div className="flex gap-1">
                                                        {student.isAtsi && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">ATSI</span>}
                                                        {student.support.needs.length > 0 && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">NCCD</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {classStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No students found in this class.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : mode === 'student' && selectedStudent ? (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 overflow-y-auto">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{selectedStudent.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{selectedStudent.cohort} • {selectedStudent.profile?.email || 'No Email'}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-400">Evidence Logs: {selectedStudent.evidenceLog?.length || 0}</div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5"/> Academic Profile</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">NAPLAN Reading</span> <span className="font-medium">{selectedStudent.naplan?.year9?.reading || '-'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">NAPLAN Numeracy</span> <span className="font-medium">{selectedStudent.naplan?.year9?.numeracy || '-'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Attendance</span> <span className="font-medium">{selectedStudent.profile?.attendanceRate || 0}%</span></div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"><Shield className="w-5 h-5"/> Support & NCCD</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Support Level</span> <span className="font-medium capitalize">{selectedStudent.support.level}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">NCCD Status</span> <span className="font-medium">{selectedStudent.nccd?.active ? 'Active' : 'Inactive'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">ATSI</span> <span className="font-medium">{selectedStudent.isAtsi ? 'Yes' : 'No'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : mode === 'compliance' && selectedClass ? (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center p-8 text-center">
                    <Shield className="w-16 h-16 text-amber-500 mb-4 opacity-80" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Monitoring Report Preview</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                        Ready to generate the Junior Monitoring report for <strong>{selectedClass.name}</strong> (Term {complianceTerm}).
                    </p>
                    <button onClick={handleDownloadCompliancePDF} disabled={isGenerating || !monitoringDoc} className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-bold shadow-lg transition-transform hover:-translate-y-1">
                        {isGenerating ? 'Generating...' : 'Download'}
                    </button>
                </div>
            ) : (
                // Empty State
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        {mode === 'student' ? <GraduationCap className="w-10 h-10 text-slate-300"/> : mode === 'compliance' ? <Shield className="w-10 h-10 text-slate-300"/> : <FileText className="w-10 h-10 text-slate-300" />}
                    </div>
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Select a {mode === 'student' ? 'student' : 'class'} to view reports</p>
                </div>
            )}

            {/* Student Report Configuration Modal */}
            {studentConfig && selectedStudent && (
                <StudentReportConfigModal
                    isOpen={studentConfig.isOpen}
                    onClose={() => setStudentConfig(null)}
                    reportType={studentConfig.type}
                    studentName={selectedStudent.name}
                    onConfirm={(options) => {
                        setStudentConfig(null);
                        handleGenerateReport('student', studentConfig.type, options);
                    }}
                />
            )}
        </div>
    );
};