import React, { useState, useEffect } from 'react';
import { X, Save, Layout } from 'lucide-react';
import { useAppStore } from '@/store';
import { ClassGroup } from '@/types';

interface CreateClassModalProps {
  onClose: () => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose }) => {
  const { addClass, teacherProfile } = useAppStore();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [yearLevel, setYearLevel] = useState('7');
  const [teacher, setTeacher] = useState('');

  useEffect(() => {
    if (teacherProfile?.name) setTeacher(teacherProfile.name);
  }, [teacherProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) return;

    const newClass: ClassGroup = {
      id: crypto.randomUUID(),
      name: name.trim(),
      subject: subject.trim(),
      yearLevel: yearLevel,
      teacherId: teacher.trim() || 'Current Teacher',
      studentIds: [],
      seatingPlans: [],
      status: 'Active',
      yearGroup: ''
    };

    addClass(newClass);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <Layout className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold">Create New Class</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="e.g. 10x/Ma1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Year Level</label>
               <select 
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
               >
                  <option value="7">Year 7</option>
                  <option value="8">Year 8</option>
                  <option value="9">Year 9</option>
                  <option value="10">Year 10</option>
                  <option value="11">Year 11</option>
                  <option value="12">Year 12</option>
               </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g. Mathematics"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teacher (Optional)</label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="e.g. Mr. Smith"
            />
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
              Create Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};