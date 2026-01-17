
import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { ClassProgram } from '@/types';
import { storageService } from '@/services/storageService';
import { Upload, FileText, CheckCircle, ExternalLink, PenTool, Loader2 } from 'lucide-react';
import { ProgramViewer } from './ProgramViewer';

interface Props {
    classId: string;
}

export const ProgramManager: React.FC<Props> = ({ classId }) => {
    const { classes, addClassProgram } = useAppStore();
    const classGroup = classes.find(c => c.id === classId);
    
    const [selectedProgram, setSelectedProgram] = useState<ClassProgram | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!classGroup) return null;

    const activePrograms = classGroup.programs?.filter(p => p.status === 'active') || [];
    const finalizedPrograms = classGroup.programs?.filter(p => p.status === 'finalized') || [];

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            alert('Only PDF files are supported for teaching programs.');
            return;
        }

        setIsUploading(true);
        try {
            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                const fileId = `prog-${crypto.randomUUID()}`;
                
                // Save to storage
                await storageService.saveFileContent(fileId, base64);
                
                // Update Store
                const newProgram: ClassProgram = {
                    id: crypto.randomUUID(),
                    name: file.name,
                    fileId: fileId,
                    dateAdded: new Date().toISOString(),
                    status: 'active',
                    annotations: []
                };
                
                addClassProgram(classId, newProgram);
                setIsUploading(false);
            };
        } catch (err) {
            console.error(err);
            alert('Failed to upload file');
            setIsUploading(false);
        }
    };

    if (selectedProgram) {
        return (
            <ProgramViewer 
                classId={classId}
                programId={selectedProgram.id}
                fileId={selectedProgram.fileId}
                initialAnnotations={selectedProgram.annotations}
                onClose={() => setSelectedProgram(null)} 
            />
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Upload Area */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Teaching Programs</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Upload PDF programs to digitally sign, annotate, and register for monitoring.</p>
                    </div>
                    <label className={`
                        flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 
                        transition-colors shadow-sm font-medium cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}>
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}
                        {isUploading ? 'Uploading...' : 'Upload Program PDF'}
                        <input type="file" className="hidden" accept="application/pdf" onChange={handleUpload} disabled={isUploading} />
                    </label>
                </div>
            </div>

            {/* Active Programs */}
            <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-brand-500" /> Active Programs (Click to Edit)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activePrograms.length > 0 ? activePrograms.map(prog => (
                        <div 
                            key={prog.id}
                            onClick={() => setSelectedProgram(prog)}
                            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-700 dark:group-hover:text-brand-400">{prog.name}</h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Added {new Date(prog.dateAdded).toLocaleDateString()}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-800 font-bold">
                                            {prog.annotations.length} Annotations
                                        </span>
                                    </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand-400" />
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                            No active programs. Upload one to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* Finalised Programs */}
            {finalizedPrograms.length > 0 && (
                <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Finalised & Registered
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {finalizedPrograms.map(prog => (
                            <div 
                                key={prog.id}
                                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100 transition-opacity"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-slate-700 dark:text-slate-200 truncate">{prog.name}</h5>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Registered in Monitoring</p>
                                        <button 
                                            onClick={() => storageService.triggerDownload({
                                                id: prog.fileId, name: prog.name,
                                                incident: undefined,
                                                type: undefined
                                            })}
                                            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                            Download Flattened PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
