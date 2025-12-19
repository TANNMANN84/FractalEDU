import React, { useState, useEffect } from 'react';
import { X, Save, ArrowRight, AlertCircle, Trash2 } from 'lucide-react';
import { Question } from '@/types';
import { syllabusData, cognitiveVerbs, wsOutcomes } from '../../data/syllabusData';
import { TagInput } from '@/shared/components/TagInput';

interface QuestionEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    
    question: Question; // The question object to edit (or the new template)
    mode: 'create' | 'edit';
    
    syllabusId: string;
    onSave: (question: Question, action: 'close' | 'next') => void;
    onDelete: (id: string) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({ 
    isOpen, 
    onClose, 
    question, 
    mode,
    syllabusId, 
    onSave,
    onDelete
}) => {
    // Local State
    const [localQuestion, setLocalQuestion] = useState<Question>(question);
    
    // Sync state when question prop changes (essential for "Save & Next")
    useEffect(() => {
        setLocalQuestion(question);
    }, [question]);

    if (!isOpen) return null;

    const syllabus = syllabusData[syllabusId];

    // Helper to derive available content areas and outcomes based on selected modules
    const getDerivedOptions = () => {
        if (!syllabus) return { modules: [], contentAreas: [], outcomes: [] };

        const allModules = syllabus.modules.map((m: any) => m.name);
        
        const selectedModules = localQuestion.modules && localQuestion.modules.length > 0 
            ? syllabus.modules.filter((m: any) => localQuestion.modules?.includes(m.name))
            : syllabus.modules; // If none selected, consider all for content areas, but we'll refine logic

        const availableContentAreas = Array.from(new Set(selectedModules.flatMap((m: any) => m.contentAreas || []))) as string[];
        
        const contentOutcomes = Array.from(new Set(selectedModules.flatMap((m: any) => {
             return (m.outcomes || []).map((o: string) => o.startsWith(syllabus.prefix) ? o : `${syllabus.prefix}${o}`);
        }))) as string[];

        // --- Working Scientifically Logic ---
        // Infer stage from selected modules. 
        // Heuristic: Modules 1-4 are Year 11, Modules 5-8 are Year 12.
        // syllabus.modules is an ordered array.
        
        let showYr11 = false;
        let showYr12 = false;

        if (localQuestion.modules && localQuestion.modules.length > 0) {
            localQuestion.modules.forEach(mName => {
                const index = allModules.indexOf(mName);
                if (index !== -1) {
                    if (index < 4) showYr11 = true;
                    else showYr12 = true;
                }
            });
        } else {
            // Default to showing both if no module selected yet
            showYr11 = true;
            showYr12 = true;
        }

        const workingScientificallyOutcomes = [
            ...(showYr11 ? wsOutcomes.yr11 : []),
            ...(showYr12 ? wsOutcomes.yr12 : [])
        ];
        
        // Use a Set to merge unique outcomes
        const allOutcomes = Array.from(new Set([...contentOutcomes, ...workingScientificallyOutcomes]));
        
        return {
            modules: allModules,
            contentAreas: availableContentAreas,
            outcomes: allOutcomes
        };
    };

    const { modules, contentAreas, outcomes } = getDerivedOptions();

    const handleSave = (action: 'close' | 'next') => {
        if(!localQuestion.number) {
            alert("Please enter a question number.");
            return;
        }
        onSave(localQuestion, action);
        if(action === 'close') onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">
                            {mode === 'create' ? 'Add Question' : 'Edit Question'} {localQuestion.number && `- ${localQuestion.number}`}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {mode === 'create' ? 'Define new question details' : 'Modify question properties'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Number / Label</label>
                            <input 
                                type="text"
                                value={localQuestion.number}
                                onChange={(e) => setLocalQuestion({...localQuestion, number: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="e.g. 1, a, i"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Marks</label>
                            <input 
                                type="number"
                                value={localQuestion.maxMarks}
                                onChange={(e) => setLocalQuestion({...localQuestion, maxMarks: parseFloat(e.target.value)})}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                            <select 
                                value={localQuestion.type}
                                onChange={(e) => setLocalQuestion({...localQuestion, type: e.target.value as any})}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="Short">Short Answer</option>
                                <option value="MCQ">Multiple Choice</option>
                                <option value="Extended">Extended Response</option>
                            </select>
                        </div>
                    </div>

                    {localQuestion.type === 'MCQ' && (
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correct Answer</label>
                             <select
                                value={localQuestion.correctAnswer || ''}
                                onChange={(e) => setLocalQuestion({...localQuestion, correctAnswer: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                             >
                                <option value="">Select Correct Option...</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                             </select>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes / Topic</label>
                        <input 
                            type="text"
                            value={localQuestion.notes || ''}
                            onChange={(e) => setLocalQuestion({...localQuestion, notes: e.target.value})}
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="e.g. Stoichiometry calculation"
                        />
                    </div>

                    <div className="h-px bg-slate-200 my-4" />

                    {/* Syllabus Mapping */}
                    {syllabus ? (
                        <div className="space-y-6">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                                Syllabus Mapping
                            </h4>
                            
                            <TagInput 
                                label="Modules"
                                selected={localQuestion.modules || []}
                                options={modules}
                                onChange={(newTags) => setLocalQuestion({...localQuestion, modules: newTags})}
                                placeholder="Select Modules..."
                            />

                            <TagInput 
                                label="Content Areas"
                                selected={localQuestion.contentAreas || []}
                                options={contentAreas}
                                onChange={(newTags) => setLocalQuestion({...localQuestion, contentAreas: newTags})}
                                placeholder="Select Content Areas..."
                            />

                            <TagInput 
                                label="Syllabus Outcomes"
                                selected={localQuestion.outcomes || []}
                                options={outcomes}
                                onChange={(newTags) => setLocalQuestion({...localQuestion, outcomes: newTags})}
                                placeholder="Select Outcomes..."
                            />

                            <TagInput 
                                label="Cognitive Verbs"
                                selected={localQuestion.cognitiveVerbs || []}
                                options={cognitiveVerbs}
                                onChange={(newTags) => setLocalQuestion({...localQuestion, cognitiveVerbs: newTags})}
                                placeholder="Select Verbs..."
                            />
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800">
                            <AlertCircle className="w-5 h-5" />
                            <p className="text-sm">No syllabus selected for this exam. Deep mapping is disabled.</p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center gap-3">
                     {/* Delete Button (New) */}
                     {mode === 'edit' && (
                         <button 
                            onClick={() => { onDelete(localQuestion.id); onClose(); }} 
                            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                         >
                            <Trash2 className="w-4 h-4" /> Delete
                         </button>
                     )}
                     <div className="flex gap-2 ml-auto">
                        <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                        
                        <button onClick={() => handleSave('next')} className="px-4 py-2 bg-white border border-brand-300 text-brand-700 rounded-lg hover:bg-brand-50 shadow-sm text-sm font-bold flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" /> Save & Next
                        </button>
                        <button onClick={() => handleSave('close')} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm text-sm font-bold flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save & Close
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};