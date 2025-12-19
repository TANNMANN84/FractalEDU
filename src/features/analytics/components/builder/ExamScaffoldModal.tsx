import React, { useState } from 'react';
import { X, Plus, Trash2, Wand2, Layers, HelpCircle } from 'lucide-react';
import { Question } from '@/types';
import { createQuestionObject, toRomanNumeral } from '../../utils/helpers';

interface ExamScaffoldModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuild: (questions: Question[]) => void;
}

interface Section {
    id: string;
    name: string;
    type: 'mc' | 'long';
    count?: number;
    marks?: number;
    questions?: { id: string; subParts: string }[];
}

export const ExamScaffoldModal: React.FC<ExamScaffoldModalProps> = ({ isOpen, onClose, onBuild }) => {
    const [sections, setSections] = useState<Section[]>([
        { id: '1', name: 'Section I', type: 'mc', count: 20, marks: 1, questions: [] }
    ]);

    const updateSection = (id: string, updates: Partial<Section>) => {
        setSections(prev => prev.map(s => {
            if (s.id !== id) return s;
            const updated = { ...s, ...updates };
            if (updates.type) {
                if (updates.type === 'mc') {
                    updated.questions = [];
                    updated.count = 20;
                    updated.marks = 1;
                } else {
                    updated.questions = [{ id: crypto.randomUUID(), subParts: '' }];
                    updated.count = undefined;
                    updated.marks = undefined;
                }
            }
            return updated;
        }));
    };

    const addSection = () => {
        setSections(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                name: `Section ${toRomanNumeral(prev.length + 1).toUpperCase()}`,
                type: 'long',
                questions: [{ id: crypto.randomUUID(), subParts: '' }]
            }
        ]);
    };

    const removeSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
    };

    const addLongQuestion = (sectionId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: [...(s.questions || []), { id: crypto.randomUUID(), subParts: '' }]
            };
        }));
    };

    const removeLongQuestion = (sectionId: string, questionId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions?.filter(q => q.id !== questionId)
            };
        }));
    };

    const updateLongQuestion = (sectionId: string, questionId: string, val: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions?.map(q => q.id === questionId ? { ...q, subParts: val } : q)
            };
        }));
    };

    const handleBuild = () => {
        let newQuestions: Question[] = [];
        let questionCounter = 1;

        const parseSubparts = (str: string): Question[] => {
            if (!str || !str.trim()) return [];
            return str.split(',').map(s => s.trim()).filter(Boolean).map(partStr => {
                const subMatch = partStr.match(/(.+)\((.*)\)/);
                if (subMatch) {
                    const number = subMatch[1].trim();
                    const subStr = subMatch[2];
                    const question = createQuestionObject(number);
                    question.subQuestions = subStr.split(';').map(s => s.trim()).filter(Boolean).map(subLabel => createQuestionObject(subLabel));
                    return question;
                } else {
                    return createQuestionObject(partStr);
                }
            });
        };

        sections.forEach(section => {
            if (section.type === 'mc') {
                for (let i = 0; i < (section.count || 0); i++) {
                    const q = createQuestionObject(questionCounter.toString());
                    q.maxMarks = section.marks || 1;
                    q.type = 'MCQ'; // Updated type
                    q.notes = section.name;
                    newQuestions.push(q);
                    questionCounter++;
                }
            } else {
                section.questions?.forEach(scaffoldQ => {
                    const q = createQuestionObject(questionCounter.toString());
                    q.notes = section.name;
                    // The string defines sub-parts e.g. "a, b" -> 1a, 1b
                    q.subQuestions = parseSubparts(scaffoldQ.subParts);
                    newQuestions.push(q);
                    questionCounter++;
                });
            }
        });

        onBuild(newQuestions);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                             <Wand2 className="w-5 h-5 text-brand-600" /> Exam Wizard
                        </h3>
                        <p className="text-xs text-slate-500">Quickly generate exam structure</p>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    {sections.map((section, idx) => (
                        <div key={section.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group">
                            {/* Section Header */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Section Name</label>
                                    <input 
                                        value={section.name} 
                                        onChange={e => updateSection(section.id, { name: e.target.value })}
                                        className="w-full font-bold text-slate-700 border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none"
                                    />
                                </div>
                                <div>
                                     <label className="text-xs font-bold text-slate-400 uppercase">Type</label>
                                     <select 
                                        value={section.type}
                                        onChange={e => updateSection(section.id, { type: e.target.value as any })}
                                        className="block w-32 text-sm border-slate-200 rounded-md shadow-sm p-1"
                                     >
                                         <option value="mc">Multiple Choice</option>
                                         <option value="long">Extended Response</option>
                                     </select>
                                </div>
                                <button onClick={() => removeSection(section.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Section Body */}
                            {section.type === 'mc' ? (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Number of Questions</label>
                                        <input type="number" value={section.count} onChange={e => updateSection(section.id, { count: parseInt(e.target.value) })} className="w-full p-2 rounded border border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Marks Per Question</label>
                                        <input type="number" value={section.marks} onChange={e => updateSection(section.id, { marks: parseFloat(e.target.value) })} className="w-full p-2 rounded border border-slate-200" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase px-1">
                                        <span>Question Sub-parts Pattern</span>
                                        <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" /> e.g. "a, b(i;ii)"</span>
                                    </div>
                                    {section.questions?.map((q, qIdx) => (
                                        <div key={q.id} className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-slate-400 w-8">Q{qIdx + 1}</span>
                                            <input 
                                                type="text" 
                                                value={q.subParts} 
                                                onChange={e => updateLongQuestion(section.id, q.id, e.target.value)}
                                                placeholder="e.g. a, b(i;ii), c"
                                                className="flex-1 p-2 rounded border border-slate-200 text-sm font-mono"
                                            />
                                            <button onClick={() => removeLongQuestion(section.id, q.id)} className="text-slate-300 hover:text-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => addLongQuestion(section.id)} className="w-full py-2 border border-dashed border-slate-300 text-slate-500 rounded hover:bg-slate-50 text-sm font-medium">
                                        + Add Question Row
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    <button onClick={addSection} className="w-full py-4 bg-white border border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-brand-600 hover:border-brand-400 hover:bg-brand-50 flex items-center justify-center gap-2 font-medium transition-all">
                        <Plus className="w-5 h-5" /> Add New Section
                    </button>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                    <button onClick={handleBuild} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm text-sm font-bold flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Generate Questions
                    </button>
                </div>
            </div>
        </div>
    );
};