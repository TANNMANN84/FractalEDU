
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Exam, Student, Result, Question } from '@/types';
import { getFlattedQuestions } from '../../utils/helpers';
import { Check, CornerDownRight, Keyboard } from 'lucide-react';

interface SingleStudentEntryProps {
    exam: Exam;
    student: Student;
    result: Result | undefined;
    onUpdate: (result: Result) => void;
}

export const SingleStudentEntry: React.FC<SingleStudentEntryProps> = ({ 
    exam, 
    student, 
    result, 
    onUpdate 
}) => {
    const flatQuestions = useMemo(() => getFlattedQuestions(exam.questions), [exam]);
    // Use first question ID as default active
    const [activeQuestionId, setActiveQuestionId] = useState(flatQuestions[0]?.id || '');
    
    // Refs for scrolling and focus
    const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const currentResult: Result = result || {
        id: crypto.randomUUID(),
        studentId: student.id,
        examId: exam.id,
        scoreTotal: 0,
        questionScores: {},
        questionResponses: {}
    };

    // Calculate active index for navigation
    const activeIndex = flatQuestions.findIndex(q => q.id === activeQuestionId);

    // --- Actions ---

    const handleUpdate = (q: Question, score: number, response?: string) => {
        const newScores = { ...currentResult.questionScores, [q.id]: score };
        const newResponses = { ...currentResult.questionResponses };
        if (response !== undefined) newResponses[q.id] = response;

        const newTotal = (Object.values(newScores) as number[]).reduce((a, b) => a + (b || 0), 0);

        onUpdate({
            ...currentResult,
            questionScores: newScores,
            questionResponses: newResponses,
            scoreTotal: newTotal
        });
    };

    const nextQuestion = () => {
        if (activeIndex < flatQuestions.length - 1) {
            setActiveQuestionId(flatQuestions[activeIndex + 1].id);
        }
    };

    const prevQuestion = () => {
        if (activeIndex > 0) {
            setActiveQuestionId(flatQuestions[activeIndex - 1].id);
        }
    };

    // --- Effects ---

    // 1. Scroll & Focus when Active Question changes
    useEffect(() => {
        if (activeQuestionId && rowRefs.current[activeQuestionId]) {
            rowRefs.current[activeQuestionId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Focus input if valid and not MCQ (MCQ handled by global listener)
        const q = flatQuestions.find(fq => fq.id === activeQuestionId);
        if (q && q.type !== 'MCQ') {
            // Small timeout to allow render
            setTimeout(() => {
                const input = inputRefs.current[activeQuestionId];
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        }
    }, [activeQuestionId, flatQuestions]);

    // 2. Global Keyboard Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeQ = flatQuestions[activeIndex];
            if (!activeQ) return;

            const isMCQ = activeQ.type === 'MCQ';
            const isInputFocused = document.activeElement instanceof HTMLInputElement;

            // Nav keys (Prevent default if we are navigating rows)
            if (e.key === 'ArrowDown' || (e.key === 'Enter' && !isInputFocused)) {
                e.preventDefault();
                nextQuestion();
                return;
            }
            if (e.key === 'Enter' && isInputFocused) {
                // If in input, Enter commits (blur triggers change usually) and moves next
                e.preventDefault();
                nextQuestion();
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                prevQuestion();
                return;
            }

            // Data Entry (MCQ only - global listener)
            if (isMCQ && !isInputFocused) {
                const key = e.key.toUpperCase();
                if (['A', 'B', 'C', 'D'].includes(key)) {
                    e.preventDefault();
                    const isCorrect = activeQ.correctAnswer && key === activeQ.correctAnswer;
                    handleUpdate(activeQ, isCorrect ? activeQ.maxMarks : 0, key);
                    // Short delay for visual feedback before moving
                    setTimeout(nextQuestion, 150);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, flatQuestions, currentResult]); // deps crucial

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-6 shrink-0 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
                    <p className="text-slate-500 text-sm flex items-center gap-2">
                        {student.cohort} <span className="text-slate-300">•</span> {exam.name}
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs border border-slate-200 ml-2 flex items-center gap-1">
                            <Keyboard className="w-3 h-3" /> Keyboard Enabled
                        </span>
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold uppercase text-slate-400 mb-1">Current Score</div>
                    <div className="text-3xl font-bold text-brand-600">
                        {currentResult.scoreTotal} <span className="text-slate-300 text-xl font-normal">/ {exam.totalMarks}</span>
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-3">
                <div className="max-w-3xl mx-auto space-y-3 pb-40">
                    {flatQuestions.map((q) => {
                        const isActive = q.id === activeQuestionId;
                        const isMCQ = q.type === 'MCQ';
                        const currentResponse = currentResult.questionResponses[q.id];
                        const currentScore = currentResult.questionScores[q.id];
                        const isSaved = currentResponse !== undefined || currentScore !== undefined;

                        return (
                            <div 
                                key={q.id}
                                ref={el => { rowRefs.current[q.id] = el; }}
                                onClick={() => setActiveQuestionId(q.id)}
                                className={`
                                    relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-4
                                    ${isActive 
                                        ? 'bg-white border-brand-500 ring-2 ring-brand-200 shadow-md scale-[1.01]' 
                                        : 'bg-white border-slate-200 hover:border-brand-200'}
                                    ${!isActive && isSaved ? 'bg-slate-50/50' : ''}
                                `}
                            >
                                {/* Number Badge */}
                                <div className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border
                                    ${isActive ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-100 text-slate-500 border-slate-200'}
                                `}>
                                    {q.fullLabel}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className={`text-sm font-medium ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                                            {q.notes || <span className="italic text-slate-400">Question {q.fullLabel}</span>}
                                        </p>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 whitespace-nowrap ml-2">
                                            /{q.maxMarks}
                                        </span>
                                    </div>
                                    
                                    <div className="mt-2 h-10 flex items-center">
                                        {isMCQ ? (
                                            <div className="flex gap-2">
                                                {['A', 'B', 'C', 'D'].map(opt => {
                                                    const isSelected = currentResponse === opt;
                                                    return (
                                                        <button
                                                            key={opt}
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                const isCorrect = q.correctAnswer && q.correctAnswer === opt;
                                                                handleUpdate(q, isCorrect ? q.maxMarks : 0, opt); 
                                                                nextQuestion(); 
                                                            }}
                                                            className={`
                                                                w-10 h-10 rounded-lg font-bold text-sm border-2 transition-all
                                                                ${isSelected 
                                                                    ? 'bg-brand-600 border-brand-600 text-white shadow-sm' 
                                                                    : isActive ? 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-white border-slate-100 text-slate-400'}
                                                            `}
                                                        >
                                                            {opt}
                                                        </button>
                                                    );
                                                })}
                                                {isActive && <span className="ml-2 text-xs text-slate-400 self-center animate-pulse">Type A/B/C/D</span>}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <input
                                                    ref={el => { inputRefs.current[q.id] = el; }}
                                                    type="number"
                                                    min="0"
                                                    max={q.maxMarks}
                                                    value={currentScore ?? ''}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val) && val >= 0 && val <= q.maxMarks) {
                                                            handleUpdate(q, val, val.toString());
                                                        } else if (e.target.value === '') {
                                                            // Handle clear
                                                            const newScores = { ...currentResult.questionScores };
                                                            delete newScores[q.id];
                                                            const newTotal = Object.values(newScores).reduce((a, b) => a + (b || 0), 0);
                                                            const newResponses = { ...currentResult.questionResponses };
                                                            delete newResponses[q.id];
                                                            onUpdate({ ...currentResult, questionScores: newScores, questionResponses: newResponses, scoreTotal: newTotal });
                                                        }
                                                    }}
                                                    className={`
                                                        w-24 p-2 text-lg font-bold text-center border-2 rounded-lg outline-none transition-all
                                                        ${isActive ? 'border-brand-500 focus:ring-4 focus:ring-brand-100' : 'border-slate-200 bg-slate-50'}
                                                    `}
                                                    placeholder="-"
                                                />
                                                {isActive && <span className="text-xs text-slate-400 flex items-center gap-1"><CornerDownRight className="w-3 h-3" /> Enter</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Icon */}
                                <div className="w-8 flex justify-center">
                                    {isSaved && !isActive && <Check className="w-5 h-5 text-green-500" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};