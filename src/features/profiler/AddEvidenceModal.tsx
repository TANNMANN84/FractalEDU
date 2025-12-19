
import React, { useState, useEffect } from 'react';
import { X, Tag, Check, Brain, Save } from 'lucide-react';
import { Student, EvidenceLogEntry, FileUpload } from '@/types';
import { MonitoringFileUpload } from '../monitoring/components/MonitoringFileUpload';
import { ASSIST_CHECKLIST, EXTEND_CHECKLIST, CULTURAL_CHECKLIST } from './data/evidenceChecklists';

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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">Add Evidence</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
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
                                    ? 'bg-brand-100 text-brand-700 border-brand-200' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Dynamic Checklists (Phase 3 Refinement) */}
            {selectedTags.includes('Learning Support') && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Support Provided</h4>
                    <div className="flex flex-wrap gap-2">
                        {ASSIST_CHECKLIST.map(item => (
                            <button key={item} onClick={() => toggleChecklist(item)} className={`px-2 py-1 text-xs rounded border transition-colors ${checklistItems.includes(item) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-800 border-blue-200'}`}>{item}</button>
                        ))}
                    </div>
                </div>
            )}
            {selectedTags.includes('HPGE') && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-700 uppercase mb-2">Extension Type</h4>
                    <div className="flex flex-wrap gap-2">
                        {EXTEND_CHECKLIST.map(item => (
                            <button key={item} onClick={() => toggleChecklist(item)} className={`px-2 py-1 text-xs rounded border transition-colors ${checklistItems.includes(item) ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-800 border-amber-200'}`}>{item}</button>
                        ))}
                    </div>
                </div>
            )}
            {selectedTags.includes('Cultural') && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <h4 className="text-xs font-bold text-red-700 uppercase mb-2">Cultural Linkage</h4>
                    <div className="flex flex-wrap gap-2">
                        {CULTURAL_CHECKLIST.map(item => (
                            <button key={item} onClick={() => toggleChecklist(item)} className={`px-2 py-1 text-xs rounded border transition-colors ${checklistItems.includes(item) ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-800 border-red-200'}`}>{item}</button>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Smart Linking */}
            {activeStrategies.length > 0 && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
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
                                        : 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-300'
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
                    className="w-full rounded-lg border-slate-300 border p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
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

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
