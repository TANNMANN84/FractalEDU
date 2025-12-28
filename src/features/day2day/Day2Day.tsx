import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Calendar, BookOpen, CheckSquare, Clock, MapPin } from 'lucide-react';
import { TimetableEditor } from './components/TimetableEditor';
import { Daybook } from './components/DayBook';
import { useAppStore } from '@/store';

export const Day2Day: React.FC = () => {
  const { schoolStructure, classes } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timetable' | 'daybook' | 'notes'>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate Today's Schedule
  const todaySchedule = useMemo(() => {
    if (!schoolStructure) return null;

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    let currentWeek: 'A' | 'B' | null = null;

    if (schoolStructure.cycle === 'Fortnightly' && schoolStructure.termStartDate) {
        // Normalize start date to Monday to ensure alignment
        const [y, m, d] = schoolStructure.termStartDate.split('-').map(Number);
        const start = new Date(y, m - 1, d);
        const day = start.getDay();
        const diff = day === 0 ? 1 : 1 - day;
        start.setDate(start.getDate() + diff);

        const now = new Date();
        now.setHours(0,0,0,0);
        
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round((now.getTime() - start.getTime()) / oneDay);
        
        // If start date is in future, default to A
        if (diffDays < 0) {
            currentWeek = 'A';
        } else {
            const weeksPassed = Math.floor(diffDays / 7);
            currentWeek = weeksPassed % 2 === 0 ? 'A' : 'B';
        }
    }

    return schoolStructure.days.find(d => 
        d.day === dayName && 
        (schoolStructure.cycle === 'Weekly' || d.week === currentWeek)
    );
  }, [schoolStructure]);

  const tabs = [
    { id: 'dashboard', label: 'My Day', icon: LayoutDashboard },
    { id: 'timetable', label: 'My Timetable', icon: Calendar },
    { id: 'daybook', label: 'My Daybook', icon: BookOpen },
    { id: 'notes', label: 'My Notes & Reminders', icon: CheckSquare },
  ] as const;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Day2Day Organizer</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your daily schedule, lessons, and tasks.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 min-h-0 overflow-auto animate-in fade-in duration-300">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder Dashboard Widgets */}
            <div className="bg-white dark:bg-slate-900 p-0 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Today's Schedule</h3>
                  {todaySchedule?.week && (
                      <span className="text-xs font-bold px-2 py-1 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 rounded">
                          Week {todaySchedule.week}
                      </span>
                  )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {todaySchedule ? (
                      todaySchedule.slots.map((slot, idx) => {
                          const assignedClass = classes.find(c => c.id === slot.classId);
                          const isNow = currentTime.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5) >= slot.startTime && 
                                        currentTime.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5) < slot.endTime;

                          return (
                              <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                  isNow 
                                    ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800 ring-1 ring-brand-200 dark:ring-brand-800' 
                                    : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                              }`}>
                                  <div className="flex flex-col items-center justify-center w-14 shrink-0">
                                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{slot.startTime}</span>
                                      <div className="w-px h-2 bg-slate-200 dark:bg-slate-700 my-0.5"></div>
                                      <span className="text-[10px] text-slate-400">{slot.endTime}</span>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                      {assignedClass ? (
                                          <>
                                              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{assignedClass.name}</div>
                                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                  <span>{assignedClass.subject}</span>
                                                  {assignedClass.yearLevel && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">Yr {assignedClass.yearLevel}</span>}
                                              </div>
                                          </>
                                      ) : (
                                          <div className="font-medium text-slate-500 dark:text-slate-400 text-sm">{slot.name}</div>
                                      )}
                                  </div>
                              </div>
                          );
                      })
                  ) : (
                      <div className="text-center py-8 text-slate-400 italic text-sm">No schedule found for today.</div>
                  )}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Quick Tasks</h3>
              <div className="text-slate-500 text-sm italic">No pending tasks.</div>
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <TimetableEditor />
        )}

        {activeTab === 'daybook' && (
          <Daybook />
        )}

        {activeTab === 'notes' && (
          <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
            <div className="text-center text-slate-500">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Notes & Reminders Coming Soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};