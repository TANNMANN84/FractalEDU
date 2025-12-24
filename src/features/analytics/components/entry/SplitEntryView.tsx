import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Exam, Result } from '@/types';
import { SingleStudentEntry } from './SingleStudentEntry';
import { Search, Filter, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

interface SplitEntryViewProps {
    exam: Exam;
}

export const SplitEntryView: React.FC<SplitEntryViewProps> = ({ exam }) => {
    const { students, classes, results, addResult } = useAppStore();
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const examCohort = useMemo(() => (exam as any).cohort || (exam as any).yearLevel || (exam as any).yearGroup, [exam]);

    const availableClasses = useMemo(() => {
        if (!examCohort) return classes;
        const examCohortNum = examCohort.toString().replace(/\D/g, '');
        if (!examCohortNum) return classes;

        return classes.filter(c => {
            const cYear = (c as any).yearGroup || (c as any).year;
            if (cYear) {
                const cYearNum = cYear.toString().replace(/\D/g, '');
                if (cYearNum === examCohortNum) return true;
            }
            
            const match = c.name.match(/^(\d+)/);
            if (match && match[1] === examCohortNum) {
                return true;
            }

            return false;
        });
    }, [classes, examCohort]);

    // Derived Lists
    const visibleStudents = useMemo(() => {
        let list = students;
        if (examCohort) {
            const examCohortNum = examCohort.toString().replace(/\D/g, '');
            if (examCohortNum) {
                list = list.filter(s => {
                    if (!s.cohort) return false;
                    const studentCohortNum = s.cohort.toString().replace(/\D/g, '');
                    return studentCohortNum === examCohortNum;
                });
            }
        }
        if (selectedClassId !== 'all') {
            const cls = classes.find(c => c.id === selectedClassId);
            if (cls) list = list.filter(s => cls.studentIds.includes(s.id));
            else list = [];
        }
        if (searchTerm) {
            list = list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [students, classes, selectedClassId, searchTerm, examCohort]);

    // Auto-select first
    useEffect(() => {
        if (visibleStudents.length > 0 && !selectedStudentId) {
            setSelectedStudentId(visibleStudents[0].id);
        }
    }, [visibleStudents]); // Only run if list changes significantly

    const currentStudent = students.find(s => s.id === selectedStudentId);
    const currentResult = results.find(r => r.studentId === selectedStudentId && r.examId === exam.id);

    const handleUpdateResult = (updatedResult: Result) => {
        addResult(updatedResult);
    };

    // Calculate progress for sidebar
    const getProgress = (studentId: string) => {
        const res = results.find(r => r.studentId === studentId && r.examId === exam.id);
        if (!res) return 0;
        return Object.keys(res.questionScores).length;
    };

    // Helper to calc total questions (leaf nodes)
    const totalQuestions = useMemo(() => {
        // Simple recursive count or use helpers if needed, but for progress bar:
        const countLeaves = (qs: any[]): number => qs.reduce((acc, q) => acc + (q.subQuestions?.length > 0 ? countLeaves(q.subQuestions) : 1), 0);
        return countLeaves(exam.questions);
    }, [exam]);

    return (
        <div className="flex h-full border-t border-slate-200">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
                {/* Filters */}
                <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                        >
                            <option value="all">All Classes</option>
                            {availableClasses.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {visibleStudents.map(student => {
                        const progress = getProgress(student.id);
                        const isComplete = progress > 0 && progress === totalQuestions;
                        const isSelected = selectedStudentId === student.id;

                        return (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudentId(student.id)}
                                className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex justify-between items-center ${
                                    isSelected ? 'bg-brand-50 border-l-4 border-l-brand-600' : 'border-l-4 border-l-transparent'
                                }`}
                            >
                                <div>
                                    <div className={`font-medium ${isSelected ? 'text-brand-900' : 'text-slate-700'}`}>
                                        {student.name}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        {isComplete ? (
                                            <span className="text-green-600 font-bold flex items-center">
                                                <CheckCircle2 className="w-3 h-3 mr-1"/> Complete
                                            </span>
                                        ) : (
                                            <span className="flex items-center">
                                                <Circle className="w-3 h-3 mr-1 fill-slate-200 text-slate-300" /> 
                                                {progress} / {totalQuestions}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isSelected && <ChevronRight className="w-4 h-4 text-brand-500" />}
                            </button>
                        );
                    })}
                    {visibleStudents.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">No students found.</div>
                    )}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
                {currentStudent ? (
                    <SingleStudentEntry 
                        exam={exam}
                        student={currentStudent}
                        result={currentResult}
                        onUpdate={handleUpdateResult}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Select a student to begin entry.
                    </div>
                )}
            </div>
        </div>
    );
};