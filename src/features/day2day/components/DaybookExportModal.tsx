import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';

interface DaybookExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (range: { start: Date; end: Date }) => void;
}

export const DaybookExportModal: React.FC<DaybookExportModalProps> = ({ isOpen, onClose, onExport }) => {
    if (!isOpen) return null;

    // Helper for local date string
    const getLocalDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [mode, setMode] = useState<'day' | 'week' | 'custom'>('week');
    const [customStart, setCustomStart] = useState(getLocalDateStr(new Date()));
    const [customEnd, setCustomEnd] = useState(getLocalDateStr(new Date()));

    const handleExport = () => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        if (mode === 'day') {
            start = new Date(today);
            end = new Date(today);
        } else if (mode === 'week') {
            // Current week (Monday to Friday)
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(today);
            start.setDate(diff);
            end = new Date(start);
            end.setDate(start.getDate() + 4);
        } else {
            start = new Date(customStart);
            end = new Date(customEnd);
        }
        
        // Normalize times
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);

        onExport({ start, end });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Printer className="w-5 h-5" /> Export Daybook
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <input type="radio" name="exportMode" checked={mode === 'day'} onChange={() => setMode('day')} className="text-brand-600 focus:ring-brand-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Current Day</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <input type="radio" name="exportMode" checked={mode === 'week'} onChange={() => setMode('week')} className="text-brand-600 focus:ring-brand-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Current Week</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <input type="radio" name="exportMode" checked={mode === 'custom'} onChange={() => setMode('custom')} className="text-brand-600 focus:ring-brand-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Custom Date Range</span>
                        </label>
                    </div>

                    {mode === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-sm">Cancel</button>
                    <button onClick={handleExport} className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm text-sm flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Generate Print View
                    </button>
                </div>
            </div>
        </div>
    );
};