
import React, { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { Plus, BarChart2, Edit3, ArrowLeft, Settings, Upload, Share2, Trash2 } from 'lucide-react';
import { ExamBuilderModal } from './components/builder/ExamBuilderModal';
import { DataEntryView } from './components/entry/DataEntryView';
import { AnalysisView } from './components/dashboard/AnalysisView';
import { SharedAnalysisViewer } from './components/dashboard/SharedAnalysisViewer';
import { ConfirmDialog } from '@/shared/components/Dialogs';
import { Exam, Student, Result } from '@/types';
import { parseLegacyData } from './utils/legacyAdapter';

type ViewMode = 'list' | 'dashboard' | 'entry';

export const Analytics: React.FC = () => {
    const { exams, addExam, deleteExam } = useAppStore();
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [examToEdit, setExamToEdit] = useState<Exam | undefined>(undefined);
    
    // Shared Analysis State
    const [sharedData, setSharedData] = useState<{ exam: Exam, students: Student[], results: Result[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dialog State
    const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);

    const selectedExam = exams.find(e => e.id === selectedExamId);

    const handleOpenExam = (examId: string, mode: 'dashboard' | 'entry') => {
        setSelectedExamId(examId);
        setViewMode(mode);
    };

    const handleEditExam = (exam: Exam) => {
        setExamToEdit(exam);
        setIsBuilderOpen(true);
    };

    const handleShareExam = (exam: Exam) => {
        const exportData = {
            ...exam,
            mode: 'template',
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exam.name.replace(/[^a-z0-9]/gi, '_')}_template.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const performDelete = () => {
        if (deleteTarget) {
            deleteExam(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    const handleCloseBuilder = () => {
        setIsBuilderOpen(false);
        setExamToEdit(undefined);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const { exam, students, results, mode } = parseLegacyData(json);

                if (mode === 'template') {
                    // Check for duplicate ID to prevent collisions
                    if (exams.some(ex => ex.id === exam.id)) {
                        // Auto-rename for import to avoid blocking interaction
                        exam.id = crypto.randomUUID();
                        exam.name = `${exam.name} (Imported)`;
                    }
                    addExam(exam);
                    alert(`Successfully imported assessment template: ${exam.name}`);
                } else {
                    // Analysis Mode
                    setSharedData({ exam, students, results });
                }
            } catch (err) {
                console.error(err);
                alert("Failed to parse file. Ensure it is a valid Fractal EDU export.");
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    if (sharedData) {
        return <SharedAnalysisViewer data={sharedData} onClose={() => setSharedData(null)} />;
    }

    if (viewMode !== 'list' && selectedExam) {
        return (
            <div className="space-y-4 h-full flex flex-col">
                <button 
                    onClick={() => setViewMode('list')} 
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium w-fit"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Exam List
                </button>
                <div className="flex-1 min-h-0">
                    {viewMode === 'dashboard' ? (
                        <AnalysisView exam={selectedExam} />
                    ) : (
                        <DataEntryView exam={selectedExam} />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Academic Analytics</h2>
                    <p className="text-slate-500">Manage assessments, enter data, and view reports.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium"
                    >
                        <Upload className="w-4 h-4" /> Import / View
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".json" 
                        onChange={handleFileUpload} 
                    />
                    <button 
                        onClick={() => setIsBuilderOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New Assessment
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map(exam => (
                    <div key={exam.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{exam.name}</h3>
                                <p className="text-sm text-slate-500">{new Date(exam.date).toLocaleDateString()}</p>
                            </div>
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                                {exam.totalMarks} Marks
                            </span>
                        </div>
                        
                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                            <button 
                                onClick={() => handleOpenExam(exam.id, 'entry')}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                            >
                                <Edit3 className="w-4 h-4" /> Data Entry
                            </button>
                            <button 
                                onClick={() => handleOpenExam(exam.id, 'dashboard')}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-50 text-brand-700 border border-brand-100 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium"
                            >
                                <BarChart2 className="w-4 h-4" /> Analysis
                            </button>
                            
                            <div className="w-px bg-slate-200 mx-1"></div>

                            <button 
                                onClick={() => handleShareExam(exam)}
                                className="px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                title="Share Template"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                             <button 
                                onClick={() => handleEditExam(exam)}
                                className="px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                title="Edit Structure"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setDeleteTarget(exam)}
                                className="px-3 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Delete Exam"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {exams.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <BarChart2 className="w-12 h-12 mb-3 opacity-20" />
                        <p>No assessments found.</p>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setIsBuilderOpen(true)} className="text-brand-600 hover:underline">Create New</button>
                            <span>or</span>
                            <button onClick={() => fileInputRef.current?.click()} className="text-brand-600 hover:underline">Import File</button>
                        </div>
                    </div>
                )}
            </div>

            {isBuilderOpen && (
                <ExamBuilderModal 
                    onClose={handleCloseBuilder} 
                    examToEdit={examToEdit}
                />
            )}

            <ConfirmDialog 
                isOpen={!!deleteTarget}
                title="Delete Assessment"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                onConfirm={performDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};
