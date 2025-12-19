
import React, { useMemo } from 'react';
import { Search, Filter, CheckCircle2, Circle } from 'lucide-react';
import { Student, ClassGroup, RapidResult } from '@/types';

interface MarkingSidebarProps {
  students: Student[];
  classes: ClassGroup[];
  results: RapidResult[];
  testId: string;
  testType: 'pre' | 'post';
  selectedStudentId: string;
  selectedClassId: string;
  onSelectStudent: (id: string) => void;
  onSelectClass: (id: string) => void;
}

export const MarkingSidebar: React.FC<MarkingSidebarProps> = ({
  students,
  classes,
  results,
  testId,
  testType,
  selectedStudentId,
  selectedClassId,
  onSelectStudent,
  onSelectClass
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredStudents = useMemo(() => {
    let list = students;
    
    // Filter by Class
    if (selectedClassId !== 'all') {
      const cls = classes.find(c => c.id === selectedClassId);
      if (cls) {
        list = list.filter(s => cls.studentIds.includes(s.id));
      } else {
        list = [];
      }
    }

    // Filter by Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(term));
    }

    // Sort alphabetically
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, classes, selectedClassId, searchTerm]);

  const getStatus = (studentId: string) => {
    const result = results.find(r => r.studentId === studentId && r.testId === testId);
    if (!result) return 'none';
    
    const scores = testType === 'pre' ? result.preTestScores : result.postTestScores;
    // Simple logic: if any score recorded, mark as done/in-progress
    const hasData = Object.keys(scores || {}).length > 0;
    return hasData ? 'done' : 'none';
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full text-slate-700 shrink-0">
      
      {/* Header / Filter */}
      <div className="p-4 border-b border-slate-200 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Class Filter</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={(e) => onSelectClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Students</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
           <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {filteredStudents.map(student => {
            const status = getStatus(student.id);
            const isSelected = selectedStudentId === student.id;

            return (
              <button
                key={student.id}
                onClick={() => onSelectStudent(student.id)}
                className={`
                  w-full flex items-center justify-between p-3 rounded-lg text-left transition-all
                  ${isSelected ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'hover:bg-slate-50 text-slate-600 border border-transparent'}
                `}
              >
                <div className="flex items-center gap-3">
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                        ${isSelected ? 'bg-brand-200 text-brand-700' : 'bg-slate-100 text-slate-500 border border-slate-200'}
                    `}>
                        {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[140px]">{student.name}</span>
                </div>
                {status === 'done' && <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-green-500'}`} />}
                {status === 'none' && <Circle className="w-4 h-4 text-slate-300" />}
              </button>
            );
          })}
          {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                  No students found.
              </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between">
         <span>{filteredStudents.length} Students</span>
         <span>{filteredStudents.filter(s => getStatus(s.id) === 'done').length} Completed</span>
      </div>

    </div>
  );
};
