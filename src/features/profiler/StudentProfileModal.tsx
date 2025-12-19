
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Student, EvidenceLogEntry } from '@/types';
import { X, Plus, Calendar, User, FileText, Activity, BookOpen, Brain, Ruler, Pencil, Check } from 'lucide-react';
import { AddEvidenceModal } from './AddEvidenceModal';
import { EditStudentModal } from './EditStudentModal';

interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
}

const NAPLAN_BANDS = ['Exceeding', 'Strong', 'Developing', 'Needs additional support', 'Exempt'];

const NaplanBadge: React.FC<{ label: string; value?: string; isEditing: boolean; onChange?: (val: string) => void }> = ({ label, value, isEditing, onChange }) => {
  const getColor = (v?: string) => {
    switch (v) {
      case 'Exceeding': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Strong': return 'bg-green-100 text-green-700 border-green-200';
      case 'Developing': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Needs additional support': return 'bg-red-100 text-red-700 border-red-200';
      case 'Exempt': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-200 border-dashed';
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      {isEditing ? (
        <select
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="text-xs border rounded p-1 w-full bg-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
        >
          <option value="">- Select -</option>
          {NAPLAN_BANDS.map(band => (
            <option key={band} value={band}>{band}</option>
          ))}
        </select>
      ) : (
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getColor(value)} inline-block text-center whitespace-nowrap overflow-hidden text-ellipsis`}>
          {value || 'N/A'}
        </span>
      )}
    </div>
  );
};

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'evidence'>('profile');
  
  // Modal States
  const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditingNaplan, setIsEditingNaplan] = useState(false);

  const { addEvidence, updateStudent, students, results, exams } = useAppStore();

  // Re-fetch student from store to ensure we have latest data/logs
  const currentStudent = students.find(s => s.id === student.id) || student;

  // Local state for NAPLAN editing
  const [naplanState, setNaplanState] = useState(currentStudent.naplan || {});

  // Sync state when entering edit mode or when student changes
  useEffect(() => {
    if (isEditingNaplan) {
      setNaplanState(currentStudent.naplan || {});
    }
  }, [isEditingNaplan, currentStudent.naplan]);

  // Derive exam results for this student
  const studentResults = results.filter(r => r.studentId === currentStudent.id);

  const handleSaveEvidence = (log: EvidenceLogEntry) => {
    addEvidence(currentStudent.id, log);
  };

  const handleNaplanChange = (year: 'year7' | 'year9', field: string, value: string) => {
    setNaplanState(prev => ({
      ...prev,
      [year]: {
        ...(prev[year] || {}),
        [field]: value
      }
    }));
  };

  const saveNaplan = () => {
    updateStudent(currentStudent.id, { naplan: naplanState });
    setIsEditingNaplan(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold border-4 border-white shadow-sm">
              {currentStudent.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-800">{currentStudent.name}</h2>
                <button 
                  onClick={() => setIsEditProfileOpen(true)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Pencil className="w-3 h-3" /> Edit Profile
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {currentStudent.cohort}</span>
                {currentStudent.isAtsi && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">ATSI</span>}
                {currentStudent.hasLearningPlan && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Learning Plan</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 shrink-0 bg-white">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Profile Overview
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'evidence' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Evidence Logs ({currentStudent.evidenceLog?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Personal Details */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-500" /> Personal Details
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  <div>
                    <dt className="text-slate-500 text-xs uppercase tracking-wide">Full Name</dt>
                    <dd className="font-medium text-slate-800">{currentStudent.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs uppercase tracking-wide">Year Group</dt>
                    <dd className="font-medium text-slate-800">{currentStudent.cohort}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs uppercase tracking-wide">Academic Target</dt>
                    <dd className="font-medium text-slate-800">{currentStudent.academicTarget || 'N/A'}</dd>
                  </div>
                   <div>
                    <dt className="text-slate-500 text-xs uppercase tracking-wide">Support Level</dt>
                    <dd className="font-medium text-slate-800">{currentStudent.support.level}</dd>
                  </div>
                </dl>
              </div>

              {/* Wellbeing */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" /> Wellbeing Snapshot
                </h3>
                <div className={`p-4 rounded-lg border ${
                  currentStudent.wellbeing.status === 'green' ? 'bg-green-50 border-green-100' :
                  currentStudent.wellbeing.status === 'amber' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Status</span>
                     <span className={`w-3 h-3 rounded-full ${
                        currentStudent.wellbeing.status === 'green' ? 'bg-green-500' :
                        currentStudent.wellbeing.status === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                     }`} />
                  </div>
                  <p className="text-sm text-slate-700 italic">"{currentStudent.wellbeing.notes || 'No notes available.'}"</p>
                  <p className="text-xs text-slate-400 mt-2 text-right">Updated: {new Date(currentStudent.wellbeing.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Academic Badges */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" /> Academic Profile (NAPLAN)
                  </h3>
                  {isEditingNaplan ? (
                    <button 
                      onClick={saveNaplan}
                      className="text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Save
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsEditingNaplan(true)}
                      className="text-xs font-medium text-slate-500 hover:text-brand-600 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Year 7 */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 mb-3">Year 7 Results</h4>
                    <div className="grid grid-cols-4 gap-2">
                        <NaplanBadge 
                          label="Reading" 
                          value={isEditingNaplan ? (naplanState.year7?.reading) : (currentStudent.naplan?.year7?.reading)} 
                          isEditing={isEditingNaplan}
                          onChange={(val) => handleNaplanChange('year7', 'reading', val)}
                        />
                        <NaplanBadge 
                          label="Writing" 
                          value={isEditingNaplan ? (naplanState.year7?.writing) : (currentStudent.naplan?.year7?.writing)} 
                          isEditing={isEditingNaplan}
                          onChange={(val) => handleNaplanChange('year7', 'writing', val)}
                        />
                        <NaplanBadge 
                          label="Numeracy" 
                          value={isEditingNaplan ? (naplanState.year7?.numeracy) : (currentStudent.naplan?.year7?.numeracy)} 
                          isEditing={isEditingNaplan}
                          onChange={(val) => handleNaplanChange('year7', 'numeracy', val)}
                        />
                        <NaplanBadge 
                          label="Grammar" 
                          value={isEditingNaplan ? (naplanState.year7?.grammar) : (currentStudent.naplan?.year7?.grammar)} 
                          isEditing={isEditingNaplan}
                          onChange={(val) => handleNaplanChange('year7', 'grammar', val)}
                        />
                    </div>
                  </div>

                  {/* Year 9 */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 mb-3">Year 9 Results</h4>
                    <div className="grid grid-cols-4 gap-2">
                        <NaplanBadge 
                          label="Reading" 
                          value={isEditingNaplan ? (naplanState.year9?.reading) : (currentStudent.naplan?.year9?.reading)} 
                          isEditing={isEditingNaplan}
                          onChange={(val) => handleNaplanChange('year9', 'reading', val)}
                        />
                        <NaplanBadge 
                          label="Writing" 
                          value={isEditingNaplan ? (naplanState.year9?.writing) : (currentStudent.naplan?.year9?.writing)} 
                          isEditing={isEditingNaplan}
                          onChange={(val) => handleNaplanChange('year9', 'writing', val)}
                        />
                        <NaplanBadge 
                          label="Numeracy" 
                          value={isEditingNaplan ? (naplanState.year9?.numeracy) : (currentStudent.naplan?.year9?.numeracy)} 
                          isEditing={isEditingNaplan}
                          onChange={(val) => handleNaplanChange('year9', 'numeracy', val)}
                        />
                        <NaplanBadge 
                          label="Grammar" 
                          value={isEditingNaplan ? (naplanState.year9?.grammar) : (currentStudent.naplan?.year9?.grammar)} 
                          isEditing={isEditingNaplan}
                          onChange={(val) => handleNaplanChange('year9', 'grammar', val)}
                        />
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Data Stub - Updated to Automatic */}
               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-500" /> Performance Data
                   </h3>
                 </div>

                {studentResults.length > 0 ? (
                  <div className="space-y-2">
                    {studentResults.map((result, idx) => {
                      const exam = exams.find(e => e.id === result.examId);
                      const examName = exam ? exam.name : 'Unknown Exam';
                      const examDate = exam ? new Date(exam.date).toLocaleDateString() : '';
                      const percentage = exam && exam.totalMarks ? Math.round((result.scoreTotal / exam.totalMarks) * 100) : 0;
                      
                      return (
                        <div key={result.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <FileText className="w-4 h-4 text-slate-400" />
                             <div>
                               <span className="text-sm font-medium text-slate-700 block">{examName}</span>
                               <span className="text-xs text-slate-500">{examDate}</span>
                             </div>
                           </div>
                           <div className="text-right">
                             <span className="block text-sm font-bold text-slate-700">
                               {result.scoreTotal} / {exam?.totalMarks || '?'}
                             </span>
                             <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                               percentage >= 80 ? 'bg-green-100 text-green-700' :
                               percentage >= 50 ? 'bg-amber-100 text-amber-700' :
                               'bg-red-100 text-red-700'
                             }`}>
                               {percentage}%
                             </span>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                    <Ruler className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No exam results found.</p>
                    <p className="text-xs text-slate-400 mt-1">Results will appear here automatically when recorded.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">Recent Logs</h3>
                <button 
                  onClick={() => setIsAddEvidenceOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Note
                </button>
              </div>

              <div className="space-y-3">
                {currentStudent.evidenceLog && currentStudent.evidenceLog.length > 0 ? (
                  currentStudent.evidenceLog.map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          log.type === 'Behaviour' ? 'bg-red-100 text-red-700' :
                          log.type === 'Literacy' ? 'bg-blue-100 text-blue-700' :
                          log.type === 'Numeracy' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {log.type}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{log.content}</p>
                      <div className="mt-3 pt-2 border-t border-slate-50 flex justify-end">
                        <span className="text-xs text-slate-400">by {log.author}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-white rounded-xl border border-slate-200 border-dashed">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No evidence logs recorded yet.</p>
                    <p className="text-slate-400 text-xs mt-1">Click "Add Note" to create the first entry.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isAddEvidenceOpen && (
        <AddEvidenceModal 
          student={currentStudent}
          onClose={() => setIsAddEvidenceOpen(false)} 
          onSave={handleSaveEvidence} 
        />
      )}
      
      {isEditProfileOpen && (
        <EditStudentModal
          student={currentStudent}
          onClose={() => setIsEditProfileOpen(false)}
        />
      )}
    </div>
  );
};
