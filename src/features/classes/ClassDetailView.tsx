
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Users, Grid, BarChart2, UserPlus, FileText } from 'lucide-react';
import { ClassGroup, Student } from '@/types';
import { StudentList } from '../profiler/StudentList';
import { StudentDossier } from '../profiler/components/StudentDossier';
import { SeatingPlanEditor } from './SeatingPlanEditor';
import { ClassAnalyticsDashboard } from './components/ClassAnalyticsDashboard';
import { ManageClassStudentsModal } from './components/ManageClassStudentsModal';
import { ProgramManager } from './components/programs/ProgramManager';
import { useAppStore } from '@/store';

interface ClassDetailViewProps {
  classGroup: ClassGroup;
  onBack: () => void;
}

export const ClassDetailView: React.FC<ClassDetailViewProps> = ({ classGroup, onBack }) => {
  const { students, classes } = useAppStore();
  const [activeTab, setActiveTab] = useState<'analytics' | 'roster' | 'seating' | 'programs'>('analytics');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);

  // CRITICAL FIX: Fetch the 'live' class from the store to ensure updates (memos, students) trigger re-renders
  const liveClass = classes.find(c => c.id === classGroup.id) || classGroup;

  // Filter students for this class using live data
  const classStudents = useMemo(() => 
    students.filter(s => liveClass.studentIds.includes(s.id)), 
  [students, liveClass]);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{liveClass.name}</h2>
          <p className="text-slate-500 dark:text-slate-400">{liveClass.subject} • {liveClass.studentIds.length} Students</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-all ${
            activeTab === 'analytics' 
              ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-all ${
            activeTab === 'roster' 
              ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Students
        </button>
        <button
          onClick={() => setActiveTab('seating')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-all ${
            activeTab === 'seating' 
              ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          Seating
        </button>
        <button
          onClick={() => setActiveTab('programs')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-all ${
            activeTab === 'programs' 
              ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Programs
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'analytics' && (
            <div className="h-full overflow-y-auto p-1">
                <ClassAnalyticsDashboard 
                    students={classStudents} 
                    classGroup={liveClass}
                />
            </div>
        )}
        
        {activeTab === 'roster' && (
          <div className="h-full overflow-y-auto pt-2 flex flex-col gap-4">
            <div className="flex justify-end">
                <button 
                    onClick={() => setIsManageOpen(true)} 
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm transition-colors"
                >
                    <UserPlus className="w-4 h-4" /> Manage class list
                </button>
            </div>
            <StudentList onSelectStudent={setSelectedStudent} lockedClassId={liveClass.id} />
          </div>
        )}
        
        {activeTab === 'seating' && (
          <div className="h-full pt-2">
            <SeatingPlanEditor classGroup={liveClass} />
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="h-full pt-2 overflow-y-auto">
            <ProgramManager classId={liveClass.id} />
          </div>
        )}
      </div>

      {selectedStudent && (
        <StudentDossier 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}

      {isManageOpen && (
        <ManageClassStudentsModal 
            classGroup={liveClass} 
            onClose={() => setIsManageOpen(false)} 
        />
      )}
    </div>
  );
};
