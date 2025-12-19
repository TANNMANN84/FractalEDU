import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { Student, StudentTransferPackage } from '@/types';
import { X, Archive, Trash2, Download, CheckSquare, Square } from 'lucide-react';
import { storageService } from '@/services/storageService';

interface ManageStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ManageStudentsModal: React.FC<ManageStudentsModalProps> = ({ isOpen, onClose }) => {
    const { students, classes, setStudents, setClasses } = useAppStore();
    const [filter, setFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const filteredStudents = useMemo(() => {
        return students.filter(s => 
            s.name.toLowerCase().includes(filter.toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [students, filter]);

    if (!isOpen) return null;

    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredStudents.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const handleBulkAction = (action: 'archive' | 'activate' | 'delete') => {
        if (!confirm(`Are you sure you want to ${action} ${selectedIds.size} selected students?`)) return;

        if (action === 'delete') {
            setStudents(students.filter(s => !selectedIds.has(s.id)));
            // Also remove from classes
            setClasses(classes.map(c => ({
                ...c,
                studentIds: c.studentIds.filter(id => !selectedIds.has(id))
            })));
        } else {
            setStudents(students.map(s => 
                selectedIds.has(s.id) 
                    ? { ...s, status: action === 'archive' ? 'Archived' : 'Active' }
                    : s
            ));
        }
        setSelectedIds(new Set());
    };

    const handleExport = async (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        // Collect files (mock logic for now, in real app need recursive collector like legacy)
        const files: Record<string, string> = {};
        // In a real implementation, scan student object for FileUpload types and fetch content from storageService

        const pkg: StudentTransferPackage = {
            dataType: 'studentTransfer',
            student,
            files
        };

        const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${student.name.replace(/\s+/g, '_')}_transfer.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Manage Students</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
                </div>

                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white gap-4">
                    <input 
                        type="text" 
                        placeholder="Search students..." 
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="p-2 border border-slate-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    
                    {selectedIds.size > 0 && (
                        <div className="flex gap-2">
                            <button onClick={() => handleBulkAction('activate')} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200">Set Active</button>
                            <button onClick={() => handleBulkAction('archive')} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-200 flex items-center gap-1"><Archive className="w-3 h-3"/> Archive</button>
                            <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete</button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-auto bg-slate-50 p-4">
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="p-3 w-10 text-center">
                                        <button onClick={handleSelectAll}>
                                            {selectedIds.size > 0 && selectedIds.size === filteredStudents.length 
                                                ? <CheckSquare className="w-4 h-4 text-brand-600" /> 
                                                : <Square className="w-4 h-4" />}
                                        </button>
                                    </th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Cohort</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map(s => (
                                    <tr key={s.id} className={`hover:bg-slate-50 ${selectedIds.has(s.id) ? 'bg-brand-50' : ''}`}>
                                        <td className="p-3 text-center">
                                            <button onClick={() => handleToggleSelect(s.id)}>
                                                {selectedIds.has(s.id) 
                                                    ? <CheckSquare className="w-4 h-4 text-brand-600" /> 
                                                    : <Square className="w-4 h-4 text-slate-300" />}
                                            </button>
                                        </td>
                                        <td className="p-3 font-medium text-slate-700">{s.name}</td>
                                        <td className="p-3 text-slate-500">{s.cohort}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.status === 'Archived' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                                                {s.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleExport(s.id)} className="text-brand-600 hover:text-brand-800 font-medium text-xs flex items-center justify-end gap-1 ml-auto">
                                                <Download className="w-3 h-3" /> Export
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};