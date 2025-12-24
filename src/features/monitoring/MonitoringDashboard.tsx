import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { JuniorMonitoringView } from './JuniorMonitoringView';
import { MonitoringDoc } from '@/types';
import { ClipboardList, ArrowLeft, Users } from 'lucide-react';

const BLANK_MONITORING_DOC_SKELETON: Omit<MonitoringDoc, 'id' | 'classId'> = {
    year: new Date().getFullYear(),
    certifySyllabus: false,
    scopeAndSequence: null,
    teachingPrograms: { '1': [], '2': [], '3': [], '4': [] },
    semesterReports: { '1': null, '2': null, '3': null, '4': null },
    assessmentSchedule: null,
    assessmentTask1: [],
    assessmentTask2: [],
    assessmentTask3: [],
    prePostDiagnostic: [],
    marksAndRanks: { '1': null, '2': null, '3': null, '4': null },
    scannedWorkSamples: {
        task1: { top: null, middle: null, low: null },
        task2: { top: null, middle: null, low: null },
        task3: { top: null, middle: null, low: null },
    },
    specificLearningNeeds: { '1': false, '2': false, '3': false, '4': false },
    studentsCausingConcern: { '1': [], '2': [], '3': [], '4': [] },
    illnessMisadventure: { '1': [], '2': [], '3': [], '4': [] },
    malpractice: { '1': [], '2': [], '3': [], '4': [] },
    teacherSignOff: {
        '1': { teacherName: '', date: null },
        '2': { teacherName: '', date: null },
        '3': { teacherName: '', date: null },
        '4': { teacherName: '', date: null }
    },
    headTeacherSignOff: {
        '1': { teacherName: '', date: null },
        '2': { teacherName: '', date: null },
        '3': { teacherName: '', date: null },
        '4': { teacherName: '', date: null }
    },
    behaviorNotes: '',
    academicNotes: ''
};

export const MonitoringDashboard: React.FC = () => {
    const { classes, monitoringDocs, addMonitoringDoc, updateMonitoringDoc, students } = useAppStore();
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    // Get active class data
    const selectedClass = classes.find(c => c.id === selectedClassId);
    
    // Get students for selected class
    const classStudents = useMemo(() => {
        if (!selectedClass) return [];
        return students.filter(s => selectedClass.studentIds.includes(s.id));
    }, [selectedClass, students]);

    // Handle Selecting a Class (Load or Create Doc)
    const activeDoc = useMemo(() => {
        if (!selectedClassId) return null;
        
        const existing = monitoringDocs.find(d => d.classId === selectedClassId);
        if (existing) return existing;

        // Return a temporary new doc (not saved until user saves)
        const newDoc: MonitoringDoc = {
            id: crypto.randomUUID(),
            classId: selectedClassId,
            ...BLANK_MONITORING_DOC_SKELETON
        };
        return newDoc;
    }, [selectedClassId, monitoringDocs]);

    const handleSave = (doc: MonitoringDoc) => {
        const exists = monitoringDocs.some(d => d.id === doc.id);
        if (exists) {
            updateMonitoringDoc(doc.id, doc);
        } else {
            addMonitoringDoc(doc);
        }
        alert('Monitoring document saved.');
    };

    if (selectedClass && activeDoc) {
        return (
            <div className="h-full flex flex-col">
                <button 
                    onClick={() => setSelectedClassId(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium w-fit mb-4"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <div className="flex-1 overflow-auto">
                    <JuniorMonitoringView 
                        monitoringDoc={activeDoc}
                        classGroup={selectedClass}
                        students={classStudents}
                        onSave={handleSave}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Junior Monitoring</h2>
                <p className="text-slate-500">Select a class to manage compliance documentation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => {
                    const hasDoc = monitoringDocs.some(d => d.classId === cls.id);
                    return (
                        <div 
                            key={cls.id}
                            onClick={() => setSelectedClassId(cls.id)}
                            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                {hasDoc && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                        Active
                                    </span>
                                )}
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-brand-600 mb-1">{cls.name}</h3>
                            <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">{cls.subject}</p>
                            
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-slate-400 text-sm">
                                <Users className="w-4 h-4 mr-2" />
                                {cls.studentIds.length} Students
                            </div>
                        </div>
                    );
                })}

                {classes.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
                        <p>No classes found.</p>
                        <p className="text-xs">Create classes in the settings or class manager first.</p>
                    </div>
                )}
            </div>
        </div>
    );
};