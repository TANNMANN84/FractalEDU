import React, { useState } from 'react';
import JSZip from 'jszip';
import { useAppStore } from '@/store';
import { Cohort, Student } from '@/types';
import { X, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

interface RolloverModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const COHORT_ORDER = [
    Cohort.YEAR_7, Cohort.YEAR_8, Cohort.YEAR_9, 
    Cohort.YEAR_10, Cohort.YEAR_11, Cohort.YEAR_12
];

export const RolloverModal: React.FC<RolloverModalProps> = ({ isOpen, onClose }) => {
    const { students, classes, setStudents, setClasses } = useAppStore();
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleRollover = async () => {
        setIsProcessing(true);
        
        // Simulate delay for UX
        await new Promise(r => setTimeout(r, 800));

        // 1. Process Students
        const newStudents = students.map(s => {
            if (s.status === 'Archived') return s;

            const currentIndex = COHORT_ORDER.indexOf(s.cohort);
            if (currentIndex === -1) return s; // Unknown cohort, skip

            if (currentIndex === COHORT_ORDER.length - 1) {
                // Year 12 -> Archive
                return { ...s, status: 'Archived' as const };
            } else {
                // Promote
                return { ...s, cohort: COHORT_ORDER[currentIndex + 1] };
            }
        });

        // 2. Archive Classes
        const newClasses = classes.map(c => ({ ...c, status: 'Archived' as const }));

        // 3. Generate Zip Export
        try {
            const zip = new JSZip();
            
            newStudents.forEach(s => {
                const folderName = s.status === 'Archived' ? 'Archived_Graduates' : s.cohort.replace(' ', '_');
                const safeName = s.name.replace(/[^a-z0-9]/gi, '_');
                zip.folder(folderName)?.file(`${safeName}.json`, JSON.stringify(s, null, 2));
            });

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Student_Profiles_Rollover_${new Date().getFullYear()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Commit State Changes
            setStudents(newStudents);
            setClasses(newClasses);
            setStep(2);
        } catch (e) {
            console.error(e);
            alert("Error creating backup archive.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                
                {step === 1 && (
                    <>
                        <div className="flex items-center gap-3 mb-4 text-slate-800">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><AlertTriangle className="w-6 h-6" /></div>
                            <h3 className="font-bold text-xl">Annual School Rollover</h3>
                        </div>
                        
                        <div className="space-y-4 text-sm text-slate-600">
                            <p>This wizard prepares Fractal EDU for the new academic year. Please confirm the following actions:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Promote Students:</strong> All active students will move up one Year Group (e.g. Yr 7 → Yr 8).</li>
                                <li><strong>Archive Graduates:</strong> Year 12 students will be marked as 'Archived'.</li>
                                <li><strong>Archive Classes:</strong> All current classes will be archived to start fresh.</li>
                                <li><strong>Export Data:</strong> A .zip archive of all student profiles (sorted by new year group) will be downloaded.</li>
                            </ul>
                            <p className="font-bold text-red-600">This action cannot be undone automatically.</p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                            <button 
                                onClick={handleRollover} 
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50"
                            >
                                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isProcessing ? 'Processing...' : 'Confirm Rollover'}
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div className="text-center py-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Rollover Complete!</h3>
                        <p className="text-slate-500 text-sm mb-6">Classes archived, students promoted, and profiles exported.</p>
                        <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold">Done</button>
                    </div>
                )}

            </div>
        </div>
    );
};