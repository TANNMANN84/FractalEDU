
import React, { useState } from 'react';
import { StudentList } from './StudentList';
import { StudentDossier } from './components/StudentDossier';
import { Student } from '@/types';

export const Profiler: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Profiler</h2>
          <p className="text-slate-500">View strategies, NCCD evidence, and learning profiles.</p>
        </div>
        {/* "Add Student" is handled in the Admin Console */}
      </div>

      <StudentList onSelectStudent={setSelectedStudent} />

      {selectedStudent && (
        <StudentDossier 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
};
