import React, { useMemo, useState, useRef } from 'react';
import { Exam, Result, Question } from '@/types';
import { useAppStore } from '@/store';
import { getFlattedQuestions } from '../../utils/helpers';
import { Filter, Search, Table as TableIcon } from 'lucide-react';

interface ResultsEntryFormProps {
    exam: Exam;
}

export const ResultsEntryForm: React.FC<ResultsEntryFormProps> = ({ exam }) => {
    const { students, classes, results, addResult } = useAppStore();
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Matrix Refs for navigation: refs.current[`${sIdx}-${qIdx}`]
    const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const flatQuestions = useMemo(() => getFlattedQuestions(exam.questions), [exam]);

    const visibleStudents = useMemo(() => {
        let list = students;
        if (selectedClassId !== 'all') {
            const cls = classes.find(c => c.id === selectedClassId);
            if (cls) list = list.filter(s => cls.studentIds.includes(s.id));
            else list = [];
        }
        if (searchTerm) {
            list = list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [students, classes, selectedClassId, searchTerm]);

    const handleCellChange = (studentId: string, q: Question, value: string) => {
        const existing = results.find(r => r.studentId === studentId && r.examId === exam.id);
        const currentResult = existing || {
            id: crypto.randomUUID(),
            studentId,
            examId: exam.id,
            scoreTotal: 0,
            questionScores: {},
            questionResponses: {}
        };

        const isMCQ = q.type === 'MCQ';
        const newScores = { ...currentResult.questionScores };
        const newResponses = { ...currentResult.questionResponses };

        if (isMCQ) {
            const letter = value.toUpperCase().slice(0, 1); 
            // Allow only valid letters or empty
            if (!['A', 'B', 'C', 'D', ''].includes(letter)) return;
            
            if (letter === '') {
                delete newResponses[q.id];
                delete newScores[q.id];
            } else {
                newResponses[q.id] = letter;
                const isCorrect = q.correctAnswer && letter === q.correctAnswer;
                newScores[q.id] = isCorrect ? q.maxMarks : 0;
            }
        } else {
            if (value === '') {
                delete newScores[q.id];
                delete newResponses[q.id];
            } else {
                const num = parseFloat(value);
                if (!isNaN(num) && num >= 0 && num <= q.maxMarks) {
                    newScores[q.id] = num;
                    newResponses[q.id] = num.toString();
                } else {
                    return; // Reject invalid number
                }
            }
        }

        const newTotal = (Object.values(newScores) as number[]).reduce((a, b) => a + (b || 0), 0);
        
        addResult({
            ...currentResult,
            questionScores: newScores,
            questionResponses: newResponses,
            scoreTotal: newTotal
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent, sIdx: number, qIdx: number) => {
        // Navigation Logic
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
            e.preventDefault();
            let nextS = sIdx;
            let nextQ = qIdx;

            if (e.key === 'ArrowUp') nextS = Math.max(0, sIdx - 1);
            if (e.key === 'ArrowDown' || e.key === 'Enter') nextS = Math.min(visibleStudents.length - 1, sIdx + 1);
            if (e.key === 'ArrowLeft') nextQ = Math.max(0, qIdx - 1);
            if (e.key === 'ArrowRight') nextQ = Math.min(flatQuestions.length - 1, qIdx + 1);

            const nextRef = cellRefs.current[`${nextS}-${nextQ}`];
            if (nextRef) {
                nextRef.focus();
                nextRef.select();
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-4 p-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2 py-1.5 bg-slate-50">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select 
                        value={selectedClassId} 
                        onChange={e => setSelectedClassId(e.target.value)}
                        className="bg-transparent text-sm outline-none font-medium text-slate-700 min-w-[120px]"
                    >
                        <option value="all">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2 py-1.5 bg-slate-50 flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search student..."
                        className="bg-transparent text-sm outline-none w-full placeholder-slate-400"
                    />
                </div>
                <div className="ml-auto text-xs text-slate-400 flex items-center gap-2">
                    <TableIcon className="w-3 h-3" />
                    Auto-saving enabled
                </div>
            </div>

            {/* Spreadsheet */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                        <tr>
                            <th className="p-3 text-left font-bold text-slate-700 border-b border-r border-slate-200 sticky left-0 bg-slate-50 min-w-[220px] z-30">
                                Student
                            </th>
                            {flatQuestions.map(q => (
                                <th key={q.id} className="p-2 text-center font-semibold text-slate-600 border-b border-r border-slate-200 min-w-[70px]">
                                    <div className="flex flex-col items-center">
                                        <span className="text-slate-800">{q.fullLabel}</span>
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                            {q.type === 'MCQ' ? 'MCQ' : `Max ${q.maxMarks}`}
                                        </span>
                                    </div>
                                </th>
                            ))}
                            <th className="p-3 text-center font-bold text-slate-700 border-b border-slate-200 min-w-[80px] bg-slate-50">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visibleStudents.map((student, sIdx) => {
                            const result = results.find(r => r.studentId === student.id && r.examId === exam.id);
                            const scores = result?.questionScores || {};
                            const responses = result?.questionResponses || {};
                            const total = result?.scoreTotal || 0;

                            return (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-medium text-slate-800 border-r border-slate-100 sticky left-0 bg-white z-10 border-b border-slate-100">
                                        {student.name}
                                    </td>
                                    {flatQuestions.map((q, qIdx) => {
                                        const isMCQ = q.type === 'MCQ';
                                        // Use RESPONSE for MCQ, SCORE for others
                                        const displayValue = isMCQ 
                                            ? (responses[q.id] || '') 
                                            : (scores[q.id] !== undefined ? scores[q.id].toString() : '');
                                        
                                        const isCorrect = isMCQ && q.correctAnswer && displayValue === q.correctAnswer;
                                        const cellColor = isMCQ && displayValue ? (isCorrect ? 'bg-green-50 text-green-700 font-bold' : 'bg-red-50 text-red-700 font-bold') : '';

                                        return (
                                            <td key={q.id} className="p-0 border-r border-b border-slate-100">
                                                <input 
                                                    ref={el => { cellRefs.current[`${sIdx}-${qIdx}`] = el; }}
                                                    type="text" 
                                                    className={`w-full h-full p-2 text-center outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-text ${cellColor}`}
                                                    value={displayValue}
                                                    onChange={(e) => handleCellChange(student.id, q, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, sIdx, qIdx)}
                                                    onFocus={(e) => e.target.select()}
                                                    placeholder="-"
                                                />
                                            </td>
                                        );
                                    })}
                                    <td className="p-3 text-center font-bold text-slate-800 bg-slate-50 border-b border-slate-100">
                                        {total}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};