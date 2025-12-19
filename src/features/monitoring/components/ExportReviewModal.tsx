import React, { useState } from 'react';
import { X, FileOutput, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { MonitoringDoc, ClassGroup, Student, Term } from '@/types';
import { exportReviewPackage } from '../utils/reviewExporter';

interface ExportReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    monitoringDoc: MonitoringDoc;
    classGroup: ClassGroup;
    students: Student[];
}

export const ExportReviewModal: React.FC<ExportReviewModalProps> = ({ isOpen, onClose, monitoringDoc, classGroup, students }) => {
    const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen) return null;

    const handleExport = async () => {
        if (!selectedTerm) return;
        
        setIsExporting(true);
        try {
            await exportReviewPackage(classGroup, students, monitoringDoc, selectedTerm);
            onClose();
        } catch (e) {
            console.error(e);
            alert("An error occurred whilst generating the review package.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileOutput className="w-5 h-5 text-indigo-600" /> Export Review Package
                    </h3>
                    <button onClick={onClose} disabled={isExporting}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        This will create a self-contained <strong className="text-slate-800">.profiler-review</strong> file containing all term monitoring data and embedded evidence files. This package can be shared with Head Teachers for offline review.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {(['1','2','3','4'] as Term[]).map(term => (
                            <button
                                key={term}
                                onClick={() => setSelectedTerm(term)}
                                disabled={isExporting}
                                className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                                    selectedTerm === term 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                }`}
                            >
                                Term {term}
                            </button>
                        ))}
                    </div>

                    {selectedTerm && (
                        <div className={`p-3 rounded-lg border text-sm flex gap-2 animate-in slide-in-from-top-2 ${
                            monitoringDoc.teacherSignOff[selectedTerm]?.date 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                            {monitoringDoc.teacherSignOff[selectedTerm]?.date 
                                ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                                : <AlertTriangle className="w-5 h-5 shrink-0" />
                            }
                            <div>
                                <p className="font-bold">{monitoringDoc.teacherSignOff[selectedTerm]?.date ? 'Signed & Ready' : 'Signature Missing'}</p>
                                <p className="text-xs opacity-90">{monitoringDoc.teacherSignOff[selectedTerm]?.date ? 'You have signed this term.' : 'We recommend signing the document before exporting for review.'}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} disabled={isExporting} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                    <button 
                        onClick={handleExport} 
                        disabled={!selectedTerm || isExporting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileOutput className="w-4 h-4" />}
                        {isExporting ? 'Bundling Files...' : 'Download Review Package'}
                    </button>
                </div>
            </div>
        </div>
    );
};