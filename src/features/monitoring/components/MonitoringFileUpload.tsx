import React from 'react';
import { FileUpload } from '@/types';
import { storageService } from '@/services/storageService';
import { Upload, Trash2, FileText } from 'lucide-react';

interface MonitoringFileUploadProps {
    file: FileUpload | null;
    onUpload: (file: FileUpload) => void;
    onRemove: () => void;
    label: string;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const MonitoringFileUpload: React.FC<MonitoringFileUploadProps> = ({ file, onUpload, onRemove, label }) => {
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            try {
                const base64 = await fileToBase64(selectedFile);
                const newFileId = `file-${crypto.randomUUID()}`;
                await storageService.saveFileContent(newFileId, base64);
                onUpload({ id: newFileId, name: selectedFile.name });
            } catch (error) {
                console.error("Error saving file to DB", error);
                alert("Could not upload file. Please try again.");
            }
        }
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            {file ? (
                <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg w-full group">
                    <button 
                        onClick={() => storageService.triggerDownload(file)} 
                        className="text-sm text-blue-600 hover:underline truncate flex items-center gap-2" 
                        title={file.name}
                    >
                        <FileText className="w-4 h-4" />
                        {file.name}
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-full transition-colors"
                        aria-label="Remove file"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="mt-1">
                    <label className="inline-flex items-center gap-2 text-sm bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors shadow-sm font-medium">
                        <Upload className="w-4 h-4" />
                        <span>Upload File</span>
                        <input type="file" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>
            )}
        </div>
    );
};