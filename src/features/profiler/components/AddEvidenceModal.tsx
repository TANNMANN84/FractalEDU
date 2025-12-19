
import React, { useState, useEffect } from 'react';
import { X, Save, ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { Student, EvidenceLogEntry, FileUpload } from '@/types';
import { MonitoringFileUpload } from '../../monitoring/components/MonitoringFileUpload';
import { EVIDENCE_DOMAINS } from '@/features/profiler/data/evidenceChecklists';

interface Props {
  student: Student;
  onClose: () => void;
  onSave: (log: EvidenceLogEntry) => void;
  initialStrategy?: string;
}

export const AddEvidenceModal: React.FC<Props> = ({ student, onClose, onSave, initialStrategy }) => {
  // Core State
  const [note, setNote] = useState('');
  const [file, setFile] = useState<FileUpload | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Checklist State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // NCCD State
  const [nccdData, setNccdData] = useState({
      level: student.nccd?.level || 'QDTP',
      category: student.nccd?.categories?.[0] || 'Cognitive'
  });

  // Init
  useEffect(() => {
      if (initialStrategy) {
          setNote(prev => prev + (prev ? '\n' : '') + `Strategy: ${initialStrategy}`);
      }
      // Auto-select NCCD tag if student is NCCD active
      if (student.nccd?.active && student.nccd.isNCCD) {
          setSelectedTags(prev => [...prev, 'NCCD']);
      }
  }, [initialStrategy, student.nccd]);

  const toggleTag = (t: string) => {
      setSelectedTags(prev => {
          const next = prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t];
          // Auto-open the section if adding and it has checklists
          const checklistTags = ['HPGE', 'Learning Support', 'Cultural', 'Literacy', 'Numeracy'];
          if (!prev.includes(t) && checklistTags.includes(t)) {
              setOpenSections(s => ({ ...s, [t]: true }));
          }
          return next;
      });
  };

  const toggleSection = (label: string) => setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));

  const toggleChecklistItem = (item: string) => {
      const next = new Set(selectedItems);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      setSelectedItems(next);
  };

  const handleSubmit = () => {
      if (!note.trim() && !file && selectedItems.size === 0) {
          alert("Please add content to the evidence log.");
          return;
      }

      // Build rich content
      let finalContent = note;
      
      // Append NCCD details if tag active
      if (selectedTags.includes('NCCD')) {
          finalContent += `\n\n**NCCD Classification:**\n- Level: ${nccdData.level}\n- Category: ${nccdData.category}`;
      }

      // Append Checklist
      if (selectedItems.size > 0) {
          finalContent += `\n\n**Adjustments / Strategies:**\n${Array.from(selectedItems).map(i => `- ${i}`).join('\n')}`;
      }

      const entry: EvidenceLogEntry = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          type: (selectedTags[0] as any) || 'General',
          content: finalContent,
          author: 'Current Teacher', 
          tags: selectedTags,
          file: file || undefined
      };

      onSave(entry);
      onClose();
  };

  // Helper to render a checklist section
  const renderChecklistSection = (tagKey: string, title: string, dataKey: keyof typeof EVIDENCE_DOMAINS) => {
      if (!selectedTags.includes(tagKey)) return null;
      const domains = EVIDENCE_DOMAINS[dataKey] as Record<string, string[]>;
      
      return (
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
              <button 
                  onClick={() => toggleSection(tagKey)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                  <span className="font-bold text-sm text-slate-700">{title} Options</span>
                  {openSections[tagKey] ? <ChevronDown className="w-4 h-4 text-slate-400"/> : <ChevronRight className="w-4 h-4 text-slate-400"/>}
              </button>
              
              {openSections[tagKey] && (
                  <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-1">
                      {Object.entries(domains).map(([subCat, items]) => (
                          <div key={subCat}>
                              <h5 className="text-xs font-bold text-slate-400 uppercase mb-2 border-b border-slate-100 pb-1">{subCat}</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {items.map(item => (
                                      <button 
                                          key={item} 
                                          onClick={() => toggleChecklistItem(item)}
                                          className={`flex items-start gap-2 text-left text-xs p-2 rounded transition-colors ${selectedItems.has(item) ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-slate-50 text-slate-600'}`}
                                      >
                                          {selectedItems.has(item) ? <CheckSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-600" /> : <Square className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-300" />}
                                          <span className="leading-snug">{item}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  };

  return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-800">Log Evidence</h3>
                  <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Tag Selector */}
                  <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Evidence Type</label>
                      <div className="flex flex-wrap gap-2">
                          {['NCCD', 'HPGE', 'Learning Support', 'Cultural', 'Wellbeing', 'Literacy', 'Numeracy'].map(t => (
                              <button 
                                  key={t} 
                                  onClick={() => toggleTag(t)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                      selectedTags.includes(t) 
                                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                  }`}
                              >
                                  {t}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Dynamic Sections */}
                  <div className="space-y-4">
                      {/* NCCD Specifics */}
                      {selectedTags.includes('NCCD') && (
                          <div className="p-4 bg-pink-50 border border-pink-100 rounded-xl space-y-3">
                              <div className="flex justify-between items-center">
                                  <span className="font-bold text-sm text-pink-800">NCCD Details</span>
                                  <span className="text-[10px] bg-white px-2 py-0.5 rounded text-pink-400 border border-pink-100 font-bold">Required</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-pink-700 mb-1">Level</label>
                                      <select value={nccdData.level} onChange={e => setNccdData(p => ({...p, level: e.target.value as any}))} className="w-full text-xs p-2 rounded border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none text-slate-700">
                                          {['QDTP', 'Supplementary', 'Substantial', 'Extensive'].map(l => <option key={l} value={l}>{l}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-pink-700 mb-1">Category</label>
                                      <select value={nccdData.category} onChange={e => setNccdData(p => ({...p, category: e.target.value as any}))} className="w-full text-xs p-2 rounded border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none text-slate-700">
                                          {['Cognitive', 'Physical', 'Social/Emotional', 'Sensory'].map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* Checklists */}
                      {renderChecklistSection('HPGE', 'Extension & Enrichment', 'hpge')}
                      {renderChecklistSection('Learning Support', 'Differentiation (Assist)', 'assist')}
                      {renderChecklistSection('Cultural', '8 Ways & Cultural', 'cultural')}
                      {renderChecklistSection('Literacy', 'Literacy Strategies', 'literacy')}
                      {renderChecklistSection('Numeracy', 'Numeracy Strategies', 'numeracy')}
                  </div>

                  {/* Standard Input */}
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Notes</label>
                      <textarea 
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none min-h-[100px]"
                          placeholder="Enter observation or additional details..."
                      />
                  </div>

                  <MonitoringFileUpload label="Attach Evidence" file={file} onUpload={setFile} onRemove={() => setFile(null)} />
              </div>

              <div className="p-4 border-t bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                  <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                  <button onClick={handleSubmit} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 shadow-sm flex items-center gap-2 text-sm">
                      <Save className="w-4 h-4" /> Save Entry
                  </button>
              </div>
          </div>
      </div>
  );
};
