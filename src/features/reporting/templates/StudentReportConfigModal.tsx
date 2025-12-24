import React, { useState } from 'react';
import { X, Calendar, CheckSquare } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: { terms: string[], includeEvidence: boolean }) => void;
    reportType: string;
    studentName: string;
}

export const StudentReportConfigModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, reportType, studentName }) => {
    const [terms, setTerms] = useState<string[]>(['1', '2', '3', '4']);
    const [includeEvidence, setIncludeEvidence] = useState(true);

    if (!isOpen) return null;

    const toggleTerm = (t: string) => {
        setTerms(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Generate {reportType.toUpperCase()} Report</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Configuration for <strong>{studentName}</strong>.</p>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Select Terms
                        </label>
                        <div className="flex gap-2">
                            {['1', '2', '3', '4'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => toggleTerm(t)}
                                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
                                        terms.includes(t) 
                                        ? 'bg-brand-600 text-white shadow-sm' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    T{t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4" /> Content Options
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={includeEvidence} 
                                onChange={e => setIncludeEvidence(e.target.checked)}
                                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Include Evidence Logs & Attachments</span>
                        </label>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                    <button 
                        onClick={() => onConfirm({ terms, includeEvidence })}
                        className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm transition-colors"
                    >
                        Generate PDF
                    </button>
                </div>
            </div>
        </div>
    );
};