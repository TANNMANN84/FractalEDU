import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Calendar, BookOpen, CheckSquare, Clock, MapPin, Bell, Trash2 } from 'lucide-react';
import { TimetableEditor } from './components/TimetableEditor';
import { Daybook } from './components/DayBook';
import { useAppStore } from '@/store';
import { DaybookModal } from './components/DaybookModal';
import { TimeSlot, DaybookEntry } from '@/types';

export const Day2Day: React.FC = () => {
  const { schoolStructure, classes, daybookEntries, students, setDaybookEntry } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timetable' | 'daybook' | 'notes'>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingReminder, setEditingReminder] = useState<{date: string, slot: TimeSlot, initialTab?: 'students' | 'tasks', focusId?: string} | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

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

  // Calculate Reminders
  const reminders = useMemo(() => {
    const allReminders: any[] = [];

    // Helper to find class info
    const getClassInfo = (slotId: string) => {
        if (!schoolStructure) return { name: 'General', subject: '' };
        for (const day of schoolStructure.days) {
            const slot = day.slots.find(s => s.id === slotId);
            if (slot) {
                if (slot.classId) {
                    const cls = classes.find(c => c.id === slot.classId);
                    if (cls) return { name: cls.name, subject: cls.subject };
                }
                return { name: slot.name, subject: '' };
            }
        }
        return { name: 'General', subject: '' };
    };

    daybookEntries.forEach((entry: DaybookEntry) => {
        const { name: className, subject } = getClassInfo(entry.slotId);

        // Student Reminders
        if (entry.taggedStudents) {
            entry.taggedStudents.forEach(ts => {
                if (ts.reminder) {
                    const student = students.find(s => s.id === ts.studentId);
                    allReminders.push({
                        ...ts.reminder,
                        studentName: student?.name || 'Unknown Student',
                        className,
                        subject,
                        entryDate: entry.date,
                        entryId: entry.id,
                        targetId: ts.studentId, // ID to focus on
                        slotId: entry.slotId,
                        type: 'student'
                    });
                }
            });
        }
        // General Reminders
        if (entry.generalReminders) {
            entry.generalReminders.forEach(gr => {
                allReminders.push({
                    ...gr,
                    studentName: 'General Task',
                    className,
                    subject,
                    entryDate: entry.date,
                    entryId: entry.id,
                    targetId: gr.id, // ID to focus on
                    slotId: entry.slotId,
                    type: 'general'
                });
            });
        }
    });
    return allReminders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [daybookEntries, students, schoolStructure, classes]);

  const findSlot = (slotId: string) => {
      if (!schoolStructure) return undefined;
      for (const day of schoolStructure.days) {
          const slot = day.slots.find(s => s.id === slotId);
          if (slot) return slot;
      }
      return undefined;
  };

  const handleReminderClick = (reminder: any) => {
      const slot = findSlot(reminder.slotId);
      if (slot) {
          setEditingReminder({ 
              date: reminder.entryDate, 
              slot,
              initialTab: reminder.type === 'student' ? 'students' : 'tasks',
              focusId: reminder.targetId
          });
      }
  };

  const toggleReminderComplete = (e: React.MouseEvent, reminder: any) => {
      e.stopPropagation();
      e.preventDefault();
      
      const originalEntry = daybookEntries.find(d => d.id === reminder.entryId);
      if (!originalEntry) return;

      // Create a shallow copy of the entry
      const updatedEntry: DaybookEntry = { ...originalEntry };
      let changed = false;

      if (reminder.type === 'student' && originalEntry.taggedStudents) {
          updatedEntry.taggedStudents = originalEntry.taggedStudents.map(ts => {
              if (ts.studentId === reminder.targetId && ts.reminder) {
                  changed = true;
                  return {
                      ...ts,
                      reminder: { ...ts.reminder, completed: !ts.reminder.completed }
                  };
              }
              return ts;
          });
      } else if (reminder.type === 'general' && originalEntry.generalReminders) {
          updatedEntry.generalReminders = originalEntry.generalReminders.map(gr => {
              if (gr.id === reminder.targetId) {
                  changed = true;
                  return { ...gr, completed: !gr.completed };
              }
              return gr;
          });
      }

      if (changed) {
          setDaybookEntry(updatedEntry);
      }
  };

  const deleteReminder = (e: React.MouseEvent, reminder: any) => {
      e.stopPropagation();
      e.preventDefault();
      
      const originalEntry = daybookEntries.find(d => d.id === reminder.entryId);
      if (!originalEntry) return;

      const updatedEntry: DaybookEntry = { ...originalEntry };
      let changed = false;

      if (reminder.type === 'student' && originalEntry.taggedStudents) {
          updatedEntry.taggedStudents = originalEntry.taggedStudents.map(ts => {
              if (ts.studentId === reminder.targetId) {
                  changed = true;
                  // Return new object without the reminder property
                  const { reminder, ...rest } = ts;
                  return rest;
              }
              return ts;
          });
      } else if (reminder.type === 'general' && originalEntry.generalReminders) {
          const initialLen = originalEntry.generalReminders.length;
          updatedEntry.generalReminders = originalEntry.generalReminders.filter(gr => gr.id !== reminder.targetId);
          if (updatedEntry.generalReminders.length !== initialLen) changed = true;
      }

      if (changed) {
          setDaybookEntry(updatedEntry);
      }
  };

  const tabs = [
    { id: 'dashboard', label: 'My Day', icon: LayoutDashboard },
    { id: 'timetable', label: 'My Timetable', icon: Calendar },
    { id: 'daybook', label: 'My Daybook', icon: BookOpen },
    { id: 'notes', label: 'My Notes & Reminders', icon: CheckSquare },
  ] as const;

  const activeReminders = reminders.filter(r => !r.completed);
  const visibleReminders = showCompleted ? reminders : activeReminders;

  // Group reminders by date
  const groupedReminders = useMemo(() => {
      const groups = {
          overdue: [] as any[],
          today: [] as any[],
          tomorrow: [] as any[],
          upcoming: [] as any[]
      };
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      visibleReminders.forEach(r => {
          const d = new Date(r.date);
          d.setHours(0,0,0,0);
          
          if (d < today) groups.overdue.push(r);
          else if (d.getTime() === today.getTime()) groups.today.push(r);
          else if (d.getTime() === tomorrow.getTime()) groups.tomorrow.push(r);
          else groups.upcoming.push(r);
      });
      
      return groups;
  }, [visibleReminders]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Day2Day Organiser</h1>
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
              <div className="space-y-3">
                  {activeReminders.slice(0, 5).map((reminder) => (
                      <div 
                          key={`${reminder.entryId}-${reminder.targetId}`} 
                          onClick={() => handleReminderClick(reminder)}
                          className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group"
                      >
                          <button
                              onClick={(e) => toggleReminderComplete(e, reminder)}
                              className="mt-0.5 text-amber-600 hover:text-amber-800 dark:text-amber-500 dark:hover:text-amber-300"
                              title="Mark as complete"
                          >
                              <CheckSquare className="w-4 h-4" />
                          </button>
                          <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">{reminder.text}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                                  <span className="font-medium text-brand-600 dark:text-brand-400">{reminder.className}</span>
                                  <span>•</span>
                                  {reminder.type === 'student' ? (
                                      <>For: <span className="font-medium">{reminder.studentName}</span></>
                                  ) : (
                                      <span>General Task</span>
                                  )}
                                  <span className="opacity-50">• {new Date(reminder.date).toLocaleDateString()}</span>
                              </p>
                          </div>
                      </div>
                  ))}
                  {activeReminders.length === 0 && (
                      <div className="text-slate-500 text-sm italic">No pending tasks.</div>
                  )}
              </div>
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Bell className="w-5 h-5" /> {showCompleted ? 'All Reminders' : 'Active Reminders'}
                </h3>
                <button 
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${showCompleted ? 'bg-brand-100 text-brand-700 border-brand-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    {showCompleted ? 'Hide Completed' : 'Show Completed'}
                </button>
            </div>
            
            <div className="space-y-8">
                {(['overdue', 'today', 'tomorrow', 'upcoming'] as const).map(groupKey => {
                    const group = groupedReminders[groupKey];
                    if (group.length === 0) return null;
                    
                    const colors = {
                        overdue: 'text-red-600 dark:text-red-400',
                        today: 'text-brand-600 dark:text-brand-400',
                        tomorrow: 'text-amber-600 dark:text-amber-400',
                        upcoming: 'text-slate-600 dark:text-slate-400'
                    };

                    return (
                        <div key={groupKey}>
                            <h4 className={`font-bold text-xs uppercase tracking-wider mb-3 ${colors[groupKey]}`}>
                                {groupKey} ({group.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.map((reminder) => (
                                    <div 
                                        key={`${reminder.entryId}-${reminder.targetId}`} 
                                        onClick={() => handleReminderClick(reminder)}
                                        className={`p-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm cursor-pointer transition-all group flex flex-col ${
                                            reminder.completed 
                                                ? 'border-slate-200 dark:border-slate-700 opacity-60' 
                                                : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                                new Date(reminder.date).getTime() < new Date().setHours(0,0,0,0) && !reminder.completed
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {new Date(reminder.date).toLocaleDateString()}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => deleteReminder(e, reminder)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Delete Reminder"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => toggleReminderComplete(e, reminder)}
                                                    className="text-slate-400 hover:text-green-600 transition-colors"
                                                    title={reminder.completed ? "Mark as incomplete" : "Mark as complete"}
                                                >
                                                    <CheckSquare className={`w-4 h-4 ${reminder.completed ? 'text-green-600 fill-green-100' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1">
                                            <p className={`font-medium text-slate-800 dark:text-slate-200 mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 ${reminder.completed ? 'line-through' : ''}`}>{reminder.text}</p>
                                            
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                                <span className="font-bold text-brand-600 dark:text-brand-400">{reminder.className}</span>
                                                {reminder.subject && <span>• {reminder.subject}</span>}
                                            </div>
                                        </div>

                                        {reminder.type === 'student' && (
                                            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {reminder.studentName.charAt(0)}
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{reminder.studentName}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {visibleReminders.length === 0 && <p className="text-slate-500 italic">No reminders found.</p>}
            </div>
          </div>
        )}

        {editingReminder && (
            <DaybookModal
                date={editingReminder.date}
                slot={editingReminder.slot}
                initialTab={editingReminder.initialTab}
                focusId={editingReminder.focusId}
                onClose={() => setEditingReminder(null)}
            />
        )}
      </div>
    </div>
  );
};