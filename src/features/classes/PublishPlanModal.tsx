import React, { useState } from 'react';
import { X, Check, User, Info } from 'lucide-react';
import { Student } from '@/types';

interface PublishPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (generalNote: string, studentNotes: Record<string, string>) => void;
  seatedStudents: Student[];
  planName: string;
}

export const PublishPlanModal: React.FC<PublishPlanModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  seatedStudents,
  planName
}) => {
  const [generalNote, setGeneralNote] = useState('New seating arrangement.');
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleNoteChange = (studentId: string, note: string) => {
    setStudentNotes(prev => ({
      ...prev,
      [studentId]: note
    }));
  };

  const handleSubmit = () => {
    onConfirm(generalNote, studentNotes);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Publish & Log Evidence</h3>
            <p className="text-sm text-slate-500">Creating logs for <span className="font-semibold text-brand-600">{seatedStudents.length}</span> students in <span className="font-semibold">{planName}</span>.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* General Note */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-brand-500" />
                <label className="text-sm font-bold text-slate-700">General Note</label>
            </div>
            <p className="text-xs text-slate-500 mb-2">This note will be applied to all students unless a specific reason is provided below.</p>
            <textarea 
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              rows={2}
              placeholder="e.g. Moved for Term 3 collaboration..."
            />
          </div>

          {/* Student List */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Differentiation Notes
            </h4>
            <div className="space-y-3">
              {seatedStudents.map(student => (
                <div key={student.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg hover:border-slate-300 transition-colors bg-white">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                    {student.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800">{student.name}</span>
                      {student.support.level !== 'none' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded uppercase">
                          {student.support.level}
                        </span>
                      )}
                    </div>
                    <input 
                      type="text"
                      value={studentNotes[student.id] || ''}
                      onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      placeholder="Add specific differentiation note (overrides general note)..."
                      className="w-full text-sm border-b border-slate-200 focus:border-brand-500 outline-none py-1 bg-transparent placeholder-slate-400 focus:bg-slate-50 transition-colors"
                    />
                  </div>
                </div>
              ))}
              {seatedStudents.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-4 border-2 border-dashed border-slate-100 rounded-lg">
                    No students are currently placed on the seating plan.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Check className="w-4 h-4" />
            Confirm & Log
          </button>
        </div>
      </div>
    </div>
  );
};