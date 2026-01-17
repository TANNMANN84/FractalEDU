import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Save, Paperclip, Users, FileText, Plus, Calendar, Trash2, ChevronDown, ChevronUp, File, CheckSquare, ArrowRight, Copy } from 'lucide-react';
import { useAppStore } from '@/store';
import { TimeSlot, TaggedStudent, FileUpload, GeneralReminder, DaybookEntry } from '@/types';
import { MonitoringFileUpload } from '../../monitoring/components/MonitoringFileUpload';

interface DaybookModalProps {
    date: string;
    slot: TimeSlot;
    onClose: () => void;
    initialTab?: 'content' | 'resources' | 'students' | 'tasks';
    focusId?: string;
}

export const DaybookModal: React.FC<DaybookModalProps> = ({ date, slot, onClose, initialTab = 'content', focusId }) => {
    const { daybookEntries, setDaybookEntry, classes, students, addEvidence, addToast, schoolStructure } = useAppStore();
    const entry = daybookEntries.find(e => e.date === date && e.slotId === slot.id);
    
    const [content, setContent] = useState(entry?.content || '');
    const [taggedStudents, setTaggedStudents] = useState<TaggedStudent[]>(entry?.taggedStudents || []);
    const [resources, setResources] = useState<FileUpload[]>(entry?.resources || []);
    const [generalReminders, setGeneralReminders] = useState<GeneralReminder[]>(entry?.generalReminders || []);
    const [activeTab, setActiveTab] = useState<'content' | 'resources' | 'students' | 'tasks'>(initialTab);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentsToLog, setStudentsToLog] = useState<Set<string>>(new Set());
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDate, setNewTaskDate] = useState(date);
    const [futureTaskText, setFutureTaskText] = useState('');
    const [selectedFutureLesson, setSelectedFutureLesson] = useState<string>('');

    const assignedClass = classes.find(c => c.id === slot.classId);

    // Scroll to focused item on mount
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (focusId && scrollRef.current) {
            const el = document.getElementById(`item-${focusId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2');
                setTimeout(() => el.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2'), 2000);
            }
        }
    }, [focusId, activeTab]);

    // Filter students by class if assigned, otherwise show all
    const availableStudents = useMemo(() => {
        if (assignedClass) {
            return students.filter(s => assignedClass.studentIds.includes(s.id));
        }
        return students;
    }, [students, assignedClass]);

    // Calculate Upcoming Lessons for this class
    const upcomingLessons = useMemo(() => {
        if (!assignedClass || !schoolStructure) return [];
        
        const results: { date: string; slot: TimeSlot; label: string }[] = [];
        const checkDate = new Date(date);
        
        // Helper to get week A/B
        const getWeek = (d: Date) => {
             if (schoolStructure.cycle === 'Weekly') return null;
             if (!schoolStructure.termStartDate) return 'A';
             
             const [y, m, day] = schoolStructure.termStartDate.split('-').map(Number);
             const start = new Date(y, m - 1, day);
             const sDay = start.getDay();
             const sDiff = sDay === 0 ? 1 : 1 - sDay;
             start.setDate(start.getDate() + sDiff);
             start.setHours(0,0,0,0);
             
             const now = new Date(d);
             now.setHours(0,0,0,0);
             const diffTime = now.getTime() - start.getTime();
             const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
             if (diffDays < 0) return 'A';
             const weeks = Math.floor(diffDays / 7);
             return weeks % 2 === 0 ? 'A' : 'B';
        };

        // Look ahead 60 days
        for (let i = 1; i <= 60; i++) {
            const d = new Date(checkDate);
            d.setDate(d.getDate() + i);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
            const week = getWeek(d);
            
            const daySched = schoolStructure.days.find(ds => ds.day === dayName && (schoolStructure.cycle === 'Weekly' || ds.week === week));
            if (daySched) {
                daySched.slots.forEach(s => {
                    if (s.classId === assignedClass.id) {
                        results.push({ date: d.toISOString().split('T')[0], slot: s, label: `${d.toLocaleDateString()} - ${s.name}` });
                    }
                });
            }
            if (results.length >= 5) break;
        }
        return results;
    }, [assignedClass, schoolStructure, date]);

    const handleSave = () => {
        setDaybookEntry({
            id: entry?.id || crypto.randomUUID(),
            date,
            slotId: slot.id,
            content,
            taggedStudents,
            resources,
            generalReminders
        });

        // Process evidence logging
        let loggedCount = 0;
        taggedStudents.forEach(ts => {
            if (studentsToLog.has(ts.studentId)) {
                const student = students.find(s => s.id === ts.studentId);
                if (student) {
                    const parts = [];
                    if (ts.note) parts.push(`Note: ${ts.note}`);
                    if (ts.differentiation?.extension) parts.push(`Extension: ${ts.differentiation.extension}`);
                    if (ts.differentiation?.support) parts.push(`Support: ${ts.differentiation.support}`);
                    if (ts.differentiation?.adjustments) parts.push(`Adjustments: ${ts.differentiation.adjustments}`);

                    if (parts.length > 0) {
                        addEvidence(student.id, {
                            id: crypto.randomUUID(),
                            date: new Date().toISOString(),
                            type: 'Learning Support',
                            content: `**Daybook Lesson: ${new Date(date).toLocaleDateString()}**\n${parts.join('\n')}`,
                            author: 'Teacher',
                            tags: ['Daybook', 'Differentiation']
                        });
                        loggedCount++;
                    }
                }
            }
        });

        if (loggedCount > 0 && addToast) addToast(`Logged evidence for ${loggedCount} student(s).`, 'success');
        onClose();
    };

    const addStudent = () => {
        if (!selectedStudentId) return;
        if (taggedStudents.find(s => s.studentId === selectedStudentId)) return;

        setTaggedStudents([...taggedStudents, { 
            studentId: selectedStudentId,
            differentiation: { extension: '', support: '', adjustments: '' }
        }]);
        setSelectedStudentId('');
    };

    const removeStudent = (id: string) => {
        setTaggedStudents(taggedStudents.filter(s => s.studentId !== id));
    };

    const updateStudentData = (id: string, field: keyof TaggedStudent, value: any) => {
        setTaggedStudents(prev => prev.map(s => s.studentId === id ? { ...s, [field]: value } : s));
    };

    const updateDifferentiation = (id: string, field: string, value: string) => {
        setTaggedStudents(prev => prev.map(s => 
            s.studentId === id ? { 
                ...s, 
                differentiation: { ...s.differentiation, [field]: value } 
            } : s
        ));
    };

    const updateReminder = (id: string, field: string, value: any) => {
        setTaggedStudents(prev => prev.map(s => {
            if (s.studentId !== id) return s;
            const currentReminder = s.reminder || { date: new Date().toISOString().split('T')[0], text: '', completed: false };
            return { ...s, reminder: { ...currentReminder, [field]: value } };
        }));
    };

    const removeStudentReminder = (id: string) => {
        setTaggedStudents(prev => prev.map(s => {
            if (s.studentId !== id) return s;
            // Destructure to remove reminder property
            const { reminder, ...rest } = s;
            return rest;
        }));
    };

    const toggleLogToProfile = (id: string) => {
        const next = new Set(studentsToLog);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setStudentsToLog(next);
    };

    const handleAddResource = (file: FileUpload) => {
        setResources([...resources, file]);
    };

    const handleRemoveResource = (id: string) => {
        setResources(resources.filter(r => r.id !== id));
    };

    const addGeneralReminder = () => {
        if (!newTaskText.trim()) return;
        setGeneralReminders([...generalReminders, {
            id: crypto.randomUUID(),
            text: newTaskText,
            date: newTaskDate,
            completed: false
        }]);
        setNewTaskText('');
    };

    const toggleGeneralReminder = (id: string) => {
        setGeneralReminders(generalReminders.map(r => 
            r.id === id ? { ...r, completed: !r.completed } : r
        ));
    };

    const removeGeneralReminder = (id: string) => {
        setGeneralReminders(generalReminders.filter(r => r.id !== id));
    };

    const handleAddFutureTask = () => {
        if (!futureTaskText || !selectedFutureLesson) return;
        const [fDate, fSlotId] = selectedFutureLesson.split('|');
        
        const existingEntry = daybookEntries.find(e => e.date === fDate && e.slotId === fSlotId);
        const newReminder: GeneralReminder = {
            id: crypto.randomUUID(),
            text: futureTaskText,
            date: fDate,
            completed: false
        };

        const newEntry: DaybookEntry = {
            id: existingEntry?.id || crypto.randomUUID(),
            date: fDate,
            slotId: fSlotId,
            content: existingEntry?.content || '',
            taggedStudents: existingEntry?.taggedStudents || [],
            resources: existingEntry?.resources || [],
            generalReminders: [...(existingEntry?.generalReminders || []), newReminder]
        };

        setDaybookEntry(newEntry);
        addToast('Task added to future lesson', 'success');
        setFutureTaskText('');
        setSelectedFutureLesson('');
    };

    const handleCopyContentToNext = () => {
        if (upcomingLessons.length === 0) {
            addToast('No upcoming lessons found', 'error');
            return;
        }
        const next = upcomingLessons[0];
        const existingEntry = daybookEntries.find(e => e.date === next.date && e.slotId === next.slot.id);
        
        const newEntry: DaybookEntry = {
            ...existingEntry,
            id: existingEntry?.id || crypto.randomUUID(),
            date: next.date,
            slotId: next.slot.id,
            content: existingEntry?.content ? existingEntry.content + '\n\n' + content : content,
        } as DaybookEntry;
        
        setDaybookEntry(newEntry);
        addToast(`Lesson plan copied to ${next.label}`, 'success');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-950">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">
                                {assignedClass ? assignedClass.name : slot.name}
                            </h3>
                            {assignedClass && (
                                <span className="px-2 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 rounded text-xs font-bold">
                                    {assignedClass.subject}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="font-medium">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span>{slot.startTime} - {slot.endTime}</span>
                            {slot.room && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                    <span>Room {slot.room}</span>
                                </>
                            )}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2">
                    {[
                        { id: 'content', label: 'Lesson Plan', icon: FileText },
                        { id: 'resources', label: 'Resources', icon: Paperclip },
                        { id: 'students', label: 'Students', icon: Users },
                        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50" ref={scrollRef}>
                    {activeTab === 'content' && (
                        <div className="h-full flex flex-col space-y-4">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="flex-1 w-full bg-transparent border-none focus:ring-0 outline-none resize-none text-base leading-relaxed text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                                    placeholder="Describe your lesson plan, learning intentions, and success criteria..."
                                    autoFocus
                                />
                            </div>
                            {upcomingLessons.length > 0 && (
                                <div className="flex justify-end">
                                    <button onClick={handleCopyContentToNext} className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium" title="Copy this lesson plan to the next scheduled lesson"><Copy className="w-3 h-3" /> Copy to Next Lesson</button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'resources' && (
                        <div className="space-y-4">
                            <MonitoringFileUpload 
                                label="Upload Resource" 
                                file={null} 
                                onUpload={handleAddResource} 
                                onRemove={() => {}} 
                            />
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 mb-1">Experiment Preparation</h4>
                                <p className="text-xs text-blue-600 dark:text-blue-400">Link risk assessments and equipment lists here.</p>
                            </div>

                            <div className="space-y-2">
                                {resources.map(res => (
                                    <div key={res.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                <File className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{res.name}</span>
                                        </div>
                                        <button onClick={() => handleRemoveResource(res.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {resources.length === 0 && (
                                    <p className="text-center text-slate-400 text-sm py-4">No resources attached.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2 flex-1 max-w-md">
                                    <select 
                                        value={selectedStudentId}
                                        onChange={(e) => setSelectedStudentId(e.target.value)}
                                        className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                    >
                                        <option value="">Select Student...</option>
                                        {availableStudents.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={addStudent}
                                        disabled={!selectedStudentId}
                                        className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {taggedStudents.map(ts => {
                                    const student = students.find(s => s.id === ts.studentId);
                                    if (!student) return null;

                                    return (
                                        <div key={ts.studentId} id={`item-${ts.studentId}`} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-all duration-300">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-brand-500" /> {student.name}
                                                </h4>
                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-brand-600 transition-colors" title="Save these notes to the student's permanent profile">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={studentsToLog.has(ts.studentId)}
                                                            onChange={() => toggleLogToProfile(ts.studentId)}
                                                            className="rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                                                        />
                                                        Log to Profile
                                                    </label>
                                                    <button onClick={() => removeStudent(ts.studentId)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase">Differentiation & Notes</label>
                                                    <textarea 
                                                        className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                                                        placeholder="General notes..."
                                                        value={ts.note || ''}
                                                        onChange={e => updateStudentData(ts.studentId, 'note', e.target.value)}
                                                    />
                                                    <input 
                                                        className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                                                        placeholder="Extension strategies..."
                                                        value={ts.differentiation?.extension || ''}
                                                        onChange={e => updateDifferentiation(ts.studentId, 'extension', e.target.value)}
                                                    />
                                                    <input 
                                                        className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                                                        placeholder="Support strategies..."
                                                        value={ts.differentiation?.support || ''}
                                                        onChange={e => updateDifferentiation(ts.studentId, 'support', e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" /> Reminder / Follow Up
                                                        {ts.reminder && (
                                                            <button onClick={() => removeStudentReminder(ts.studentId)} className="ml-auto text-[10px] text-red-500 hover:underline">Clear</button>
                                                        )}
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="date" 
                                                            className="p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                                                            value={ts.reminder?.date || ''}
                                                            onChange={e => updateReminder(ts.studentId, 'date', e.target.value)}
                                                        />
                                                        <input 
                                                            type="text" 
                                                            className="flex-1 p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                                                            placeholder="Reminder text..."
                                                            value={ts.reminder?.text || ''}
                                                            onChange={e => updateReminder(ts.studentId, 'text', e.target.value)}
                                                        />
                                                    </div>
                                                    {ts.reminder?.text && (
                                                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={ts.reminder.completed}
                                                                onChange={e => updateReminder(ts.studentId, 'completed', e.target.checked)}
                                                                className="rounded text-brand-600 focus:ring-brand-500"
                                                            />
                                                            Mark as Completed
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {taggedStudents.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No students tagged. Select a student above to add notes or differentiation.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="space-y-6">
                            {upcomingLessons.length > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4" /> Push to Future Lesson
                                    </h4>
                                    <div className="space-y-2">
                                        <select 
                                            value={selectedFutureLesson}
                                            onChange={e => setSelectedFutureLesson(e.target.value)}
                                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                        >
                                            <option value="">Select Upcoming Lesson...</option>
                                            {upcomingLessons.map((l, i) => (
                                                <option key={i} value={`${l.date}|${l.slot.id}`}>{l.label}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={futureTaskText}
                                                onChange={e => setFutureTaskText(e.target.value)}
                                                placeholder="Task for future lesson..."
                                                className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                                disabled={!selectedFutureLesson}
                                            />
                                            <button onClick={handleAddFutureTask} disabled={!selectedFutureLesson || !futureTaskText} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold text-sm hover:bg-brand-700 disabled:opacity-50">Push</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3">Add General Task</h4>
                                <div className="flex gap-2">
                                    <input 
                                        type="date" 
                                        value={newTaskDate}
                                        onChange={e => setNewTaskDate(e.target.value)}
                                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                    />
                                    <input 
                                        type="text" 
                                        value={newTaskText}
                                        onChange={e => setNewTaskText(e.target.value)}
                                        placeholder="Task description..."
                                        className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                        onKeyDown={e => e.key === 'Enter' && addGeneralReminder()}
                                    />
                                    <button onClick={addGeneralReminder} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold text-sm hover:bg-brand-700">Add</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {generalReminders.map(task => (
                                    <div key={task.id} id={`item-${task.id}`} className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border rounded-lg transition-all ${task.completed ? 'border-green-200 bg-green-50/50 opacity-75' : 'border-slate-200 dark:border-slate-700'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={task.completed}
                                            onChange={() => toggleGeneralReminder(task.id)}
                                            className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                                        />
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{task.text}</p>
                                            <p className="text-xs text-slate-400">Due: {new Date(task.date).toLocaleDateString()}</p>
                                        </div>
                                        <button onClick={() => removeGeneralReminder(task.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                {generalReminders.length === 0 && <p className="text-center text-slate-400 text-sm py-8 italic">No general tasks for this lesson.</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                    <div className="text-xs text-slate-400">
                        {content.length} characters
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors text-sm">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 shadow-sm transition-colors flex items-center gap-2 text-sm">
                            <Save className="w-4 h-4" /> Save Entry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
