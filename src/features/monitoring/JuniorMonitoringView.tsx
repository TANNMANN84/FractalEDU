import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { 
    MonitoringDoc, Term, FileUpload, ConcernEntry, Student, 
    ClassGroup, TermSignOff, AssessmentItem, ConcernCategory
} from '@/types';
import { 
    Layout, 
    Calendar, 
    ClipboardCheck, 
    FileText, 
    UserCheck, 
    ShieldCheck, 
    Save, 
    Download, 
    Upload, 
    Plus, 
    AlertTriangle, 
    CheckCircle2, 
    Trash2, 
    FileSpreadsheet,
    ChevronRight,
    ChevronDown,
    BookOpen,
    Layers,
    Clock,
    FileUp
} from 'lucide-react';
import { MonitoringFileUpload } from './components/MonitoringFileUpload';
import { SignOffModal } from './components/SignOffModal';
import { AddConcernModal } from './components/AddConcernModal';
import { ExportReviewModal } from './components/ExportReviewModal';
import { storageService } from '@/services/storageService';
import { useAppStore } from '@/store';

interface JuniorMonitoringProps {
    monitoringDoc: MonitoringDoc;
    onSave: (updatedDoc: MonitoringDoc, silent?: boolean) => void;
    students: Student[];
    classGroup: ClassGroup;
}

type NavView = 'annual' | Term;

