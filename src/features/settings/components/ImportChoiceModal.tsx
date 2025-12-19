
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { ReviewPackage, BackupFile } from '@/types';
import { X, Check, AlertCircle, Database, FileText, Users, Layout } from 'lucide-react';

interface ImportChoiceModalProps {
  packageData: any; // ReviewPackage | any[] | BackupFile
  importType: 'review' | 'students' | 'backup';
  onClose: () => void;
  onReview: (pkg: ReviewPackage) => void;
  onMerge: (pkg: ReviewPackage) => void;
  onMergeStudents: (studentsToImport: any[]) => void;
  onRestoreBackup: (data: any) => void;
}

export const ImportChoiceModal: React.FC<ImportChoiceModalProps> = ({
  packageData,
  importType,
  onClose,
  onReview,
  onMerge,
  onMergeStudents,
  onRestoreBackup
}) => {
  const { students } = useAppStore();
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  // State for student import
  const [studentPreview, setStudentPreview] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    dialogRef.current?.showModal();
    
    if (importType === 'students') {
      // Analyze incoming students vs existing
      const preview = (packageData as any[]).map((incoming) => {
        // Simple fuzzy match on name
        const match = students.find(s => 
            s.name.toLowerCase() === incoming.name?.toLowerCase() ||
            (s.name.toLowerCase().includes(incoming.firstName?.toLowerCase()) && s.name.toLowerCase().includes(incoming.lastName?.toLowerCase()))
        );
        return {
          ...incoming,
          isDuplicate: !!match,
          existingId: match?.id
        };
      });
      setStudentPreview(preview);
      // Auto-select new students
      const newIndices = new Set(preview.map((s, i) => !s.isDuplicate ? i : -1).filter(i => i !== -1));
      setSelectedIndices(newIndices);
    }
  }, [packageData, importType, students]);

  const handleToggle = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const handleConfirmStudents = () => {
    const selected = studentPreview.filter((_, i) => selectedIndices.has(i));
    onMergeStudents(selected);
    onClose();
  };

  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  // --- Render Backup Preview ---
  if (importType === 'backup') {
      const backup = packageData as BackupFile;
      const appData = backup.appData || {};
      const fileCount = Object.keys(backup.files || {}).length;
      
      return (
        <dialog ref={dialogRef} className="p-0 rounded-xl shadow-2xl w-full max-w-lg backdrop:bg-black/50 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Database className="w-5 h-5 text-brand-600 dark:text-brand-400" /> System Backup Found
                </h2>
                <button onClick={handleClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-6 space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Warning: Data Overwrite</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            Restoring this backup will <strong>completely replace</strong> all current data on this device. This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                        <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{appData.students?.length || 0}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase">Students</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                        <Layout className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{appData.classes?.length || 0}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase">Classes</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                        <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{appData.monitoringDocs?.length || 0}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase">Monitoring Docs</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                        <Database className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{fileCount}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase">Evidence Files</div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button onClick={handleClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">Cancel</button>
                <button 
                    onClick={() => onRestoreBackup(packageData)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm text-sm font-bold flex items-center gap-2"
                >
                    <Database className="w-4 h-4" /> Restore System Data
                </button>
            </div>
        </dialog>
      );
  }

  // --- Render Review Package Choice ---
  if (importType === 'review') {
    const pkg = packageData as ReviewPackage;
    return (
      <dialog ref={dialogRef} className="p-0 rounded-xl shadow-2xl w-full max-w-lg backdrop:bg-black/50 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2">Review Package Detected</h2>
          <button onClick={handleClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-sm">
            <p className="font-semibold">Class: {pkg.classGroup.name}</p>
            <p>From: {pkg.monitoringDoc.teacherSignOff['1'].teacherName || 'Unknown Teacher'}</p>
          </div>
          
          <p className="text-slate-600 dark:text-slate-400 text-sm">How would you like to proceed?</p>
          
          <div className="space-y-3">
            <button onClick={() => onReview(pkg)} className="w-full text-left p-4 border border-slate-300 dark:border-slate-600 rounded-xl hover:border-brand-500 hover:ring-1 hover:ring-brand-200 transition-all bg-white dark:bg-slate-800 group">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">Open in Review Mode</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose this if you are a <strong className="text-slate-700 dark:text-slate-300">Head Teacher</strong>. Opens a read-only view to sign off.</p>
            </button>
            
            <button onClick={() => onMerge(pkg)} className="w-full text-left p-4 border border-slate-300 dark:border-slate-600 rounded-xl hover:border-green-500 hover:ring-1 hover:ring-green-200 transition-all bg-white dark:bg-slate-800 group">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-green-600 dark:group-hover:text-green-400">Merge Signatures</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose this if you are the <strong className="text-slate-700 dark:text-slate-300">Teacher</strong> and received a signed file back.</p>
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button onClick={handleClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">Cancel</button>
        </div>
      </dialog>
    );
  }

  // --- Render Student Import Choice ---
  if (importType === 'students') {
    return (
      <dialog ref={dialogRef} className="p-0 rounded-xl shadow-2xl w-full max-w-3xl backdrop:bg-black/50 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold">Import Students</h2>
          <button onClick={handleClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Found <strong>{studentPreview.length}</strong> rows. Verify the data below before importing:
            </p>
            
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 w-10"></th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Cohort</th>
                            <th className="p-3">Gender</th>
                            <th className="p-3 text-center">ATSI</th>
                            <th className="p-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {studentPreview.map((s, idx) => (
                            <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${s.isDuplicate ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                                <td className="p-3">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIndices.has(idx)}
                                        onChange={() => handleToggle(idx)}
                                        className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
                                    />
                                </td>
                                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                                    {s.name || `${s.firstName} ${s.lastName}`}
                                </td>
                                <td className="p-3 text-slate-500">{s.cohort || s.yearGroup || '-'}</td>
                                <td className="p-3 text-slate-500">{s.gender || '-'}</td>
                                <td className="p-3 text-center">
                                    {['yes', 'y', 'true', '1'].includes(String(s.atsistatus || '').toLowerCase()) ? (
                                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-200 dark:border-yellow-800">Yes</span>
                                    ) : (
                                        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">No</span>
                                    )}
                                </td>
                                <td className="p-3 text-center">
                                    {s.isDuplicate ? (
                                        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">Exists</span>
                                    ) : (
                                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">New</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            <button onClick={handleClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">Cancel</button>
            <button 
                onClick={handleConfirmStudents}
                disabled={selectedIndices.size === 0}
                className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm text-sm font-bold flex items-center gap-2 disabled:opacity-50"
            >
                <Check className="w-4 h-4" /> Import {selectedIndices.size} Students
            </button>
        </div>
      </dialog>
    );
  }

  return null;
};
