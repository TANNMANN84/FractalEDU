import React, { useState } from 'react';

import { useAppStore } from '@/store';

import { Layout, Users, ChevronRight, Plus } from 'lucide-react';

import { ClassGroup } from '@/types';

import { ClassDetailView } from './ClassDetailView';

import { CreateClassModal } from '../admin/CreateClassModal';



export const Classes: React.FC = () => {

  const classes = useAppStore((state) => state.classes);

  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);



  if (selectedClass) {

    return <ClassDetailView classGroup={selectedClass} onBack={() => setSelectedClass(null)} />;

  }



  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-slate-800">Class Management</h2>

          <p className="text-slate-500">Organize seating plans and class lists.</p>

        </div>

        <button

          onClick={() => setIsCreateModalOpen(true)}

          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium"

        >

          <Plus className="w-4 h-4" />

          New Class

        </button>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {classes.map((cls) => (

          <div

            key={cls.id}

            onClick={() => setSelectedClass(cls)}

            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group cursor-pointer"

          >

            <div className="flex items-center justify-between mb-4">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">

                  <Layout className="w-6 h-6" />

                </div>

                <div>

                  <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-lg">{cls.name}</h3>

                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{cls.subject}</p>

                </div>

              </div>

            </div>

           

            <div className="flex items-center justify-between text-sm text-slate-500 border-t border-slate-100 pt-4 mt-2">

              <span className="flex items-center gap-2">

                <Users className="w-4 h-4" />

                {cls.studentIds.length} Students

              </span>

              <span className="flex items-center text-brand-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">

                Manage <ChevronRight className="w-4 h-4" />

              </span>

            </div>

          </div>

        ))}



        {classes.length === 0 && (

          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">

             <Layout className="w-12 h-12 mb-3 opacity-20" />

             <p>No classes found.</p>

             <button onClick={() => setIsCreateModalOpen(true)} className="mt-2 text-brand-600 hover:underline">Create your first class</button>

          </div>

        )}

      </div>



      {isCreateModalOpen && <CreateClassModal onClose={() => setIsCreateModalOpen(false)} />}

    </div>

  );

};