export const JuniorMonitoringView: React.FC<JuniorMonitoringProps> = ({ 
    monitoringDoc, 
    onSave, 
    students, 
    classGroup 
}) => {
    const { teacherProfile, addToast } = useAppStore();
    
    const [doc, setDoc] = useState<MonitoringDoc>(monitoringDoc);
    const [activeView, setActiveView] = useState<NavView>('annual');
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    
    // Modals
    const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
    const [signerRole, setSignerRole] = useState<'teacher' | 'headTeacher' | null>(null);
    const [isAddConcernModalOpen, setIsAddConcernModalOpen] = useState(false);
    const [isExportReviewModalOpen, setIsExportReviewModalOpen] = useState(false);

    const csvInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setDoc(monitoringDoc);
    }, [monitoringDoc]);

    // --- Data Handlers ---

    const handleDocChange = (path: string, value: any) => {
        setDoc(prev => {
            const keys = path.split('.');
            const newDoc = { ...prev };
            
            if (keys.length === 1) {
                (newDoc as any)[keys[0]] = value;
            } else if (keys.length === 2) {
                const rootKey = keys[0] as keyof MonitoringDoc;
                (newDoc as any)[rootKey] = {
                    ...(newDoc[rootKey] as object),
                    [keys[1]]: value
                };
            }
            return newDoc;
        });
    };

    const handleAddTask = () => {
        if (activeView === 'annual') return;
        const term = activeView as Term;
        const newTask: AssessmentItem = {
            id: crypto.randomUUID(),
            name: `Task ${(doc.assessments?.[term]?.length || 0) + 1}`,
            files: {},
            samples: {}
        };
        
        const currentAssessments = doc.assessments || { '1': [], '2': [], '3': [], '4': [] };
        const updatedTermTasks = [...(currentAssessments[term] || []), newTask];
        
        setDoc(prev => ({
            ...prev,
            assessments: {
                ...currentAssessments,
                [term]: updatedTermTasks
            }
        }));
        setExpandedTasks(prev => new Set(prev).add(newTask.id));
    };

    const handleUpdateTask = (taskId: string, updates: Partial<AssessmentItem>) => {
        if (activeView === 'annual') return;
        const term = activeView as Term;
        const currentAssessments = doc.assessments || { '1': [], '2': [], '3': [], '4': [] };
        
        const updated = (currentAssessments[term] || []).map(t => 
            t.id === taskId ? { ...t, ...updates } : t
        );

        setDoc(prev => ({
            ...prev,
            assessments: {
                ...currentAssessments,
                [term]: updated
            }
        }));
    };

    const handleDeleteTask = (taskId: string) => {
        if (activeView === 'annual') return;
        const term = activeView as Term;
        const currentAssessments = doc.assessments || { '1': [], '2': [], '3': [], '4': [] };
        
        const updated = (currentAssessments[term] || []).filter(t => t.id !== taskId);

        setDoc(prev => ({
            ...prev,
            assessments: {
                ...currentAssessments,
                [term]: updated
            }
        }));
    };

    const toggleTaskExpansion = (id: string) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSignOff = (signerName: string, signatureImage?: string) => {
        if (activeView === 'annual' || !signerRole) return;
        const term = activeView as Term;
        const roleKey = signerRole === 'teacher' ? 'teacherSignOff' : 'headTeacherSignOff';
        
        const newSignOff: TermSignOff = {
            teacherName: signerName,
            date: new Date().toISOString(),
            signatureImage
        };

        handleDocChange(`${roleKey}.${term}`, newSignOff);
        setIsSignOffModalOpen(false);
    };

    const handleAddConcern = (newConcern: Omit<ConcernEntry, 'id'>) => {
        if (activeView === 'annual') return;
        const term = activeView as Term;
        const entry: ConcernEntry = {
            ...newConcern,
            id: crypto.randomUUID()
        };
        const updated = [...(doc.studentsCausingConcern?.[term] || []), entry];
        handleDocChange(`studentsCausingConcern.${term}`, updated);
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || activeView === 'annual') return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const rows = text.split(/\r\n|\n/).filter(r => r.trim());
                if (rows.length < 2) throw new Error("File empty or missing headers");
                addToast("CSV processed. Please ensure student names match exactly for automated reporting.", "info");
            } catch (err: any) {
                addToast(err.message || "Failed to parse CSV", "error");
            }
        };
        reader.readAsText(file);
    };

    // --- Navigation Helpers ---

    const getStatusSummary = (view: NavView) => {
        if (view === 'annual') {
            const count = (doc.scopeAndSequence ? 1 : 0) + (doc.assessmentSchedule ? 1 : 0);
            return count === 2 ? 'Complete' : `${count}/2 Uploaded`;
        }
        const term = view as Term;
        const isSigned = !!doc.teacherSignOff?.[term]?.date;
        const flags = doc.studentsCausingConcern?.[term]?.length || 0;
        return isSigned ? 'Signed Off' : `${flags} Flags`;
    };

    // --- Renderers ---

    const renderAnnualView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <header className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800">Annual Compliance & Documentation</h3>
                <p className="text-slate-500">Set up base documentation for the current academic year.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <MonitoringFileUpload 
                        label="Scope and Sequence" 
                        file={doc.scopeAndSequence} 
                        onUpload={(f) => handleDocChange('scopeAndSequence', f)} 
                        onRemove={() => handleDocChange('scopeAndSequence', null)} 
                    />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="p-3 bg-brand-50 text-brand-600 rounded-xl w-fit">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <MonitoringFileUpload 
                        label="Assessment Schedule" 
                        file={doc.assessmentSchedule} 
                        onUpload={(f) => handleDocChange('assessmentSchedule', f)} 
                        onRemove={() => handleDocChange('assessmentSchedule', null)} 
                    />
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-amber-900">Syllabus Certification</h4>
                    <p className="text-sm text-amber-700 mb-4">You must certify that the correct NESA syllabus is being implemented for this cohort.</p>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={doc.certifySyllabus} 
                            onChange={e => handleDocChange('certifySyllabus', e.target.checked)} 
                            className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500" 
                        />
                        <span className="text-sm font-bold text-amber-900 group-hover:underline">
                            I certify that the correct syllabus is being taught and assessed.
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderTermView = (term: Term) => {
        const isReportTerm = term === '2' || term === '4';
        const teacherSign = doc.teacherSignOff?.[term];
        const headSign = doc.headTeacherSignOff?.[term];
        const termAssessments = doc.assessments?.[term] || [];

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
                <header className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">Term {term} Monitoring</h3>
                    <p className="text-slate-500">Record evidence of teaching and student achievement for this interval.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Group 1: Syllabus & Reporting */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                            <Layers className="w-5 h-5 text-indigo-500" /> Syllabus & Reporting
                        </h4>
                        
                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Teaching Programmes</label>
                                <div className="space-y-2 mb-4">
                                    {doc.teachingPrograms?.[term]?.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group transition-all hover:border-indigo-300">
                                            <button onClick={() => storageService.triggerDownload(f)} className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-2">
                                                <FileText className="w-4 h-4" /> {f.name}
                                            </button>
                                            <button onClick={() => {
                                                const updated = (doc.teachingPrograms?.[term] || []).filter((_, idx) => idx !== i);
                                                handleDocChange(`teachingPrograms.${term}`, updated);
                                            }} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {(!doc.teachingPrograms?.[term] || doc.teachingPrograms?.[term].length === 0) && (
                                        <p className="text-xs text-slate-400 italic">No programmes attached yet.</p>
                                    )}
                                </div>
                                <MonitoringFileUpload 
                                    label="" 
                                    file={null} 
                                    onUpload={(f) => handleDocChange(`teachingPrograms.${term}`, [...(doc.teachingPrograms?.[term] || []), f])} 
                                    onRemove={() => {}} 
                                />
                            </div>

                            {isReportTerm && (
                                <div className="pt-4 border-t border-slate-100">
                                    <MonitoringFileUpload 
                                        label={`Term ${term} Semester Report (Template/Draft)`} 
                                        file={doc.semesterReports?.[term]} 
                                        onUpload={(f) => handleDocChange(`semesterReports.${term}`, f)} 
                                        onRemove={() => handleDocChange(`semesterReports.${term}`, null)} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Group 2: Assessment & Achievement */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-emerald-500" /> Assessment & Achievement
                            </h4>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => csvInputRef.current?.click()}
                                    className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                    title="Import Marks CSV"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={handleAddTask}
                                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    title="Add New Task"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                            </div>
                        </div>

                        <div className="space-y-4 flex-1">
                            {termAssessments.map((task) => (
                                <div key={task.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                                    {/* Task Header */}
                                    <div 
                                        className="flex items-center justify-between p-3 bg-white border-b border-slate-100 cursor-pointer group"
                                        onClick={() => toggleTaskExpansion(task.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedTasks.has(task.id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                            <input 
                                                value={task.name}
                                                onClick={e => e.stopPropagation()}
                                                onChange={e => handleUpdateTask(task.id, { name: e.target.value })}
                                                className="font-bold text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-700"
                                            />
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                            className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Task Body */}
                                    {expandedTasks.has(task.id) && (
                                        <div className="p-4 space-y-6 animate-in slide-in-from-top-1 duration-200">
                                            {/* Files Row */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <TaskFileSlot 
                                                    label="Notification" 
                                                    file={task.files.notification} 
                                                    onUpload={f => handleUpdateTask(task.id, { files: { ...task.files, notification: f } })}
                                                    onRemove={() => handleUpdateTask(task.id, { files: { ...task.files, notification: undefined } })}
                                                />
                                                <TaskFileSlot 
                                                    label="Blank Task" 
                                                    file={task.files.blankTask} 
                                                    onUpload={f => handleUpdateTask(task.id, { files: { ...task.files, blankTask: f } })}
                                                    onRemove={() => handleUpdateTask(task.id, { files: { ...task.files, blankTask: undefined } })}
                                                />
                                                <TaskFileSlot 
                                                    label="Rubric" 
                                                    file={task.files.rubric} 
                                                    onUpload={f => handleUpdateTask(task.id, { files: { ...task.files, rubric: f } })}
                                                    onRemove={() => handleUpdateTask(task.id, { files: { ...task.files, rubric: undefined } })}
                                                />
                                            </div>

                                            {/* Samples Row */}
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Evidence Samples</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <TaskFileSlot 
                                                        label="High" 
                                                        variant="sample"
                                                        file={task.samples.high} 
                                                        onUpload={f => handleUpdateTask(task.id, { samples: { ...task.samples, high: f } })}
                                                        onRemove={() => handleUpdateTask(task.id, { samples: { ...task.samples, high: undefined } })}
                                                    />
                                                    <TaskFileSlot 
                                                        label="Middle" 
                                                        variant="sample"
                                                        file={task.samples.mid} 
                                                        onUpload={f => handleUpdateTask(task.id, { samples: { ...task.samples, mid: f } })}
                                                        onRemove={() => handleUpdateTask(task.id, { samples: { ...task.samples, mid: undefined } })}
                                                    />
                                                    <TaskFileSlot 
                                                        label="Low" 
                                                        variant="sample"
                                                        file={task.samples.low} 
                                                        onUpload={f => handleUpdateTask(task.id, { samples: { ...task.samples, low: f } })}
                                                        onRemove={() => handleUpdateTask(task.id, { samples: { ...task.samples, low: undefined } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {termAssessments.length === 0 && (
                                <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-100 rounded-xl">
                                    <p className="text-sm text-slate-400 font-medium">No tasks defined for this term.</p>
                                    <button onClick={handleAddTask} className="text-xs text-brand-600 font-bold hover:underline mt-1">Add Task 1</button>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <MonitoringFileUpload 
                                    label="Marks & Ranks Record" 
                                    file={doc.marksAndRanks?.[term] || null} 
                                    onUpload={(f) => handleDocChange(`marksAndRanks.${term}`, f)} 
                                    onRemove={() => handleDocChange(`marksAndRanks.${term}`, null)} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Group 3: Student Support & Communication */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-brand-500" /> Student Support & Communication
                        </h4>
                        <button 
                            onClick={() => setIsAddConcernModalOpen(true)}
                            className="text-xs font-bold px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all shadow-sm"
                        >
                            Add Concern Log
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Evidence</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Student(s) Flagged</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {doc.studentsCausingConcern?.[term]?.map(concern => (
                                    <tr key={concern.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <button onClick={() => storageService.triggerDownload(concern.file)} className="text-brand-600 font-bold hover:underline flex items-center gap-2">
                                                <FileText className="w-4 h-4" /> {concern.file.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                concern.category === 'N-Warning' ? 'bg-red-50 text-red-700 border-red-100' :
                                                concern.category === 'Malpractice' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                concern.category === 'Illness/Misadventure' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-slate-50 text-slate-700 border-slate-100'
                                            }`}>
                                                {concern.category || 'Other'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {concern.studentIds.map(sId => (
                                                    <span key={sId} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">
                                                        {students.find(s => s.id === sId)?.name || 'Unknown'}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => {
                                                    const updated = (doc.studentsCausingConcern?.[term] || []).filter(c => c.id !== concern.id);
                                                    handleDocChange(`studentsCausingConcern.${term}`, updated);
                                                }}
                                                className="text-slate-300 hover:text-red-500 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!doc.studentsCausingConcern?.[term] || doc.studentsCausingConcern?.[term].length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No communication logs for this term.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Group 4: Sign-off Section */}
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-8">
                    <div className="text-center max-w-2xl mx-auto">
                        <h4 className="text-xl font-bold text-slate-800 mb-2">Finalise & Register Term Evidence</h4>
                        <p className="text-slate-500 text-sm">
                            Verify that all required evidence for Term {term} has been uploaded and matched to syllabus outcomes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                        {/* Teacher Block */}
                        <div className="flex flex-col items-center p-6 border border-slate-100 rounded-2xl bg-slate-50/50">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Teacher Certification</h5>
                            {teacherSign?.date ? (
                                <div className="text-center animate-in zoom-in duration-500">
                                    {/* Fix: Narrow union type using 'in' operator to safely access signatureImage */}
                                    {teacherSign && 'signatureImage' in teacherSign && teacherSign.signatureImage ? (
                                        <img src={teacherSign.signatureImage} className="h-16 mx-auto mb-4 mix-blend-multiply" alt="Sig" />
                                    ) : (
                                        <p className="font-caveat text-4xl text-slate-800 mb-4">{teacherSign.teacherName}</p>
                                    )}
                                    <p className="text-sm font-bold text-slate-700">{teacherSign.teacherName}</p>
                                    <p className="text-xs text-emerald-600 font-bold mt-1 uppercase tracking-wide">Signed {new Date(teacherSign.date).toLocaleDateString()}</p>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => { setSignerRole('teacher'); setIsSignOffModalOpen(true); }}
                                    className="px-10 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-md transition-all hover:scale-105 active:scale-95"
                                >
                                    Teacher Sign-off
                                </button>
                            )}
                        </div>

                        {/* Head Teacher Block (Read-only for Teacher) */}
                        <div className="flex flex-col items-center p-6 border border-slate-100 rounded-2xl bg-slate-50/50">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Head Teacher Sign Off</h5>
                            {headSign?.date ? (
                                <div className="text-center animate-in zoom-in duration-500">
                                    {/* Fix: Narrow union type using 'in' operator to safely access signatureImage */}
                                    {headSign && 'signatureImage' in headSign && headSign.signatureImage ? (
                                        <img src={headSign.signatureImage} className="h-16 mx-auto mb-4 mix-blend-multiply" alt="HT Sig" />
                                    ) : (
                                        <p className="font-caveat text-4xl text-slate-800 mb-4">{headSign.teacherName}</p>
                                    )}
                                    <p className="text-sm font-bold text-slate-700">{headSign.teacherName}</p>
                                    <p className="text-xs text-indigo-600 font-bold mt-1 uppercase tracking-wide">Signed off(headSign.date).toLocaleDateString(){'}'}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <Clock className="w-10 h-10 text-slate-300 mb-2" />
                                    <p className="text-xs text-slate-500 font-medium">Pending Sign-off via Review Process</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header Bar */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg">
                        <Layout className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg leading-tight">{classGroup.name} Monitoring</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{classGroup.subject}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>Junior Compliance Dashboard</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { onSave(doc, true); setIsExportReviewModalOpen(true); }}
                        className="px-4 py-2 text-slate-700 font-bold text-sm flex items-center gap-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export Review
                    </button>
                    <button 
                        onClick={() => { onSave(doc); addToast("Monitoring dashboard saved.", "success"); }}
                        className="px-6 py-2 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Changes
                    </button>
                </div>
            </header>

            {/* Main Container */}
            <div className="flex-1 overflow-hidden grid grid-cols-12">
                
                {/* Sidebar Navigation */}
                <nav className="col-span-3 bg-white border-r border-slate-200 p-6 overflow-y-auto space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Class Lifecycle</h4>
                    
                    <NavCard 
                        active={activeView === 'annual'} 
                        onClick={() => setActiveView('annual')}
                        icon={ShieldCheck}
                        title="Annual Setup"
                        subtitle={getStatusSummary('annual')}
                        isAnnual
                    />

                    <div className="h-px bg-slate-100 my-4"></div>
                    
                    {(['1', '2', '3', '4'] as Term[]).map(t => (
                        <NavCard 
                            key={t}
                            active={activeView === t} 
                            onClick={() => setActiveView(t)}
                            icon={ClipboardCheck}
                            title={`Term ${t}`}
                            subtitle={getStatusSummary(t)}
                            isSigned={!!doc.teacherSignOff?.[t]?.date}
                        />
                    ))}

                    
                </nav>

                {/* Main Content Area */}
                <main className="col-span-9 bg-slate-50/50 p-10 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        {activeView === 'annual' ? renderAnnualView() : renderTermView(activeView)}
                    </div>
                </main>
            </div>

            {/* Universal Modals */}
            {isSignOffModalOpen && (
                <SignOffModal 
                    isOpen={isSignOffModalOpen}
                    onClose={() => setIsSignOffModalOpen(false)}
                    onConfirm={handleSignOff}
                    signerName={signerRole === 'teacher' ? (teacherProfile?.name || 'Teacher') : 'Head Teacher'}
                    existingSignOff={signerRole === 'teacher' ? (doc.teacherSignOff?.[activeView as Term] || null) : (doc.headTeacherSignOff?.[activeView as Term] || null)}
                />
            )}
            
            {isAddConcernModalOpen && (
                <AddConcernModal 
                    isOpen={isAddConcernModalOpen}
                    onClose={() => setIsAddConcernModalOpen(false)}
                    onSave={handleAddConcern}
                    students={students}
                />
            )}

            {isExportReviewModalOpen && (
                <ExportReviewModal
                    isOpen={isExportReviewModalOpen}
                    onClose={() => setIsExportReviewModalOpen(false)}
                    monitoringDoc={doc}
                    classGroup={classGroup}
                    students={students}
                />
            )}
        </div>
    );
};

// --- Subcomponents ---

const TaskFileSlot = ({ label, file, onUpload, onRemove, variant = 'standard' }: { label: string, file?: FileUpload, onUpload: (f: FileUpload) => void, onRemove: () => void, variant?: 'standard' | 'sample' }) => (
    <div className="flex flex-col gap-1">
        <span className={`text-[9px] font-bold uppercase text-center ${variant === 'sample' ? 'text-emerald-500' : 'text-slate-400'}`}>{label}</span>
        {file ? (
            <div className={`relative aspect-square flex flex-col items-center justify-center rounded-lg border p-1 shadow-sm group/slot bg-white ${variant === 'sample' ? 'border-emerald-200' : 'border-slate-200'}`}>
                <FileUp className={`w-5 h-5 mb-1 ${variant === 'sample' ? 'text-emerald-500' : 'text-indigo-400'}`} />
                <span className="text-[8px] font-bold truncate w-full text-center px-1 text-slate-600" title={file.name}>{file.name}</span>
                <div className="absolute inset-0 bg-slate-900/80 rounded-lg opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button onClick={() => storageService.triggerDownload(file)} className="p-1 text-white hover:text-indigo-400" title="Download"><Download className="w-3.5 h-3.5" /></button>
                    <button onClick={onRemove} className="p-1 text-white hover:text-red-400" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </div>
        ) : (
            <label className="aspect-square flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-300 hover:border-brand-400 hover:bg-white hover:text-brand-500 transition-all cursor-pointer">
                <Plus className="w-5 h-5" />
                <input 
                    type="file" 
                    className="hidden" 
                    onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.readAsDataURL(f);
                        reader.onload = async () => {
                            const id = `mon-${crypto.randomUUID()}`;
                            await storageService.saveFileContent(id, reader.result as string);
                            onUpload({ id, name: f.name });
                        };
                    }} 
                />
            </label>
        )}
    </div>
);

const NavCard = ({ active, onClick, icon: Icon, title, subtitle, isAnnual, isSigned }: any) => (
    <button 
        onClick={onClick}
        className={`
            w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group
            ${active 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'bg-white border-transparent hover:border-slate-200 text-slate-700'}
        `}
    >
        <div className={`
            p-3 rounded-xl transition-colors
            ${active ? 'bg-white/20' : isSigned ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}
        `}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 overflow-hidden">
            <h5 className={`font-bold text-sm ${active ? 'text-white' : 'text-slate-800'}`}>{title}</h5>
            <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${active ? 'text-indigo-200' : 'text-slate-400'}`}>
                {subtitle}
            </p>
        </div>
        {!active && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />}
    </button>
);
