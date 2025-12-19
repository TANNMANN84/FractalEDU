import React, { useState, useEffect, useRef } from 'react';
import { pdfjs } from 'react-pdf';
import { 
    ChevronLeft, ChevronRight, PenTool, Type, Link as LinkIcon, X, ZoomIn, ZoomOut, 
    CheckCircle, MousePointer2, Paperclip, Loader2, Plus 
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Annotation } from '@/types';
import { storageService } from '@/services/storageService';
import { ProgramLinkModal } from './ProgramLinkModal';
import { FinalizeModal } from './FinalizeModal';

// Fix for ESM compatibility in modern environments
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ProgramViewerProps {
    classId: string;
    programId: string;
    fileId: string;
    initialAnnotations: Annotation[];
    onClose: () => void;
}

export const ProgramViewer: React.FC<ProgramViewerProps> = ({ classId, programId, fileId, initialAnnotations, onClose }) => {
    const { updateProgramAnnotations, teacherProfile, classes } = useAppStore();
    
    const className = classes.find(c => c.id === classId)?.name || 'Class';

    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.2);
    const [mode, setMode] = useState<'view' | 'sign' | 'annotate' | 'link' | 'pen'>('view');
    const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations || []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Drawing Settings
    const [drawColor, setDrawColor] = useState('#ef4444');
    const [drawThickness, setDrawThickness] = useState(3);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

    const [linkModalData, setLinkModalData] = useState<{ x: number, y: number } | null>(null);
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [resizingId, setResizingId] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const renderTaskRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;
        const loadPdf = async () => {
            try {
                setLoading(true);
                const fileData = await storageService.getFileContent(fileId);
                if (!fileData) throw new Error("File not found");
                const loadingTask = pdfjs.getDocument(fileData);
                const pdf = await loadingTask.promise;
                if (isMounted) {
                    setPdfDoc(pdf);
                    setNumPages(pdf.numPages);
                    setLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError("Failed to load PDF. " + err.message);
                    setLoading(false);
                }
            }
        };
        loadPdf();
        return () => { isMounted = false; };
    }, [fileId]);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;
        const renderPage = async () => {
            try {
                if (renderTaskRef.current) renderTaskRef.current.cancel();
                const page = await pdfDoc.getPage(pageNumber);
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                const context = canvas?.getContext('2d');
                if (!canvas || !context) return;
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const renderContext = { canvasContext: context, viewport };
                const task = page.render(renderContext);
                renderTaskRef.current = task;
                await task.promise;
            } catch (err: any) {
                if (err.name !== 'RenderingCancelledException') console.error(err);
            }
        };
        renderPage();
    }, [pdfDoc, pageNumber, scale]);

    const getMousePos = (e: React.MouseEvent) => {
        if (!wrapperRef.current) return { x: 0, y: 0 };
        const rect = wrapperRef.current.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        };
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        const pos = getMousePos(e);

        if (mode === 'pen') {
            setCurrentPath([pos]);
            return;
        }

        if (mode === 'view') {
            if (e.target === canvasRef.current || e.target === wrapperRef.current) setSelectedId(null);
            return;
        }

        if (mode === 'link') {
            setLinkModalData(pos);
            return;
        }

        if (mode === 'sign' || mode === 'annotate') {
            const newAnn: Annotation = {
                id: crypto.randomUUID(),
                type: mode === 'sign' ? 'signature' : 'text',
                page: pageNumber,
                x: pos.x,
                y: pos.y,
                scale: 1.0,
                content: mode === 'annotate' ? 'New Note' : undefined,
                timestamp: new Date().toISOString()
            };
            setAnnotations(prev => [...prev, newAnn]);
            updateProgramAnnotations(classId, programId, newAnn);
            setSelectedId(newAnn.id);
            setMode('view');
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getMousePos(e);

        if (mode === 'pen' && currentPath.length > 0) {
            setCurrentPath(prev => [...prev, pos]);
            return;
        }

        if (draggingId) {
            setAnnotations(prev => prev.map(a => a.id === draggingId ? { ...a, x: pos.x, y: pos.y } : a));
            return;
        }

        if (resizingId) {
            const ann = annotations.find(a => a.id === resizingId);
            if (ann) {
                const dx = pos.x - ann.x;
                const dy = pos.y - ann.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const newScale = Math.max(0.2, Math.min(5.0, distance * 0.1));
                setAnnotations(prev => prev.map(a => a.id === resizingId ? { ...a, scale: newScale } : a));
            }
            return;
        }
    };

    const handleMouseUp = () => {
        if (currentPath.length > 1) {
            const newDrawing: Annotation = {
                id: crypto.randomUUID(),
                type: 'drawing',
                page: pageNumber,
                x: currentPath[0].x,
                y: currentPath[0].y,
                path: currentPath,
                color: drawColor,
                thickness: drawThickness,
                scale: 1.0,
                timestamp: new Date().toISOString()
            };
            setAnnotations(prev => [...prev, newDrawing]);
            updateProgramAnnotations(classId, programId, newDrawing);
        }
        setCurrentPath([]);
        
        if (draggingId) {
            const ann = annotations.find(a => a.id === draggingId);
            if (ann) updateProgramAnnotations(classId, programId, ann);
            setDraggingId(null);
        }
        if (resizingId) {
            const ann = annotations.find(a => a.id === resizingId);
            if (ann) updateProgramAnnotations(classId, programId, ann);
            setResizingId(null);
        }
    };

    const handleResizeStart = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setResizingId(id);
    };

    const handleDragStart = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (mode === 'view') {
            setSelectedId(id);
            setDraggingId(id);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setAnnotations(prev => prev.filter(a => a.id !== id));
        setSelectedId(null);
    };

    const handleTextUpdate = (id: string, text: string) => {
        const updated = annotations.map(a => a.id === id ? { ...a, content: text } : a);
        setAnnotations(updated);
        const ann = updated.find(a => a.id === id);
        if (ann) updateProgramAnnotations(classId, programId, ann);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            {/* Toolbar */}
            <div className="bg-slate-800 p-4 flex items-center justify-between shadow-xl z-10 shrink-0 border-b border-slate-700">
                <div className="flex items-center gap-6">
                    <button onClick={onClose} className="flex flex-col items-center text-slate-400 hover:text-white transition-colors group">
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-bold uppercase">Exit</span>
                    </button>

                    <div className="flex bg-slate-700/50 rounded-xl p-1 border border-slate-600">
                        <ToolbarButton onClick={() => setMode('view')} active={mode === 'view'} icon={MousePointer2} label="Select" color="bg-slate-500" />
                        <ToolbarButton onClick={() => setMode('pen')} active={mode === 'pen'} icon={PenTool} label="Pen" color="bg-red-600" />
                        <ToolbarButton onClick={() => setMode('sign')} active={mode === 'sign'} icon={CheckCircle} label="Sign" color="bg-blue-600" />
                        <ToolbarButton onClick={() => setMode('annotate')} active={mode === 'annotate'} icon={Type} label="Note" color="bg-yellow-600" />
                        <ToolbarButton onClick={() => setMode('link')} active={mode === 'link'} icon={LinkIcon} label="Evidence" color="bg-indigo-600" />
                    </div>

                    {mode === 'pen' && (
                        <div className="flex items-center gap-4 bg-slate-700/30 px-4 py-1 rounded-lg border border-slate-600 animate-in slide-in-from-left-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Colour</span>
                                <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} className="w-6 h-6 rounded border-none bg-transparent cursor-pointer" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Weight</span>
                                <input type="range" min="1" max="10" value={drawThickness} onChange={(e) => setDrawThickness(parseInt(e.target.value))} className="w-20 accent-red-500" />
                                <span className="text-xs font-mono text-slate-300 w-4">{drawThickness}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <button onClick={() => setIsFinalizeOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95">
                        <CheckCircle className="w-5 h-5" /> Finalise Program
                    </button>
                    <div className="flex items-center bg-slate-700/50 rounded-xl p-1 border border-slate-600">
                        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 text-slate-300 hover:text-white transition-colors"><ZoomOut className="w-5 h-5"/></button>
                        <span className="text-xs text-slate-300 w-16 text-center font-mono font-bold">{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(s => Math.min(4.0, s + 0.2))} className="p-2 text-slate-300 hover:text-white transition-colors"><ZoomIn className="w-5 h-5"/></button>
                    </div>
                    <div className="flex gap-1 items-center bg-slate-700/50 rounded-xl p-1 border border-slate-600">
                        <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 disabled:opacity-30 text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                        <span className="text-slate-300 text-xs font-bold px-4">Pg {pageNumber} / {numPages}</span>
                        <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 disabled:opacity-30 text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>

            {/* Viewport */}
            <div className="flex-1 overflow-auto bg-slate-900/80 flex justify-center p-8">
                {loading && (
                    <div className="text-slate-400 self-center flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                        <span className="font-bold uppercase tracking-widest text-xs">Loading Document...</span>
                    </div>
                )}
                {error && <div className="text-red-400 self-center bg-red-900/20 p-6 rounded-xl border border-red-500/50">{error}</div>}
                
                <div 
                    ref={wrapperRef} 
                    className={`relative shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white ${loading || error ? 'hidden' : 'block'} ${mode === 'pen' ? 'cursor-crosshair' : 'cursor-default'}`}
                    style={{ width: 'fit-content', height: 'fit-content' }}
                    onMouseDown={handleCanvasMouseDown}
                >
                    <canvas ref={canvasRef} className="block" />

                    {/* SVG Layer for Drawing - Percentages based for responsiveness with scale */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Render saved drawings */}
                        {annotations.filter(a => a.page === pageNumber && a.type === 'drawing').map(a => (
                            <polyline
                                key={a.id}
                                points={a.path?.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke={a.color || '#ef4444'}
                                strokeWidth={(a.thickness || 3) / 10}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}
                        
                        {/* Render active path */}
                        {currentPath.length > 1 && (
                            <polyline
                                points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke={drawColor}
                                strokeWidth={drawThickness / 10}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                    </svg>

                    {/* Interactive HTML Layer */}
                    {annotations.filter(a => a.page === pageNumber && a.type !== 'drawing').map(a => {
                        const isSelected = selectedId === a.id;
                        const isLink = a.content?.startsWith('LINK:');
                        const scaleVal = a.scale || 1.0;

                        return (
                            <div 
                                key={a.id}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group ${isSelected ? 'z-50' : 'z-10'}`}
                                style={{ left: `${a.x}%`, top: `${a.y}%` }}
                                onMouseDown={(e) => handleDragStart(e, a.id)}
                            >
                                <div 
                                    className={`relative p-1 border-2 transition-all ${isSelected ? 'border-brand-500 ring-4 ring-brand-500/20 shadow-2xl bg-white/10' : 'border-transparent group-hover:border-slate-300'}`}
                                    style={{ transform: `scale(${scaleVal})`, transformOrigin: 'center center' }}
                                >
                                    {a.type === 'signature' ? (
                                        teacherProfile?.signature ? (
                                            <img src={teacherProfile.signature} alt="Sig" className="h-12 w-auto mix-blend-multiply pointer-events-none" />
                                        ) : (
                                            <div className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap shadow-sm border border-white">
                                                SIGNED: {teacherProfile?.name}
                                            </div>
                                        )
                                    ) : isLink ? (
                                        <div className="flex flex-col items-center gap-1 group/tag">
                                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center hover:scale-110 transition-transform">
                                                <Paperclip className="w-5 h-5" />
                                            </div>
                                            <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap border border-white/20">
                                                {a.content?.replace('LINK:', '').trim()}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-100 text-yellow-900 p-2 rounded shadow-lg border border-yellow-200 min-w-[80px] max-w-[200px]">
                                            <textarea 
                                                className="bg-transparent text-xs outline-none w-full resize-none font-medium leading-snug border-none p-0 scrollbar-hide"
                                                defaultValue={a.content}
                                                onBlur={(e) => handleTextUpdate(a.id, e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                    )}

                                    {isSelected && (
                                        <>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center bg-slate-900 text-white rounded-lg p-1.5 shadow-2xl gap-2 border border-slate-700">
                                                <button onClick={(e) => handleDelete(e, a.id)} className="p-1 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-colors"><X className="w-4 h-4"/></button>
                                            </div>
                                            <div 
                                                className="absolute -bottom-3 -right-3 w-6 h-6 bg-brand-600 border-2 border-white rounded-full cursor-nwse-resize shadow-xl flex items-center justify-center"
                                                onMouseDown={(e) => handleResizeStart(e, a.id)}
                                            >
                                                <Plus className="w-3 h-3 text-white" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {linkModalData && (
                <ProgramLinkModal 
                    isOpen={!!linkModalData}
                    onClose={() => setLinkModalData(null)}
                    classId={classId}
                    programId={programId}
                    programName={className}
                    pageNumber={pageNumber}
                    coords={linkModalData}
                    onConfirm={(a) => { setAnnotations(prev => [...prev, a]); updateProgramAnnotations(classId, programId, a); }}
                />
            )}

            {isFinalizeOpen && (
                <FinalizeModal 
                    isOpen={isFinalizeOpen}
                    onClose={() => setIsFinalizeOpen(false)}
                    classId={classId}
                    program={{ id: programId, name: className, annotations, fileId } as any}
                    onComplete={() => { setIsFinalizeOpen(false); onClose(); }}
                />
            )}
        </div>
    );
};

const ToolbarButton = ({ onClick, active, icon: Icon, label, color }: any) => (
    <button 
        onClick={onClick}
        className={`
            flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-lg transition-all
            ${active ? `${color} text-white shadow-inner scale-95` : 'text-slate-400 hover:text-white hover:bg-slate-600/50'}
        `}
    >
        <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''}`} />
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
);
