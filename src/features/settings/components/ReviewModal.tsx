import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ReviewPackage, MonitoringDoc, Term, TermSignOff } from '@/types';
import { SignOffModal } from '../../monitoring/components/SignOffModal';
import { storageService } from '@/services/storageService';
import { X, Printer, Download, FileText, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';

interface ReviewModalProps {
    packageData: ReviewPackage;
    onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ packageData, onClose }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [doc, setDoc] = useState<MonitoringDoc>(packageData.monitoringDoc);
    const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    // Detect which term is being reviewed based on where data or signatures exist
    const reviewedTerm = useMemo((): Term | null => {
        for (const term of ['1', '2', '3', '4'] as Term[]) {
            if (doc.teacherSignOff[term]?.date || (doc.teachingPrograms[term] && doc.teachingPrograms[term].length > 0)) {
                return term;
            }
        }
        return '1';
    }, [doc]);

    const isOfflineReady = useMemo(() => {
        return packageData.files && Object.keys(packageData.files).length > 0;
    }, [packageData.files]);

    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    };

    /**
     * Attempts to open the file from the embedded package first (portable mode),
     * falling back to local device storage if not found.
     */
    const handleOpenFile = async (fileId: string, fileName: string) => {
        const embeddedContent = packageData.files?.[fileId];
        
        if (embeddedContent) {
            try {
                // Parse base64 and create a blob for viewing
                const mimeMatch = embeddedContent.match(/^data:([^;]+);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
                const base64Data = embeddedContent.includes(',') ? embeddedContent.split(',')[1] : embeddedContent;
                
                const binaryString = window.atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const blob = new Blob([bytes], { type: mimeType });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            } catch (e) {
                console.error("Failed to open embedded file, falling back to local storage", e);
                storageService.triggerDownload({ id: fileId, name: fileName });
            }
        } else {
            // Fallback for local-only packages
            storageService.triggerDownload({ id: fileId, name: fileName });
        }
    };

    const handleSignOff = (signerName: string, signatureImage?: string) => {
        if (!reviewedTerm) return;
        
        const newSignOff: TermSignOff = {
            teacherName: signerName,
            date: new Date().toISOString(),
            signatureImage: signatureImage,
        };
        
        setDoc(prevDoc => ({
            ...prevDoc,
            headTeacherSignOff: { ...prevDoc.headTeacherSignOff, [reviewedTerm]: newSignOff }
        }));

        setIsSignOffModalOpen(false);
    };

    const handleDownloadSignedPackage = () => {
        const updatedPackage: ReviewPackage = {
            ...packageData,
            monitoringDoc: doc,
        };

        const jsonString = JSON.stringify(updatedPackage, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        
        const safeName = packageData.classGroup.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${safeName}_Signed_T${reviewedTerm}.profiler-review`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        handleClose();
    };

    const teacherSignOff = reviewedTerm ? doc.teacherSignOff[reviewedTerm] : null;
    const headTeacherSignOff = reviewedTerm ? doc.headTeacherSignOff[reviewedTerm] : null;

    if (!reviewedTerm) return null;

    return (
        <dialog ref={dialogRef} className="p-0 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col backdrop:bg-black/60 border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 bg-slate-900 text-white shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-brand-500/20 rounded-xl border border-brand-500/50">
                        <ShieldCheck className="w-6 h-6 text-brand-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Review Mode: {packageData.classGroup.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Term {reviewedTerm} Compliance</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isOfflineReady ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                {isOfflineReady ? 'Offline Ready (Bundled Files)' : 'Linked (Local Files)'}
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"><X className="w-6 h-6"/></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                
                {/* 1. Profiler Snapshot */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
                    <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" /> Profiler Snapshot
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
                                <tr>
                                    <th className="p-4">Student</th>
                                    <th className="p-4 text-center">Wellbeing</th>
                                    <th className="p-4 text-center">Evidence</th>
                                    <th className="p-4 text-center">Differentiation</th>
                                    <th className="p-4 text-center">NAPLAN (R/W/N)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {packageData.profilerSnapshot.map(s => (
                                    <tr key={s.studentId} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-bold text-slate-700">{s.name}</td>
                                        <td className="p-4 text-center">
                                            {s.hasWellbeingNotes ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            {s.hasEvidenceLogs ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            {s.hasDifferentiation ? <CheckCircle2 className="w-5 h-5 text-indigo-500 mx-auto" /> : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="p-4 text-center font-mono text-[10px] text-slate-500 font-bold">
                                            {s.naplan.year9.reading?.[0] || '?'}/{s.naplan.year9.writing?.[0] || '?'}/{s.naplan.year9.numeracy?.[0] || '?'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Documents Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-3 uppercase text-xs tracking-widest text-indigo-600">Program & Assessment</h4>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Syllabus Certified</span>
                            <span className={`font-bold ${doc.certifySyllabus ? 'text-emerald-600' : 'text-slate-400'}`}>{doc.certifySyllabus ? 'YES' : 'NO'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Scope & Sequence</span>
                            {doc.scopeAndSequence ? (
                                <button onClick={() => handleOpenFile(doc.scopeAndSequence!.id, doc.scopeAndSequence!.name)} className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors">
                                    {doc.scopeAndSequence.name} <ExternalLink className="w-3 h-3" />
                                </button>
                            ) : <span className="text-red-400 font-bold">MISSING</span>}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Assessment Schedule</span>
                            {doc.assessmentSchedule ? (
                                <button onClick={() => handleOpenFile(doc.assessmentSchedule!.id, doc.assessmentSchedule!.name)} className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors">
                                    {doc.assessmentSchedule.name} <ExternalLink className="w-3 h-3" />
                                </button>
                            ) : <span className="text-red-400 font-bold">MISSING</span>}
                        </div>
                        <div className="pt-2">
                             <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Programmes (Term {reviewedTerm})</span>
                             <div className="space-y-1">
                                {doc.teachingPrograms[reviewedTerm]?.map((f, i) => (
                                    <button key={i} onClick={() => handleOpenFile(f.id, f.name)} className="w-full text-left text-xs bg-slate-50 p-2 rounded border border-slate-200 hover:border-brand-300 hover:text-brand-600 font-medium truncate flex items-center justify-between">
                                        {f.name} <ExternalLink className="w-3 h-3 opacity-50" />
                                    </button>
                                ))}
                                {(!doc.teachingPrograms[reviewedTerm] || doc.teachingPrograms[reviewedTerm].length === 0) && <span className="text-xs text-slate-400 italic">No files submitted.</span>}
                             </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-3 uppercase text-xs tracking-widest text-indigo-600">Student Achievement</h4>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Marks & Ranks Record</span>
                            {doc.marksAndRanks[reviewedTerm] ? (
                                <button onClick={() => handleOpenFile(doc.marksAndRanks[reviewedTerm]!.id, doc.marksAndRanks[reviewedTerm]!.name)} className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors">
                                    {doc.marksAndRanks[reviewedTerm]!.name} <ExternalLink className="w-3 h-3" />
                                </button>
                            ) : <span className="text-red-400 font-bold">MISSING</span>}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Concerns Sighted</span>
                            <span className="font-bold text-slate-800">{doc.studentsCausingConcern[reviewedTerm]?.length || 0} Entries</span>
                        </div>
                        <div className="pt-2">
                             <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Work Samples</span>
                             <div className="grid grid-cols-3 gap-2">
                                {['top', 'middle', 'low'].map(lvl => {
                                    const sample = (doc.scannedWorkSamples as any).task1[lvl]; // Standard check of task 1
                                    return (
                                        <button 
                                            key={lvl} 
                                            disabled={!sample}
                                            onClick={() => sample && handleOpenFile(sample.id, sample.name)}
                                            className={`p-2 rounded border text-[10px] font-bold uppercase text-center transition-all ${sample ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-600' : 'bg-slate-50/50 border-transparent text-slate-300 cursor-not-allowed'}`}
                                        >
                                            {lvl} Sample
                                        </button>
                                    );
                                })}
                             </div>
                        </div>
                    </div>
                </div>

                {/* 3. Signatures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                    <div className="text-center p-8 border border-slate-200 rounded-2xl bg-white shadow-sm">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Teacher Certification</h4>
                        {teacherSignOff?.date ? (
                            <div className="animate-in fade-in zoom-in duration-500">
                                {/* Fix: Use 'in' operator to narrow type and access signatureImage on union type */}
                                {teacherSignOff && 'signatureImage' in teacherSignOff && teacherSignOff.signatureImage ? (
                                    <img src={teacherSignOff.signatureImage} className="mx-auto h-20 mb-4 mix-blend-multiply" alt="Signature"/>
                                ) : (
                                    <p className="font-caveat text-5xl text-slate-800 mb-4">{teacherSignOff.teacherName}</p>
                                )}
                                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 inline-block">
                                    <p className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> CERTIFIED ON {new Date(teacherSignOff.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-50" />
                                <p className="text-xs text-slate-500 font-medium">Pending Teacher Signature</p>
                            </div>
                        )}
                    </div>

                    <div className="text-center p-8 border border-slate-200 rounded-2xl bg-white shadow-sm relative overflow-hidden">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Head Teacher Sign Off</h4>
                        {headTeacherSignOff?.date ? (
                            <div className="animate-in fade-in zoom-in duration-500">
                                {/* Fix: Use 'in' operator to narrow type and access signatureImage on union type */}
                                {headTeacherSignOff && 'signatureImage' in headTeacherSignOff && headTeacherSignOff.signatureImage ? (
                                    <img src={headTeacherSignOff.signatureImage} className="mx-auto h-20 mb-4 mix-blend-multiply" alt="Signature"/>
                                ) : (
                                    <p className="font-caveat text-5xl text-slate-800 mb-4">{headTeacherSignOff.teacherName}</p>
                                )}
                                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 inline-block">
                                    <p className="text-[10px] text-indigo-700 font-bold flex items-center justify-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Signed off ON {new Date(headTeacherSignOff.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <button 
                                    onClick={() => setIsSignOffModalOpen(true)}
                                    className="px-8 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    <ShieldCheck className="w-5 h-5" /> Sign Off Module
                                </button>
                                <p className="text-[10px] text-slate-400 font-medium mt-4">Review all evidence before signing.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="p-5 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 rounded-b-2xl">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors">
                    <Printer className="w-4 h-4" /> PRINT REVIEW
                </button>
                <div className="flex gap-3">
                    <button onClick={handleClose} className="px-5 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold text-xs transition-colors">CANCEL</button>
                    {headTeacherSignOff?.date && (
                        <button onClick={handleDownloadSignedPackage} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-xs shadow-md transition-all hover:-translate-y-0.5">
                            <Download className="w-4 h-4" /> EXPORT SIGNED PACKAGE
                        </button>
                    )}
                </div>
            </div>

            {isSignOffModalOpen && (
                <SignOffModal
                    isOpen={isSignOffModalOpen}
                    onClose={() => setIsSignOffModalOpen(false)}
                    onConfirm={handleSignOff}
                    signerName={'Head Teacher'}
                    existingSignOff={null}
                />
            )}
        </dialog>
    );
};
