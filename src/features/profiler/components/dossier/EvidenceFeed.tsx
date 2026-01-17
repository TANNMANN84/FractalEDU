
import React, { useState } from 'react';
import { Student } from '@/types';
import { storageService } from '@/services/storageService';
import { Filter, Paperclip, Brain, FileText } from 'lucide-react';

interface Props {
    student: Student;
}

export const EvidenceFeed: React.FC<Props> = ({ student }) => {
    const [filter, setFilter] = useState('All');
    const logs = student.evidenceLog || [];

    // Sort by date desc
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Filter logic
    const filteredLogs = filter === 'All' 
        ? sortedLogs 
        : sortedLogs.filter(l => l.tags?.includes(filter) || l.type === filter);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0 text-slate-400">
                    <Filter className="w-4 h-4" />
                </div>
                {['All', 'NCCD', 'Wellbeing', 'Academic', 'Behaviour', 'Literacy', 'Numeracy'].map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                            filter === f 
                                ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-700 shadow-md' 
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Timeline Feed */}
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pl-8">
                {filteredLogs.map((log) => (
                    <div key={log.id} className="relative group">
                        {/* Timeline Dot */}
                        <div className={`
                            absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 shadow-sm transition-colors
                            ${log.type === 'Behaviour' || log.tags?.includes('Behaviour') ? 'bg-red-500' : 
                              log.type === 'Wellbeing' || log.tags?.includes('Wellbeing') ? 'bg-amber-500' : 
                              'bg-brand-500'}
                        `} />
                        
                        {/* Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all">
                            
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{log.author}</span>
                                        <span className="text-xs text-slate-400">• {new Date(log.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {/* Primary Type Badge */}
                                        {!log.tags?.includes(log.type) && (
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                                                {log.type}
                                            </span>
                                        )}
                                        {/* Tags */}
                                        {log.tags?.map(t => (
                                            <span key={t} className="text-[10px] bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                {log.content}
                            </div>

                            {/* Footer: Attachments & Linked Plan */}
                            {( (log.adjustments && log.adjustments.length > 0) || log.file ) && (
                                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-3">
                                    
                                    {/* Linked Strategies */}
                                    {log.adjustments && log.adjustments.length > 0 && (
                                        <div className="flex items-start gap-2 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                            <Brain className="w-3 h-3 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="font-bold block mb-0.5">Evidenced Adjustments:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {log.adjustments.map((adj, i) => (
                                                        <span key={i} className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                                            {adj}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* File Attachment */}
                                    {log.file && (
                                        <button 
                                            onClick={() => storageService.triggerDownload(log.file!)}
                                            className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group/file w-fit"
                                        >
                                            <div className="p-1.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 group-hover/file:border-slate-300 dark:group-hover/file:border-slate-600">
                                                <Paperclip className="w-4 h-4 text-slate-400 group-hover/file:text-slate-600" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover/file:text-slate-800 dark:group-hover/file:text-slate-100">{log.file.name}</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {filteredLogs.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 ml-[-20px]">
                        <FileText className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No evidence logs found.</p>
                        <p className="text-xs mt-1">Check filters or add a new entry.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
