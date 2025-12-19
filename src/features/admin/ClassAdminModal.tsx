
import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { ClassGroup, ClassTransferPackage } from '@/types';
import { X, Edit2, Trash2, Archive, Download, Save } from 'lucide-react';

interface ClassAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ClassAdminModal: React.FC<ClassAdminModalProps> = ({ isOpen, onClose }) => {
    const { classes, students, monitoringDocs, setClasses } = useAppStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form State
    const [editName, setEditName] = useState('');
    const [editSubject, setEditSubject] = useState('');
    const [editYear, setEditYear] = useState('');
    const [editTeacher, setEditTeacher] = useState('');

    if (!isOpen) return null;

    const startEdit = (cls: ClassGroup) => {
        setEditingId(cls.id);
        setEditName(cls.name);
        setEditSubject(cls.subject);
        setEditYear(cls.yearLevel);
        setEditTeacher(cls.teacherId);
    };

    const saveEdit = () => {
        if (editingId) {
            setClasses(classes.map(c => c.id === editingId ? { 
                ...c, 
                name: editName, 
                subject: editSubject,
                yearLevel: editYear,
                teacherId: editTeacher 
            } : c));
            setEditingId(null);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const toggleStatus = (id: string) => {
        setClasses(classes.map(c => c.id === id ? { ...c, status: c.status === 'Archived' ? 'Active' : 'Archived' } : c));
    };

    const deleteClass = (id: string) => {
        if (confirm("Are you sure? This deletes the class structure but keeps student profiles.")) {
            setClasses(classes.filter(c => c.id !== id));
        }
    };

    const exportClass = async (cls: ClassGroup) => {
        const classStudents = students.filter(s => cls.studentIds.includes(s.id));
        const doc = monitoringDocs.find(d => d.classId === cls.id) || null;
        
        // Mock file collection for now
        const files = {}; 

        const pkg: ClassTransferPackage = {
            dataType: 'classTransfer',
            classGroup: cls,
            students: classStudents,
            monitoringDoc: doc,
            files
        };

        const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cls.name.replace(/\s+/g, '_')}_package.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Manage Classes</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500 dark:text-slate-400" /></button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
                    {classes.map(cls => (
                        <div key={cls.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                            {editingId === cls.id ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Class Name</label>
                                            <input 
                                                value={editName} 
                                                onChange={e => setEditName(e.target.value)} 
                                                className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-brand-500 outline-none" 
                                                placeholder="e.g. 10x/Ma1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Subject</label>
                                            <input 
                                                value={editSubject} 
                                                onChange={e => setEditSubject(e.target.value)} 
                                                className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-brand-500 outline-none" 
                                                placeholder="e.g. Mathematics"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Year Group</label>
                                            <select 
                                                value={editYear} 
                                                onChange={e => setEditYear(e.target.value)} 
                                                className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-brand-500 outline-none"
                                            >
                                                {[7,8,9,10,11,12].map(y => <option key={y} value={y}>Year {y}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Teacher Name</label>
                                            <input 
                                                value={editTeacher} 
                                                onChange={e => setEditTeacher(e.target.value)} 
                                                className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-brand-500 outline-none" 
                                                placeholder="e.g. Mr. Smith"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button onClick={cancelEdit} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                                        <button onClick={saveEdit} className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm flex items-center gap-2">
                                            <Save className="w-4 h-4" /> Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{cls.name}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls.status === 'Archived' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                                                {cls.status || 'Active'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {cls.subject} • Year {cls.yearLevel} • {cls.teacherId} • {cls.studentIds.length} Students
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => exportClass(cls)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Export">
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => startEdit(cls)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => toggleStatus(cls.id)} className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title={cls.status === 'Archived' ? 'Activate' : 'Archive'}>
                                            <Archive className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteClass(cls.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {classes.length === 0 && <p className="text-center text-slate-400 dark:text-slate-500 py-8">No classes found.</p>}
                </div>
            </div>
        </div>
    );
};
