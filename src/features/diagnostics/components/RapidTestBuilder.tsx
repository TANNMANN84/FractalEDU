
import React, { useState } from 'react';
import { X, Save, Plus, Trash2, GripVertical, Check } from 'lucide-react';
import { RapidTest, RapidQuestion, RapidQuestionType } from '@/types';
import { useAppStore } from '@/store';
import { TagInput } from '@/shared/components/TagInput'; 
import { ConfirmDialog } from '@/shared/components/Dialogs';

interface RapidTestBuilderProps {
  onClose: () => void;
  existingTest?: RapidTest;
}

export const RapidTestBuilder: React.FC<RapidTestBuilderProps> = ({ onClose, existingTest }) => {
  const { addRapidTest, updateRapidTest } = useAppStore();
  
  // -- Test Metadata State --
  const [name, setName] = useState(existingTest?.name || '');
  const [yearGroup, setYearGroup] = useState(existingTest?.yearGroup || '7');
  const [tags, setTags] = useState<string[]>(existingTest?.tags || []);
  
  // -- Questions State --
  const [questions, setQuestions] = useState<RapidQuestion[]>(existingTest?.questions || []);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  
  // -- UI State --
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // Initialize active question if existing
  React.useEffect(() => {
      if (questions.length > 0 && !activeQuestionId) {
          setActiveQuestionId(questions[0].id);
      }
  }, []);

  // -- Handlers --

  const handleAddQuestion = () => {
    const newQ: RapidQuestion = {
        id: crypto.randomUUID(),
        prompt: 'New Question',
        type: 'Marks',
        maxMarks: 1
    };
    setQuestions([...questions, newQ]);
    setActiveQuestionId(newQ.id);
  };

  const updateActiveQuestion = (updates: Partial<RapidQuestion>) => {
      if (!activeQuestionId) return;
      setQuestions(prev => prev.map(q => q.id === activeQuestionId ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setQuestionToDelete(id);
  };

  const performDeleteQuestion = () => {
      if (!questionToDelete) return;
      const newQuestions = questions.filter(q => q.id !== questionToDelete);
      setQuestions(newQuestions);
      if (activeQuestionId === questionToDelete) {
          setActiveQuestionId(newQuestions.length > 0 ? newQuestions[0].id : null);
      }
      setQuestionToDelete(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
        alert("Please enter a test name.");
        return;
    }
    if (questions.length === 0) {
        alert("Please add at least one question.");
        return;
    }

    const testData: RapidTest = {
        id: existingTest?.id || crypto.randomUUID(),
        name,
        yearGroup,
        tags,
        questions,
        dateCreated: existingTest?.dateCreated || new Date().toISOString()
    };

    if (existingTest) {
        updateRapidTest(existingTest.id, testData);
    } else {
        addRapidTest(testData);
    }
    onClose();
  };

  // Helper for MCQ Options
  const handleMcqOptionChange = (index: number, val: string) => {
      if (!activeQuestionId) return;
      const q = questions.find(q => q.id === activeQuestionId);
      if (!q) return;

      const newOptions = [...(q.options || ['', '', '', ''])];
      newOptions[index] = val;
      updateActiveQuestion({ options: newOptions });
  };

  const activeQuestion = questions.find(q => q.id === activeQuestionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <div>
             <h3 className="font-bold text-lg text-slate-800">{existingTest ? 'Edit Rapid Test' : 'New Rapid Test'}</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm text-sm font-bold flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Test
            </button>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Left Sidebar: Settings & Question List */}
            <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden">
                
                {/* Test Settings */}
                <div className="p-4 border-b border-slate-200 space-y-4 bg-white/50">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Test Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="e.g. Yr 8 Forces Quiz"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year Group</label>
                            <select 
                                value={yearGroup} 
                                onChange={e => setYearGroup(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                {[7,8,9,10,11,12].map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                        </div>
                        {/* Tags could use the TagInput component if available, using simple text for now to match specs */}
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tags</label>
                             <TagInput 
                                label=""
                                selected={tags}
                                options={[]} // Free text allow
                                onChange={setTags}
                                placeholder="Add..."
                             />
                        </div>
                    </div>
                </div>

                {/* Question List Header */}
                <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Questions ({questions.length})</span>
                    <button onClick={handleAddQuestion} className="p-1 bg-white border border-slate-300 rounded hover:bg-brand-50 hover:border-brand-300 text-brand-600 transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Draggable/Selectable List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {questions.map((q, idx) => (
                        <div 
                            key={q.id}
                            onClick={() => setActiveQuestionId(q.id)}
                            className={`
                                group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                ${activeQuestionId === q.id 
                                    ? 'bg-white border-brand-500 shadow-sm ring-1 ring-brand-200' 
                                    : 'bg-slate-50/50 border-transparent hover:bg-white hover:border-slate-300'}
                            `}
                        >
                            <span className="text-xs font-bold text-slate-400 w-5">Q{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{q.prompt || 'Untitled'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded-sm uppercase tracking-wide">{q.type}</span>
                                    <span className="text-[10px] text-slate-400">{q.maxMarks}m</span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => deleteQuestion(e, q.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    
                    {questions.length === 0 && (
                        <div className="text-center py-8 px-4 text-slate-400 text-sm">
                            No questions yet. Click "+" to add one.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content: Question Editor */}
            <div className="flex-1 bg-white p-8 overflow-y-auto">
                {activeQuestion ? (
                    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300" key={activeQuestion.id}>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Question Prompt</label>
                            <input 
                                type="text"
                                value={activeQuestion.prompt}
                                onChange={e => updateActiveQuestion({ prompt: e.target.value })}
                                className="w-full text-xl p-3 border-b-2 border-slate-200 focus:border-brand-500 outline-none bg-transparent placeholder-slate-300 font-medium transition-colors"
                                placeholder="Type your question here..."
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question Type</label>
                                <select 
                                    value={activeQuestion.type}
                                    onChange={e => updateActiveQuestion({ type: e.target.value as RapidQuestionType })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                                >
                                    <option value="Marks">Basic Score (Marks)</option>
                                    <option value="Spelling">Spelling</option>
                                    <option value="MCQ">Multiple Choice</option>
                                    <option value="Matching">Matching</option>
                                    <option value="Written">Written Answer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Marks</label>
                                <input 
                                    type="number"
                                    min="1"
                                    value={activeQuestion.maxMarks}
                                    onChange={e => updateActiveQuestion({ maxMarks: parseInt(e.target.value) || 1 })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Conditional Fields based on Type */}
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            
                            {activeQuestion.type === 'Spelling' && (
                                <div>
                                    <label className="block text-xs font-bold text-brand-600 uppercase mb-2">Correct Spelling</label>
                                    <input 
                                        type="text" 
                                        value={activeQuestion.correctAnswer || ''}
                                        onChange={e => updateActiveQuestion({ correctAnswer: e.target.value })}
                                        className="w-full p-3 bg-white border border-brand-200 rounded-lg text-lg font-mono text-brand-800 placeholder-brand-200 focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="Enter word..."
                                    />
                                    <p className="text-xs text-slate-500 mt-2">During testing, input will be checked against this word (case-insensitive).</p>
                                </div>
                            )}

                            {activeQuestion.type === 'MCQ' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Options</label>
                                        <label className="block text-xs font-bold text-brand-600 uppercase">Correct Answer</label>
                                    </div>
                                    
                                    {['A', 'B', 'C', 'D'].map((optLabel, idx) => (
                                        <div key={optLabel} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                                                {optLabel}
                                            </div>
                                            <input 
                                                type="text"
                                                value={activeQuestion.options?.[idx] || ''}
                                                onChange={e => handleMcqOptionChange(idx, e.target.value)}
                                                className="flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:border-brand-500 outline-none"
                                                placeholder={`Option ${optLabel} text...`}
                                            />
                                            <button 
                                                onClick={() => updateActiveQuestion({ correctAnswer: optLabel })}
                                                className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center border transition-all
                                                    ${activeQuestion.correctAnswer === optLabel 
                                                        ? 'bg-brand-600 border-brand-600 text-white' 
                                                        : 'bg-white border-slate-300 text-transparent hover:border-brand-400'}
                                                `}
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeQuestion.type === 'Matching' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Correct Match Key</label>
                                    <input 
                                        type="text" 
                                        value={activeQuestion.correctAnswer || ''}
                                        onChange={e => updateActiveQuestion({ correctAnswer: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                        placeholder="e.g. 1-B, 2-A"
                                    />
                                </div>
                            )}

                            {(activeQuestion.type === 'Marks' || activeQuestion.type === 'Written') && (
                                <div className="text-center py-4 text-slate-400 text-sm italic">
                                    No specific validation logic required for this type.
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <GripVertical className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Select a question to edit</p>
                    </div>
                )}
            </div>
        </div>

        <ConfirmDialog 
            isOpen={!!questionToDelete}
            title="Delete Question"
            message="Are you sure you want to delete this question?"
            onConfirm={performDeleteQuestion}
            onCancel={() => setQuestionToDelete(null)}
            isDanger={true}
        />

      </div>
    </div>
  );
};
