
import React, { useState, useEffect } from 'react';
import { X, Tag, Check, Brain, Save, Plus } from 'lucide-react';
import { Student, EvidenceLogEntry, FileUpload } from '@/types';
import { MonitoringFileUpload } from '../monitoring/components/MonitoringFileUpload';
import { 
  ASSIST_CHECKLIST, 
  EXTEND_CHECKLIST, 
  CULTURAL_CHECKLIST,
  LITERACY_CHECKLIST,
  NUMERACY_CHECKLIST,
  BEHAVIOUR_CHECKLIST, 
  WELLBEING_CHECKLIST,
  NCCD_CHECKLIST,
  NCCD_LEVELS
} from './data/evidenceChecklists';

interface Props {
  student: Student;
  onClose: () => void;
  onSave: (log: EvidenceLogEntry) => void;
  initialStrategy?: string;
}

export const AddEvidenceModal: React.FC<Props> = ({ student, onClose, onSave, initialStrategy }) => {
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [linkedAdjustments, setLinkedAdjustments] = useState<string[]>([]);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [file, setFile] = useState<FileUpload | null>(null);
  const [nccdLevel, setNccdLevel] = useState<'QDTP' | 'Supplementary' | 'Substantial' | 'Extensive'>(student.nccd?.level || 'QDTP');
  
  const [customSectionItems, setCustomSectionItems] = useState<Record<string, string[]>>({});
  const [addingCustomTo, setAddingCustomTo] = useState<string | null>(null);
  const [customInputValue, setCustomInputValue] = useState('');

  // Initialize with strategy if provided
  useEffect(() => {
      if (initialStrategy && !linkedAdjustments.includes(initialStrategy)) {
          setLinkedAdjustments([initialStrategy]);
      }
  }, [initialStrategy]);

  // Get active strategies from Phase 2
  const activeStrategies = student.adjustments?.filter(a => a.active) || [];
  const availableTags = ['General', 'Literacy', 'Numeracy', 'Behaviour', 'NCCD', 'Wellbeing', 'HPGE', 'Learning Support', 'Cultural'];

  const toggleTag = (t: string) => {
      setSelectedTags(prev => {
          const isSelected = prev.includes(t);
          return isSelected ? prev.filter(x => x !== t) : [...prev, t];
      });
  };

  const toggleAdj = (adjDesc: string) => {
      setLinkedAdjustments(prev => prev.includes(adjDesc) ? prev.filter(x => x !== adjDesc) : [...prev, adjDesc]);
  };

  const toggleChecklist = (item: string) => {
      setChecklistItems(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const handleAddCustom = (tag: string) => {
      if (!customInputValue.trim()) return;
      const val = customInputValue.trim();
      
      setCustomSectionItems(prev => ({
          ...prev,
          [tag]: [...(prev[tag] || []), val]
      }));
      setChecklistItems(prev => [...prev, val]);
      setCustomInputValue('');
      setAddingCustomTo(null);
  };

  const handleSubmit = () => {
    if (!note.trim() && !file && checklistItems.length === 0) {
        alert("Please add a note, file, or checklist item.");
        return;
    }

    // Append checklist to note if present
    let finalContent = note;
    if (checklistItems.length > 0) {
        finalContent += `\n\n**Actioned Checklist:**\n${checklistItems.map(i => `- ${i}`).join('\n')}`;
    }

    const entry: EvidenceLogEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: (selectedTags[0] as any) || 'General', // Default to General if no tag or primary tag
      content: finalContent,
      author: 'Current Teacher', // In real app, from auth context
      tags: selectedTags,
      adjustments: linkedAdjustments,
      file: file || undefined
    };

    onSave(entry);
    onClose();
  };

  // Helper to render checklist sections with custom option
  const renderChecklistSection = (
      tag: string, 
      title: string, 
      standardItems: string[], 
      theme: { bg: string, border: string, text: string, btnSel: string, btnBase: string }
  ) => {
      if (!selectedTags.includes(tag)) return null;

      const customForThis = customSectionItems[tag] || [];
      const allItems = [...standardItems, ...customForThis];
      const isAdding = addingCustomTo === tag;

      return (
          <div className={`${theme.bg} dark:bg-opacity-20 p-4 rounded-xl border ${theme.border} dark:border-opacity-30 mb-4`}>
              <div className="flex justify-between items-center mb-2">
                  <h4 className={`text-xs font-bold ${theme.text} dark:text-opacity-90 uppercase`}>{title}</h4>
                  {tag === 'NCCD' && (
                      <select 
                          value={nccdLevel as string}
                          onChange={(e) => setNccdLevel(e.target.value as 'QDTP' | 'Supplementary' | 'Substantial' | 'Extensive')}
                          className={`text-xs border ${theme.btnBase.split(' ')[1]} rounded p-1 ${theme.text} bg-white dark:bg-slate-800 focus:ring-1 focus:ring-pink-500 outline-none`}
                      >
                          {Object.keys(NCCD_LEVELS).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                      </select>
                  )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                  {allItems.map(item => (
                      <button 
                          key={item} 
                          onClick={() => toggleChecklist(item)} 
                          className={`px-2 py-1 text-xs rounded border transition-colors ${checklistItems.includes(item) ? `${theme.btnSel} text-white` : `bg-white dark:bg-slate-800 ${theme.btnBase}`}`}
                      >
                          {item}
                      </button>
                  ))}

                  {/* Custom Input */}
                  {isAdding ? (
                      <div className="flex items-center gap-1">
                          <input 
                              autoFocus
                              value={customInputValue}
                              onChange={e => setCustomInputValue(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAddCustom(tag)}
                              className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none w-32"
                              placeholder="Custom..."
                          />
                          <button onClick={() => handleAddCustom(tag)} className="p-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-green-600"><Check className="w-3 h-3" /></button>
                          <button onClick={() => { setAddingCustomTo(null); setCustomInputValue(''); }} className="p-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400"><X className="w-3 h-3" /></button>
                      </div>
                  ) : (
                      <button 
                          onClick={() => { setAddingCustomTo(tag); setCustomInputValue(''); }} 
                          className={`px-2 py-1 text-xs rounded border border-dashed bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors ${theme.btnBase} opacity-70 hover:opacity-100 flex items-center gap-1`}
                      >
                          <Plus className="w-3 h-3" /> Custom
                      </button>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Add Evidence</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* 1. Context Tags */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                    {availableTags.map(t => (
                        <button 
                            key={t} 
                            onClick={() => toggleTag(t)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                                selectedTags.includes(t) 
                                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800' 
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Dynamic Checklists (Phase 3 Refinement) */}
            {renderChecklistSection('Learning Support', 'Support Provided', ASSIST_CHECKLIST, { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', btnSel: 'bg-blue-600 border-blue-600', btnBase: 'text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' })}
            {renderChecklistSection('HPGE', 'Extension Type', EXTEND_CHECKLIST, { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', btnSel: 'bg-amber-600 border-amber-600', btnBase: 'text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' })}
            {renderChecklistSection('Cultural', 'Cultural Linkage', CULTURAL_CHECKLIST, { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', btnSel: 'bg-red-600 border-red-600', btnBase: 'text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' })}
            {renderChecklistSection('Literacy', 'Literacy Strategies', LITERACY_CHECKLIST, { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-700', btnSel: 'bg-cyan-600 border-cyan-600', btnBase: 'text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' })}
            {renderChecklistSection('Numeracy', 'Numeracy Strategies', NUMERACY_CHECKLIST, { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', btnSel: 'bg-emerald-600 border-emerald-600', btnBase: 'text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' })}
            {renderChecklistSection('Behaviour', 'Behaviour Management', BEHAVIOUR_CHECKLIST, { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', btnSel: 'bg-orange-600 border-orange-600', btnBase: 'text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800' })}
            {renderChecklistSection('Wellbeing', 'Wellbeing Support', WELLBEING_CHECKLIST, { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700', btnSel: 'bg-violet-600 border-violet-600', btnBase: 'text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800' })}
            {renderChecklistSection('NCCD', 'NCCD Evidence', (NCCD_LEVELS[nccdLevel as keyof typeof NCCD_LEVELS] || NCCD_CHECKLIST), { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-700', btnSel: 'bg-pink-600 border-pink-600', btnBase: 'text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800' })}

            {/* 3. Smart Linking */}
            {activeStrategies.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <label className="text-xs font-bold text-indigo-400 uppercase mb-2 flex items-center gap-2">
                        <Brain className="w-3 h-3" /> Link to Active Plan
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {activeStrategies.map(adj => (
                            <button 
                                key={adj.id} 
                                onClick={() => toggleAdj(adj.description)}
                                className={`text-xs px-2 py-1.5 rounded border transition-colors text-left flex items-center gap-2 max-w-full truncate ${
                                    linkedAdjustments.includes(adj.description) 
                                        ? 'bg-indigo-600 text-white border-indigo-600' 
                                        : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300'
                                }`}
                            >
                                {linkedAdjustments.includes(adj.description) && <Check className="w-3 h-3 shrink-0" />}
                                <span className="truncate">{adj.description}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Note */}
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Observation / Note</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 border p-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                    placeholder="Describe the observation, adjustment implementation, or outcome..."
                />
            </div>

            {/* 5. File Upload */}
            <MonitoringFileUpload 
                label="Attachment (Photo / Work Sample)" 
                file={file} 
                onUpload={setFile} 
                onRemove={() => setFile(null)} 
            />

        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Evidence
            </button>
        </div>
      </div>
    </div>
  );
};
