import React, { useState, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useAppStore } from '@/store';
import { ClassProgram, Term } from '@/types';
import { storageService } from '@/services/storageService';
import { X, CheckCircle, Loader2, AlertTriangle, FileText } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
    program: ClassProgram;
    onComplete: () => void;
}

export const FinalizeModal: React.FC<Props> = ({ isOpen, onClose, classId, program, onComplete }) => {
    const { finalizeProgram, teacherProfile, monitoringDocs, addMonitoringDoc, updateMonitoringDoc } = useAppStore();
    const [selectedTerms, setSelectedTerms] = useState<Term[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [documentName, setDocumentName] = useState('');

    useEffect(() => {
        if (program) {
            setDocumentName(`${program.name} (Finalised)`);
        }
    }, [program]);

    if (!isOpen) return null;

    const toggleTerm = (term: Term) => {
        setSelectedTerms(prev => prev.includes(term) ? prev.filter(t => t !== term) : [...prev, term]);
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return rgb(0, 0, 0);
        return rgb(
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        );
    };

    const handleFinalize = async () => {
        if (selectedTerms.length === 0) {
            alert("Please select at least one term to attach this program to.");
            return;
        }

        if (!program.fileId) {
            alert("Error: Program file ID is missing. Cannot finalise.");
            return;
        }

        if (!documentName.trim()) {
            alert("Please enter a document name.");
            return;
        }

        setIsProcessing(true);

        try {
            const originalBase64 = await storageService.getFileContent(program.fileId);
            if (!originalBase64) throw new Error("Original file not found.");

            const pdfBuffer = await fetch(originalBase64).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            let signatureImage: any = null;
            if (teacherProfile?.signature) {
                try {
                    if (teacherProfile.signature.includes('image/png')) {
                        signatureImage = await pdfDoc.embedPng(teacherProfile.signature);
                    } else {
                        signatureImage = await pdfDoc.embedJpg(teacherProfile.signature);
                    }
                } catch (e) {
                    console.warn("Signature embed failed", e);
                }
            }

            for (const ann of program.annotations) {
                const pageIndex = ann.page - 1;
                if (pageIndex >= pages.length) continue;
                
                const page = pages[pageIndex];
                const { width, height } = page.getSize();
                
                const x = (ann.x / 100) * width;
                const y = height - ((ann.y / 100) * height);
                const scale = ann.scale || 1.0;

                if (ann.type === 'drawing' && ann.path && ann.path.length > 1) {
                    const color = hexToRgb(ann.color || '#ef4444');
                    const thickness = (ann.thickness || 3) * scale;
                    
                    for (let i = 0; i < ann.path.length - 1; i++) {
                        const start = ann.path[i];
                        const end = ann.path[i+1];
                        page.drawLine({
                            start: { x: (start.x / 100) * width, y: height - ((start.y / 100) * height) },
                            end: { x: (end.x / 100) * width, y: height - ((end.y / 100) * height) },
                            thickness,
                            color,
                            opacity: 0.9,
                        });
                    }
                } else if (ann.type === 'signature') {
                    if (signatureImage) {
                        const targetHeight = 40 * scale;
                        const dims = signatureImage.scaleToFit(500, targetHeight); 
                        page.drawImage(signatureImage, {
                            x: x - (dims.width / 2),
                            y: y - (dims.height / 2),
                            width: dims.width,
                            height: dims.height,
                        });
                    } else {
                        page.drawText(`Signed: ${teacherProfile?.name || 'Teacher'}`, { 
                            x, y, size: 14 * scale, font: boldFont, color: rgb(0, 0, 0.6) 
                        });
                    }
                } else if (ann.content?.startsWith('LINK:')) {
                    const fullText = ann.content.replace('LINK:', '').trim();
                    const badgeText = `Evidence: ${fullText}`;
                    
                    const textSize = 10 * scale;
                    const textWidth = font.widthOfTextAtSize(badgeText, textSize);
                    const bHeight = textSize + 8;
                    const bWidth = textWidth + 12;

                    page.drawRectangle({
                        x: x - 5, 
                        y: y - (bHeight / 2), 
                        width: bWidth, 
                        height: bHeight,
                        color: rgb(0.95, 0.96, 1), 
                        borderColor: rgb(0.31, 0.35, 0.9), 
                        borderWidth: 1.5 * scale
                    });

                    page.drawText(badgeText, { 
                        x, 
                        y: y - (textSize / 3), 
                        size: textSize, 
                        font: boldFont, 
                        color: rgb(0.1, 0.2, 0.6) 
                    });
                } else if (ann.type === 'text') {
                    const text = ann.content || '';
                    if (text.trim()) {
                        page.drawText(text, { 
                            x, y, size: 12 * scale, font, color: rgb(0.8, 0, 0), lineHeight: 14 * scale, maxWidth: 200 
                        });
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
            });
            reader.readAsDataURL(blob);
            const finalBase64 = await base64Promise;

            const finalFileId = `final-${crypto.randomUUID()}`;
            await storageService.saveFileContent(finalFileId, finalBase64);

            const existingDoc = monitoringDocs.find(d => d.classId === classId);
            let docToSave = JSON.parse(JSON.stringify(existingDoc || {
                id: crypto.randomUUID(), classId, year: new Date().getFullYear(), certifySyllabus: false, scopeAndSequence: null,
                teachingPrograms: { '1': [], '2': [], '3': [], '4': [] }, semesterReports: { '1': null, '2': null, '3': null, '4': null },
                assessmentSchedule: null, assessmentTask1: [], assessmentTask2: [], assessmentTask3: [], prePostDiagnostic: [],
                marksAndRanks: { '1': null, '2': null, '3': null, '4': null },
                scannedWorkSamples: { task1: {top:null, middle:null, low:null}, task2: {top:null, middle:null, low:null}, task3: {top:null, middle:null, low:null} },
                specificLearningNeeds: { '1': false, '2': false, '3': false, '4': false }, studentsCausingConcern: { '1': [], '2': [], '3': [], '4': [] },
                illnessMisadventure: { '1': [], '2': [], '3': [], '4': [] }, malpractice: { '1': [], '2': [], '3': [], '4': [] },
                teacherSignOff: { '1': {teacherName:'', date:null}, '2': {teacherName:'', date:null}, '3': {teacherName:'', date:null}, '4': {teacherName:'', date:null} },
                headTeacherSignOff: { '1': {teacherName:'', date:null}, '2': {teacherName:'', date:null}, '3': {teacherName:'', date:null}, '4': {teacherName:'', date:null} }
            }));

            if (!existingDoc) addMonitoringDoc(docToSave);

            const newFileRef = { id: finalFileId, name: documentName };
            selectedTerms.forEach(term => {
                docToSave.teachingPrograms[term] = [...(docToSave.teachingPrograms[term] || []), newFileRef];
            });

            updateMonitoringDoc(docToSave.id, docToSave);
            finalizeProgram(classId, program.id);
            onComplete();

        } catch (e) {
            console.error(e);
            alert("Failed to finalise PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in fade-in zoom-in duration-200 border border-slate-100">
                <div className="flex items-center gap-4 mb-6 text-slate-800 border-b border-slate-100 pb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm"><AlertTriangle className="w-8 h-8" /></div>
                    <div>
                        <h3 className="font-bold text-2xl">Finalise Program</h3>
                        <p className="text-sm text-slate-500 font-medium">Merge all markings permanently into the document.</p>
                    </div>
                    <button onClick={onClose} className="ml-auto p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6"/></button>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 p-5 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-200/60 shadow-inner">
                        This action will <strong>permanently merge</strong> all drawings, signatures, and evidence badges into a new PDF. The original remains unchanged.
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Document Name</label>
                        <div className="flex items-center gap-3 border-2 border-slate-100 rounded-xl px-4 py-3 bg-white focus-within:border-indigo-500 transition-colors">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <input 
                                type="text"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                className="w-full text-sm outline-none text-slate-800 font-bold placeholder-slate-300"
                                placeholder="e.g. Term 1 Program (Signed)"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Attach to Term Logs</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['1','2','3','4'] as Term[]).map(term => (
                                <button
                                    key={term}
                                    onClick={() => toggleTerm(term)}
                                    className={`
                                        p-4 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-3
                                        ${selectedTerms.includes(term) 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                                            : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}
                                    `}
                                >
                                    {selectedTerms.includes(term) && <CheckCircle className="w-4 h-4" />}
                                    Term {term}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-10">
                    <button onClick={onClose} disabled={isProcessing} className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors">Cancel</button>
                    <button 
                        onClick={handleFinalize} 
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                    >
                        {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isProcessing ? 'Processing...' : 'Register Finalised PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
};
