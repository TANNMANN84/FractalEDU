import React, { useState } from 'react';
import { X, Save, AlertCircle, ShieldAlert, GraduationCap, Info } from 'lucide-react';
import { Student, ConcernEntry, FileUpload, ConcernCategory } from '@/types';
import { MonitoringFileUpload } from './MonitoringFileUpload';

interface AddConcernModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (concern: Omit<ConcernEntry, 'id'>) => void;
  students: Student[];
}

export const AddConcernModal: React.FC<AddConcernModalProps> = ({ isOpen, onClose, onSave, students }) => {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [file, setFile] = useState<FileUpload | null>(null);
  const [category, setCategory] = useState<ConcernCategory>('Other');

  if (!isOpen) return null;

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
      if (selectedStudentIds.length === 0 || !file) {
          alert("Please select at least one student and upload a file.");
          return;
      }
      onSave({ studentIds: selectedStudentIds, file, category });
      onClose();
  };

  const categoryOptions: { value: ConcernCategory; label: string; icon: any; color: string }[] = [
      { value: 'Illness/Misadventure', label: 'Illness/Misadventure', icon: AlertCircle, color: 'text-blue-600' },
      { value: 'N-Warning', label: 'N-Warning', icon: ShieldAlert, color: 'text-red-600' },
      { value: 'Malpractice', label: 'Malpractice', icon: GraduationCap, color: 'text-purple-600' },
      { value: 'Other', label: 'Other / Communication', icon: Info, color: 'text-slate-600' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Log Communication / Concern</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">1. Select Category</label>
                <div className="grid grid-cols-2 gap-2">
                    {categoryOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setCategory(opt.value)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                category === opt.value 
                                ? 'bg-indigo-50 border-indigo-500 shadow-sm' 
                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                            }`}
                        >
                            <opt.icon className={`w-5 h-5 shrink-0 ${category === opt.value ? opt.color : 'text-slate-400'}`} />
                            <span className={`text-xs font-bold leading-tight ${category === opt.value ? 'text-indigo-900' : ''}`}>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">2. Upload Evidence / Log</label>
                <MonitoringFileUpload 
                    label=""
                    file={file}
                    onUpload={setFile}
                    onRemove={() => setFile(null)}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">3. Tag Students</label>
                <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto p-2 space-y-1 bg-slate-50">
                    {students.map(student => (
                        <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                            <input 
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => handleToggleStudent(student.id)}
                                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-700">{student.name}</span>
                        </label>
                    ))}
                    {students.length === 0 && <p className="text-sm text-slate-400 p-2">No students available.</p>}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">
                    {selectedStudentIds.length} students selected.
                </p>
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              Save Log
            </button>
        </div>
      </div>
    </div>
  );
};
