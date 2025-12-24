import React, { useState, useMemo } from 'react';

import { useAppStore } from '@/store';

import { Layout, Users, ChevronRight, Plus } from 'lucide-react';

import { ClassGroup } from '@/types';

import { ClassDetailView } from './ClassDetailView';

import { CreateClassModal } from '../admin/CreateClassModal';



export const Classes: React.FC = () => {

  const classes = useAppStore((state) => state.classes);

  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const groupedClasses = useMemo(() => {
    const groups: Record<string, typeof classes> = {};
    
    classes.forEach((cls) => {
      // Cast to any to access potential yearGroup property if not in type
      const c = cls as any;
      
      // 1. Try explicit properties (expand search to common variations)
      let year = c.yearGroup || c.year || c.yearLevel || c.grade;

      // 2. Fallback: Try to extract from class name (e.g. "Year 10 Science", "10A", "7B")
      if (!year && c.name) {
        const yearMatch = c.name.match(/(?:Year|Yr|Grade)\s*(\d{1,2})/i);
        if (yearMatch) {
          year = yearMatch[1];
        } else {
          const leadingMatch = c.name.match(/^(\d{1,2})/);
          if (leadingMatch) year = leadingMatch[1];
        }
      }

      const groupKey = year || 'Other';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(cls);
    });

    // Sort keys (years) numerically
    return Object.entries(groups).sort((a, b) => {
      const yearA = parseInt(a[0].replace(/\D/g, '')) || 999;
      const yearB = parseInt(b[0].replace(/\D/g, '')) || 999;
      return yearA - yearB;
    });
  }, [classes]);



  if (selectedClass) {

    return <ClassDetailView classGroup={selectedClass} onBack={() => setSelectedClass(null)} />;

  }



  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-slate-800">Class Management</h2>

          <p className="text-slate-500">Class and student management. Seating Plans, Student Profiles and profiling, program registration and evidence logging.</p>

        </div>

        <button

          onClick={() => setIsCreateModalOpen(true)}

          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium"

        >

          <Plus className="w-4 h-4" />

          New Class

        </button>

      </div>

      {classes.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">

             <Layout className="w-12 h-12 mb-3 opacity-20" />

             <p>No classes found.</p>

             <button onClick={() => setIsCreateModalOpen(true)} className="mt-2 text-brand-600 hover:underline">Create your first class</button>

          </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6 items-start">
          {groupedClasses.map(([year, classList]) => (
            <div key={year} className="min-w-[320px] w-80 flex-shrink-0 flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 h-fit border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                  {year.toString().startsWith('Year') ? year : `Year ${year}`}
                </h3>
                <span className="text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full">
                  {classList.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {classList.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-brand-200 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Layout className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">{cls.name}</h3>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{cls.subject}</p>
                        </div>
                      </div>
                    </div>
                  
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {cls.studentIds.length} Students
                      </span>
                      <span className="flex items-center text-brand-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}



      {isCreateModalOpen && <CreateClassModal onClose={() => setIsCreateModalOpen(false)} />}

    </div>

  );

};