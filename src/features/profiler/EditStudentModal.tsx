import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useAppStore } from '@/store';
import { Student, Cohort } from '@/types';

interface EditStudentModalProps {
  student: Student;
  onClose: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onClose }) => {
  const updateStudent = useAppStore((state) => state.updateStudent);
  
  const [name, setName] = useState(student.name);
  const [cohort, setCohort] = useState<Cohort>(student.cohort);
  const [isAtsi, setIsAtsi] = useState(student.isAtsi || false);
  const [hasLearningPlan, setHasLearningPlan] = useState(student.hasLearningPlan || false);
  const [wellbeingNotes, setWellbeingNotes] = useState(student.wellbeing.notes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateStudent(student.id, {
      name,
      cohort,
      isAtsi,
      hasLearningPlan,
      wellbeing: {
        ...student.wellbeing,
        notes: wellbeingNotes,
        lastUpdated: new Date().toISOString(),
      }
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Edit Student Profile</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cohort</label>
              <select
                value={cohort}
                onChange={(e) => setCohort(e.target.value as Cohort)}
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {Object.values(Cohort).map((c) => (
                  <option key={c as string} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Wellbeing Notes</label>
            <textarea
              value={wellbeingNotes}
              onChange={(e) => setWellbeingNotes(e.target.value)}
              className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAtsi}
                onChange={(e) => setIsAtsi(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span className="text-sm text-slate-700">Identifies as ATSI</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasLearningPlan}
                onChange={(e) => setHasLearningPlan(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span className="text-sm text-slate-700">Has Learning Plan</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};