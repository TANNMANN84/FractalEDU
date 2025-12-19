import React, { useState } from 'react';
import { X, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { Student } from '@/types';

interface LinkAnalysisDataModalProps {
  student: Student;
  onClose: () => void;
}

export const LinkAnalysisDataModal: React.FC<LinkAnalysisDataModalProps> = ({ student, onClose }) => {
  const { exams, updateStudent } = useAppStore();
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const handleLink = () => {
    if (!selectedExamId) return;
    
    const exam = exams.find(e => e.id === selectedExamId);
    if (!exam) return;

    // In a real app, we would verify results exist, but for now we just link the reference
    const currentResponses = student.analysisResults?.examResponses || {};
    
    updateStudent(student.id, {
      analysisResults: {
        examResponses: {
          ...currentResponses,
          [exam.id]: {
            examName: exam.name,
            linkedStudentId: student.id,
            responses: {}, // Placeholder
            mcqResponses: {}
          }
        }
      }
    });

    onClose();
  };

  // Filter exams already linked
  const availableExams = exams.filter(e => 
    !student.analysisResults?.examResponses[e.id]
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Link Performance Data</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Select an exam to link to <strong>{student.name}</strong>. This will display performance metrics in their profile.
          </p>

          {availableExams.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Exam</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="">-- Choose an Exam --</option>
                {availableExams.map((exam) => (
                  <option key={exam.id} value={exam.id}>{exam.name} ({new Date(exam.date).toLocaleDateString()})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg flex items-start gap-3 text-slate-500 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>No new exams available to link, or no exams exist in the system yet.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLink}
              disabled={!selectedExamId}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LinkIcon className="w-4 h-4" />
              Link Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};