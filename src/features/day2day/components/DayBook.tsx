import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlignJustify, Columns, MapPin, Maximize2, Printer, Users, Paperclip } from 'lucide-react';
import { useAppStore } from '@/store';
import { DaySchedule, TimeSlot } from '@/types';
import { DaybookModal } from './DaybookModal';
import { DaybookExportModal } from './DaybookExportModal';

export const Daybook: React.FC = () => {
    const { schoolStructure, classes, daybookEntries, students } = useAppStore();
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingSlot, setEditingSlot] = useState<{date: string, slot: TimeSlot} | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Helper: Get Local Date String (YYYY-MM-DD) to avoid UTC issues
    const getLocalDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper: Get Class Color (Consistent with TimetableEditor)
    const getClassColor = (id: string) => {
        const colors = [
            'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
            'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
            'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
            'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
            'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
            'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
        ];
        let hash = 0;
        for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

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
        const dateStr = getLocalDateStr(date);
        const isToday = new Date().toDateString() === date.toDateString();

        return (
            <div className={`flex flex-col ${isWeekView ? 'min-w-[450px] border-r border-slate-200 dark:border-slate-800 last:border-r-0 min-h-full' : 'w-full h-full'}`}>
                {/* Column Header */}
                <div className={`p-3 border-b border-slate-200 dark:border-slate-800 ${isToday ? 'bg-brand-50 dark:bg-brand-900/20' : 'bg-slate-50 dark:bg-slate-900'} ${isWeekView ? 'sticky top-0 z-10 shadow-sm' : ''}`}>
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
                <div className={isWeekView ? 'flex-1' : 'flex-1 overflow-y-auto'}>
                    {schedule ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {schedule.slots.map(slot => {
                                const assignedClass = classes.find(c => c.id === slot.classId);
                                const entry = daybookEntries.find(e => e.date === dateStr && e.slotId === slot.id);
                                const isBreak = slot.type === 'Break' || slot.type === 'Admin' || slot.type === 'RollCall';
                                const colorClass = assignedClass ? getClassColor(assignedClass.id) : '';

                                return (
                                    <div key={slot.id} className="flex flex-row group relative">
                                        {/* Info Column */}
                                        <div className={`
                                            p-3 flex flex-col justify-center gap-1
                                            w-40 shrink-0 border-r 
                                            ${assignedClass 
                                                ? colorClass 
                                                : `border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 ${isBreak ? 'bg-slate-50/80 dark:bg-slate-900/80' : ''}`
                                            }
                                        `}>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs font-mono ${assignedClass ? 'opacity-75' : 'text-slate-500'}`}>{slot.startTime}</span>
                                                {slot.room && (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${assignedClass ? 'bg-white/50 border-black/10' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                                        <MapPin className="w-2 h-2" /> {slot.room}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`font-bold text-sm truncate ${assignedClass ? '' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {assignedClass ? assignedClass.name : slot.name}
                                            </div>
                                            {assignedClass && (
                                                <div className="text-xs opacity-75 truncate">{assignedClass.subject}</div>
                                            )}
                                            {slot.label && (
                                                <div className="text-[10px] text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 px-1 rounded w-fit">
                                                    {slot.label}
                                                </div>
                                            )}
                                        </div>

                                        {/* Input Column */}
                                        <div 
                                            className="flex-1 min-h-[100px] relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/cell"
                                            onClick={() => setEditingSlot({ date: dateStr, slot })}
                                        >
                                            <div className="p-3 text-sm whitespace-pre-wrap h-full">
                                                {entry?.content ? (
                                                    <span className="text-slate-700 dark:text-slate-300">{entry.content}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">Click to plan lesson...</span>
                                                )}
                                                
                                                {/* Indicators */}
                                                <div className="flex gap-2 mt-2">
                                                    {entry?.taggedStudents && entry.taggedStudents.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium"><Users className="w-3 h-3" /> {entry.taggedStudents.length}</span>
                                                    )}
                                                    {entry?.resources && entry.resources.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium"><Paperclip className="w-3 h-3" /> {entry.resources.length}</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Hover Action */}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                <button className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-brand-600">
                                                    <Maximize2 className="w-3 h-3" />
                                                </button>
                                            </div>
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

    const handleExport = ({ start, end }: { start: Date; end: Date }) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        let html = `
            <html>
            <head>
                <title>Daybook Export</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    .day { margin-bottom: 30px; page-break-inside: avoid; }
                    .day-header { font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; margin-bottom: 10px; padding-bottom: 5px; }
                    .slot { display: flex; border-bottom: 1px solid #eee; padding: 15px 0; page-break-inside: avoid; }
                    .time { width: 120px; font-weight: bold; font-size: 12px; color: #555; flex-shrink: 0; }
                    .details { flex: 1; }
                    .subject { font-weight: bold; font-size: 15px; margin-bottom: 4px; }
                    .meta { font-size: 12px; color: #666; margin-bottom: 8px; font-style: italic; }
                    .content { font-size: 14px; white-space: pre-wrap; line-height: 1.5; }
                    .empty { color: #999; font-style: italic; font-size: 13px; }
                    .tagged-students { margin-top: 10px; font-size: 12px; color: #444; background: #f5f5f5; padding: 8px; border-radius: 4px; border: 1px solid #eee; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; padding: 15px; border-radius: 8px; border: 1px solid #bae6fd;">
                    <div>
                        <h1 style="margin:0; font-size:20px;">Daybook Export</h1>
                        <p style="margin:5px 0 0; font-size:12px;">${start.toLocaleDateString()} - ${end.toLocaleDateString()}</p>
                    </div>
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; font-weight: bold; cursor: pointer; background: #0284c7; color: white; border: none; border-radius: 6px;">Print / Save as PDF</button>
                </div>
        `;

        const current = new Date(start);
        while (current <= end) {
            const dateStr = getLocalDateStr(current);
            const schedule = getScheduleForDate(current);
            
            if (schedule) {
                html += `<div class="day"><div class="day-header">${current.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>`;
                
                schedule.slots.forEach(slot => {
                    const assignedClass = classes.find(c => c.id === slot.classId);
                    const entry = daybookEntries.find(e => e.date === dateStr && e.slotId === slot.id);
                    
                    html += `<div class="slot">
                        <div class="time">${slot.startTime} - ${slot.endTime}<br/><span style="font-weight:normal; opacity:0.7">${slot.type}</span></div>
                        <div class="details">
                            <div class="subject">${assignedClass ? assignedClass.name : slot.name} ${slot.room ? `<span style="font-weight:normal; margin-left:10px; font-size:12px;">(Room ${slot.room})</span>` : ''}</div>
                            ${assignedClass ? `<div class="meta">${assignedClass.subject}</div>` : ''}
                            <div class="content">${entry?.content || '<span class="empty">No lesson plan entered.</span>'}</div>
                            ${entry?.taggedStudents && entry.taggedStudents.length > 0 ? `<div class="tagged-students"><strong>Tagged Students (${entry.taggedStudents.length}):</strong> ${entry.taggedStudents.map(ts => { const s = students.find(stu => stu.id === ts.studentId); return s ? `<br/>• ${s.name}${ts.note ? `: ${ts.note}` : ''}` : ''; }).join('')}</div>` : ''}
                            ${entry?.resources && entry.resources.length > 0 ? `<div class="resources" style="margin-top:5px; font-size:12px; color:#666;"><strong>Resources:</strong> ${entry.resources.map(r => r.name).join(', ')}</div>` : ''}
                        </div>
                    </div>`;
                });
                html += `</div>`;
            }
            current.setDate(current.getDate() + 1);
        }

        html += `</body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
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
                
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsExportModalOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Print / Export"><Printer className="w-5 h-5" /></button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => setViewMode('day')} className={`p-2 rounded-md transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-600 shadow text-brand-600 dark:text-white' : 'text-slate-500'}`} title="Day View"><AlignJustify className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('week')} className={`p-2 rounded-md transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-600 shadow text-brand-600 dark:text-white' : 'text-slate-500'}`} title="Week View"><Columns className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-auto ${viewMode === 'week' ? 'flex divide-x divide-slate-200 dark:divide-slate-800' : ''}`}>
                {daysToShow.map((d, i) => renderDayColumn(d, viewMode === 'week'))}
            </div>

            {editingSlot && (
                <DaybookModal 
                    date={editingSlot.date} 
                    slot={editingSlot.slot} 
                    onClose={() => setEditingSlot(null)} 
                />
            )}

            <DaybookExportModal 
                isOpen={isExportModalOpen} 
                onClose={() => setIsExportModalOpen(false)} 
                onExport={handleExport} 
            />
        </div>
    );
};