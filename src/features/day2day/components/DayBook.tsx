import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlignJustify, Columns, MapPin } from 'lucide-react';
import { useAppStore } from '@/store';
import { DaySchedule, TimeSlot } from '@/types';

export const Daybook: React.FC = () => {
    const { schoolStructure, classes, daybookEntries, setDaybookEntry } = useAppStore();
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper: Get Monday of the current view's week
    const getMonday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(date.setDate(diff));
    };

    // Helper: Get Cycle Week (A/B) for a specific date
    const getCycleWeek = (date: Date): 'A' | 'B' | null => {
        if (!schoolStructure || schoolStructure.cycle === 'Weekly' || !schoolStructure.termStartDate) return null;
        
        const [y, m, d] = schoolStructure.termStartDate.split('-').map(Number);
        const termStart = new Date(y, m - 1, d);
        // Normalize to Monday
        const dayOfWeek = termStart.getDay();
        const diff = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
        termStart.setDate(termStart.getDate() + diff);
        termStart.setHours(0,0,0,0);

        const checkDate = new Date(date);
        checkDate.setHours(0,0,0,0);

        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round((checkDate.getTime() - termStart.getTime()) / oneDay);
        
        if (diffDays < 0) return 'A'; // Default to A if before term
        const weeksPassed = Math.floor(diffDays / 7);
        return weeksPassed % 2 === 0 ? 'A' : 'B';
    };

    // Helper: Get Schedule for a specific date
    const getScheduleForDate = (date: Date): DaySchedule | undefined => {
        if (!schoolStructure) return undefined;
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const week = getCycleWeek(date);
        
        return schoolStructure.days.find(d => 
            d.day === dayName && 
            (schoolStructure.cycle === 'Weekly' || d.week === week)
        );
    };

    // Navigation
    const navigate = (dir: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + (dir === 'next' ? 1 : -1));
        } else {
            newDate.setDate(newDate.getDate() + (dir === 'next' ? 7 : -7));
        }
        setCurrentDate(newDate);
    };

    // Render a single day column
    const renderDayColumn = (date: Date, isWeekView: boolean) => {
        const schedule = getScheduleForDate(date);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = new Date().toDateString() === date.toDateString();

        return (
            <div className={`flex flex-col h-full ${isWeekView ? 'min-w-[300px] border-r border-slate-200 dark:border-slate-800 last:border-r-0' : 'w-full'}`}>
                {/* Column Header */}
                <div className={`p-3 border-b border-slate-200 dark:border-slate-800 ${isToday ? 'bg-brand-50 dark:bg-brand-900/20' : 'bg-slate-50 dark:bg-slate-900'}`}>
                    <div className="flex justify-between items-center">
                        <span className={`font-bold ${isToday ? 'text-brand-700 dark:text-brand-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </span>
                    </div>
                    {schoolStructure?.cycle === 'Fortnightly' && (
                        <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                            Week {getCycleWeek(date)}
                        </div>
                    )}
                </div>

                {/* Slots */}
                <div className="flex-1 overflow-y-auto">
                    {schedule ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {schedule.slots.map(slot => {
                                const assignedClass = classes.find(c => c.id === slot.classId);
                                const entry = daybookEntries.find(e => e.date === dateStr && e.slotId === slot.id);
                                const isBreak = slot.type === 'Break' || slot.type === 'Admin' || slot.type === 'RollCall';

                                return (
                                    <div key={slot.id} className={`flex ${isWeekView ? 'flex-col' : 'flex-row'} group`}>
                                        {/* Info Column */}
                                        <div className={`
                                            p-3 flex flex-col justify-center gap-1
                                            ${isWeekView ? 'w-full border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50' : 'w-48 shrink-0 border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'}
                                            ${isBreak ? 'bg-slate-50/80 dark:bg-slate-900/80' : ''}
                                        `}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-mono text-slate-500">{slot.startTime}</span>
                                                {slot.room && (
                                                    <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 flex items-center gap-1">
                                                        <MapPin className="w-2 h-2" /> {slot.room}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                                                {assignedClass ? assignedClass.name : slot.name}
                                            </div>
                                            {assignedClass && (
                                                <div className="text-xs text-slate-500 truncate">{assignedClass.subject}</div>
                                            )}
                                            {slot.label && (
                                                <div className="text-[10px] text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 px-1 rounded w-fit">
                                                    {slot.label}
                                                </div>
                                            )}
                                        </div>

                                        {/* Input Column */}
                                        <div className="flex-1 min-h-[100px] relative">
                                            <textarea
                                                value={entry?.content || ''}
                                                onChange={(e) => setDaybookEntry({
                                                    id: entry?.id || '',
                                                    date: dateStr,
                                                    slotId: slot.id,
                                                    content: e.target.value
                                                })}
                                                placeholder="Plan lesson or notes..."
                                                className="w-full h-full p-3 resize-none bg-transparent border-none focus:ring-0 focus:bg-brand-50/30 dark:focus:bg-brand-900/10 transition-colors text-sm leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm italic">
                            No schedule configured for this day.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const daysToShow = viewMode === 'day' ? [currentDate] : Array.from({ length: 5 }, (_, i) => {
        const d = getMonday(currentDate);
        d.setDate(d.getDate() + i);
        return d;
    });

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50">Today</button>
                    <button onClick={() => navigate('next')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronRight className="w-5 h-5" /></button>
                    <span className="ml-2 font-bold text-slate-700 dark:text-slate-200 text-lg">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
                
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setViewMode('day')} className={`p-2 rounded-md transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-600 shadow text-brand-600 dark:text-white' : 'text-slate-500'}`} title="Day View"><AlignJustify className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode('week')} className={`p-2 rounded-md transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-600 shadow text-brand-600 dark:text-white' : 'text-slate-500'}`} title="Week View"><Columns className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-auto ${viewMode === 'week' ? 'flex divide-x divide-slate-200 dark:divide-slate-800' : ''}`}>
                {daysToShow.map((d, i) => renderDayColumn(d, viewMode === 'week'))}
            </div>
        </div>
    );
};