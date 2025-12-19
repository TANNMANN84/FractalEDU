
import React, { useState } from 'react';
import { X, Save, UserPlus } from 'lucide-react';
import { useAppStore } from '@/store';
import { Student, Cohort, SupportLevel, WellbeingStatus } from '@/types';

interface AddStudentModalProps {
  onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ onClose }) => {
  const addStudent = useAppStore((state) => state.addStudent);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cohort, setCohort] = useState<Cohort>(Cohort.YEAR_7);
  const [supportLevel, setSupportLevel] = useState<SupportLevel>(SupportLevel.NONE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      cohort,
      wellbeing: {
        status: WellbeingStatus.GREEN,
        notes: '',
        lastUpdated: new Date().toISOString(),
      },
      support: {
        level: supportLevel,
        needs: [],
        strategies: [],
      },
      evidenceLog: [],
      isAtsi: false,
      hasLearningPlan: false,
    };

    addStudent(newStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
           <div className="flex items-center gap-2 text-slate-800">
            <UserPlus className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold">Enrol New Student</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Year Group (Cohort)</label>
            <select
              value={cohort}
              onChange={(e) => setCohort(e.target.value as Cohort)}
              className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              {Object.values(Cohort).map((c) => (
                <option key={c as string} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Support Level</label>
            <select
              value={supportLevel}
              onChange={(e) => setSupportLevel(e.target.value as SupportLevel)}
              className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              {Object.values(SupportLevel).map((l) => (
                <option key={l as string} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              Enrol Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
