
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Edit, ChevronDown, CornerDownRight, Wand2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { Question, Exam } from '@/types';
import { 
    createQuestionObject, 
    calculateTotalMarks, 
    updateQuestionInTree, 
    deleteQuestionFromTree,
    addQuestionToParent,
    getNextNumber
} from '../../utils/helpers';
import { QuestionEditorModal } from './QuestionEditorModal';
import { ExamScaffoldModal } from './ExamScaffoldModal';
import { ConfirmDialog } from '@/shared/components/Dialogs';

interface ExamBuilderModalProps {
    onClose: () => void;
    examToEdit?: Exam;
}

export const ExamBuilderModal: React.FC<ExamBuilderModalProps> = ({ onClose, examToEdit }) => {
    const { addExam, updateExam } = useAppStore();
    
    const [examName, setExamName] = useState('');
    const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
    const [examCohort, setExamCohort] = useState<string>('12');
    const [selectedSyllabus, setSelectedSyllabus] = useState<string>('chemistry');
    const [questions, setQuestions] = useState<Question[]>([]);

    const [editorState, setEditorState] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        question: Question;
        parentId: string | null;
    } | null>(null);

    const [isScaffoldOpen, setIsScaffoldOpen] = useState(false);
    
    // Dialog State
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (examToEdit) {
            setExamName(examToEdit.name);
            setExamDate(examToEdit.date);
            setExamCohort(examToEdit.cohort || '12');
            setSelectedSyllabus(examToEdit.syllabusId || 'chemistry');
            setQuestions(examToEdit.questions || []);
        } else {
            setQuestions([createQuestionObject("1")]);
        }
    }, [examToEdit]);

    const totalMarks = calculateTotalMarks(questions);

    // --- Helpers for Smart Navigation ---
    const getAllQuestionsFlat = (qs: Question[]): Question[] => {
        let acc: Question[] = [];
        qs.forEach(q => {
            acc.push(q);
            if (q.subQuestions && q.subQuestions.length > 0) {
                acc = acc.concat(getAllQuestionsFlat(q.subQuestions));
            }
        });
        return acc;
    };

    const findParentId = (qs: Question[], childId: string): string | null => {
        for (const q of qs) {
            if (q.subQuestions?.some(sq => sq.id === childId)) return q.id;
            if (q.subQuestions) {
                const found = findParentId(q.subQuestions, childId);
                if (found) return found;
            }
        }
        return null;
    };

    const handleSaveExam = () => {
        if (!examName.trim()) {
            alert("Please enter an exam name.");
            return;
        }
        const examData: Exam = {
            id: examToEdit ? examToEdit.id : crypto.randomUUID(),
            name: examName,
            date: examDate,
            cohort: examCohort,
            totalMarks: totalMarks,
            questions: questions,
            syllabusId: selectedSyllabus,
            title: undefined,
            maxMarks: 0
        };
        if (examToEdit) updateExam(examToEdit.id, examData);
        else addExam(examData);
        onClose();
    };

    const handleAddTopLevel = () => {
        const lastQ = questions[questions.length - 1];
        const nextNum = lastQ ? getNextNumber(lastQ.number) : "1";
        setEditorState({
            isOpen: true,
            mode: 'create',
            question: createQuestionObject(nextNum),
            parentId: null
        });
    };

    const handleAddSubQuestion = (parent: Question) => {
        const lastChild = parent.subQuestions[parent.subQuestions.length - 1];
        let nextNum = "a";
        if (lastChild) nextNum = getNextNumber(lastChild.number);
        else if (parent.number === '1') nextNum = 'a';
        else if (/^[0-9]+$/.test(parent.number)) nextNum = 'a';
        else if (/^[a-z]$/.test(parent.number)) nextNum = 'i';

        setEditorState({
            isOpen: true,
            mode: 'create',
            question: createQuestionObject(nextNum),
            parentId: parent.id
        });
    };

    const handleDeleteQuestion = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setQuestionToDelete(id);
    };

    const performDelete = () => {
        if (questionToDelete) {
            setQuestions(prev => deleteQuestionFromTree(prev, questionToDelete));
            // If editing this question, close editor
            if (editorState?.question.id === questionToDelete) {
                setEditorState(null);
            }
            setQuestionToDelete(null);
        }
    };

    const handleEditorSave = (q: Question, action: 'close' | 'next') => {
        if (!editorState) return;

        // 1. Commit changes to tree
        let newQuestions = [...questions];
        if (editorState.mode === 'create') {
            if (editorState.parentId) {
                newQuestions = addQuestionToParent(newQuestions, editorState.parentId!, q);
            } else {
                newQuestions = [...newQuestions, q];
            }
        } else {
            newQuestions = updateQuestionInTree(newQuestions, q);
        }
        setQuestions(newQuestions);

        // 2. Handle Navigation
        if (action === 'next') {
            const flat = getAllQuestionsFlat(newQuestions);
            const currentIndex = flat.findIndex(fq => fq.id === q.id);
            
            if (currentIndex !== -1 && currentIndex < flat.length - 1) {
                // Scenario A: Next question exists -> Navigate to it
                const nextQ = flat[currentIndex + 1];
                setEditorState({
                    isOpen: true,
                    mode: 'edit',
                    question: nextQ,
                    parentId: null 
                });
            } else {
                // Scenario B: End of list -> Create new
                const nextNum = getNextNumber(q.number);
                
                // Determine context (sibling or root)
                // If we were creating/editing a question, we generally want to add a sibling
                let parentId = editorState.parentId;
                
                // If we were in edit mode, we need to find the parent of the current question
                if (!parentId && editorState.mode === 'edit') {
                    parentId = findParentId(newQuestions, q.id);
                }

                setEditorState({
                    isOpen: true,
                    mode: 'create',
                    question: createQuestionObject(nextNum),
                    parentId: parentId
                });
            }
        } else {
            setEditorState(null);
        }
    };

    const handleScaffoldBuild = (newQuestions: Question[]) => {
        setQuestions(prev => [...prev, ...newQuestions]);
    };

    // Recursive component defined inside to access handlers (closure)
    const RecursiveQuestionNode: React.FC<{ question: Question; level: number }> = ({ question, level }) => {
        const hasChildren = question.subQuestions && question.subQuestions.length > 0;
        const qTotal = calculateTotalMarks([question]);

        return (
            <div className="select-none">
                <div 
                    className={`
                        flex items-center gap-3 p-3 rounded-lg border transition-all group
                        ${level === 0 ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 border-l-4 border-l-brand-200 ml-6 mt-2'}
                        hover:border-brand-300
                    `}
                >
                    <div className="text-slate-400 w-4 flex justify-center">
                        {hasChildren && <ChevronDown className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 flex items-center gap-4">
                        <span className={`font-mono font-bold text-slate-700 ${level === 0 ? 'text-lg' : 'text-md'}`}>
                            {level === 0 ? 'Q' : ''}{question.number}
                        </span>
                        
                        {hasChildren ? (
                            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                {qTotal} marks (total)
                            </span>
                        ) : (
                             <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2 py-1 rounded">
                                {question.maxMarks} marks
                            </span>
                        )}

                        {question.type === 'MCQ' && (
                             <span className="text-[10px] font-bold uppercase text-brand-600 bg-brand-50 px-1 rounded border border-brand-100">
                                 MCQ {question.correctAnswer ? `(${question.correctAnswer})` : ''}
                             </span>
                        )}
                        {question.type === 'Extended' && (
                             <span className="text-[10px] font-bold uppercase text-purple-600 bg-purple-50 px-1 rounded border border-purple-100">
                                 Extended
                             </span>
                        )}
                        
                        {question.notes && (
                            <span className="text-sm text-slate-500 italic truncate max-w-[200px] hidden sm:block">{question.notes}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* MCQ Constraint: Do not allow adding sub-parts to MCQs */}
                        {question.type !== 'MCQ' && (
                            <button onClick={() => handleAddSubQuestion(question)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded" title="Add Sub-part">
                                <CornerDownRight className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => setEditorState({ isOpen: true, mode: 'edit', question, parentId: null })} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDeleteQuestion(e, question.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {hasChildren && (
                    <div className="border-l-2 border-slate-200 ml-4 pl-0">
                        {question.subQuestions.map(subQ => (
                            <RecursiveQuestionNode key={subQ.id} question={subQ} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{examToEdit ? 'Edit Exam' : 'New Assessment'}</h3>
                        <p className="text-xs text-slate-500">Deep structure builder</p>
                    </div>
                    <div className="flex items-center gap-4">
                         <button onClick={() => setIsScaffoldOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-200">
                            <Wand2 className="w-3 h-3" /> Wizard
                        </button>

                        <div className="text-right pl-4 border-l border-slate-200">
                             <span className="block text-xs font-bold text-slate-400 uppercase">Total Marks</span>
                             <span className="block text-lg font-bold text-brand-600">{totalMarks}</span>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="p-4 border-b border-slate-200 grid grid-cols-4 gap-4 bg-white shrink-0">
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Exam Name</label>
                        <input 
                            type="text" 
                            value={examName} 
                            onChange={e => setExamName(e.target.value)} 
                            className="w-full border-b border-slate-300 focus:border-brand-500 outline-none py-1 font-medium" 
                            placeholder="e.g. Year 11 Chemistry Yearly"
                        />
                    </div>
                    <div className="col-span-1">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                         <input 
                            type="date" 
                            value={examDate} 
                            onChange={e => setExamDate(e.target.value)} 
                            className="w-full border-b border-slate-300 focus:border-brand-500 outline-none py-1 font-medium" 
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cohort</label>
                        <select 
                            value={examCohort} 
                            onChange={e => setExamCohort(e.target.value)}
                            className="w-full border-b border-slate-300 focus:border-brand-500 outline-none py-1 font-medium bg-transparent"
                        >
                            <option value="7">Year 7</option>
                            <option value="8">Year 8</option>
                            <option value="9">Year 9</option>
                            <option value="10">Year 10</option>
                            <option value="11">Year 11</option>
                            <option value="12">Year 12</option>
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Syllabus</label>
                        <select 
                            value={selectedSyllabus} 
                            onChange={e => setSelectedSyllabus(e.target.value)}
                            className="w-full border-b border-slate-300 focus:border-brand-500 outline-none py-1 font-medium bg-transparent"
                        >
                            <option value="chemistry">Chemistry</option>
                            <option value="physics">Physics</option>
                            <option value="biology">Biology</option>
                            <option value="investigating">Investigating Science</option>
                            <option value="ees">Earth & Env Science</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {questions.length === 0 && (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                <p>No questions yet.</p>
                                <div className="flex gap-4 justify-center mt-4">
                                    <button onClick={handleAddTopLevel} className="text-brand-600 font-bold hover:underline">Start with Q1</button>
                                    <span className="text-slate-300">|</span>
                                    <button onClick={() => setIsScaffoldOpen(true)} className="text-indigo-600 font-bold hover:underline flex items-center gap-1">
                                        <Wand2 className="w-3 h-3" /> Use Wizard
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {questions.map((q) => (
                            <RecursiveQuestionNode key={q.id} question={q} level={0} />
                        ))}

                        {questions.length > 0 && (
                             <button 
                                onClick={handleAddTopLevel}
                                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                                <Plus className="w-5 h-5" /> Add Next Question
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                    <button onClick={handleSaveExam} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm text-sm font-bold flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Assessment
                    </button>
                </div>
            </div>

            {editorState && (
                <QuestionEditorModal
                    isOpen={editorState.isOpen}
                    onClose={() => setEditorState(null)}
                    question={editorState.question}
                    mode={editorState.mode}
                    syllabusId={selectedSyllabus}
                    onSave={handleEditorSave}
                    onDelete={(id) => handleDeleteQuestion({ stopPropagation: () => {} } as any, id)}
                />
            )}

            {isScaffoldOpen && (
                <ExamScaffoldModal 
                    isOpen={isScaffoldOpen}
                    onClose={() => setIsScaffoldOpen(false)}
                    onBuild={handleScaffoldBuild}
                />
            )}

            <ConfirmDialog 
                isOpen={!!questionToDelete}
                title="Delete Question"
                message="Are you sure you want to delete this question and all its sub-parts? This action cannot be undone."
                onConfirm={performDelete}
                onCancel={() => setQuestionToDelete(null)}
                confirmLabel="Delete"
                isDanger={true}
            />
        </div>
    );
};
