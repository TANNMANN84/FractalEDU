
import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { ClassGroup, Student } from '@/types';
import { X, Save, ArrowRight, ArrowLeft, Search } from 'lucide-react';

interface Props {
    classGroup: ClassGroup;
    onClose: () => void;
}

export const ManageClassStudentsModal: React.FC<Props> = ({ classGroup, onClose }) => {
    const { students, updateClass } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Local state for the operation
    const [enrolledIds, setEnrolledIds] = useState<string[]>(classGroup.studentIds);

    // Filter available students: Must be same cohort, not already in class
    const availableStudents = useMemo(() => {
        // Extract "10" from "Year 10" or "10"
        const classYear = classGroup.yearLevel.replace(/\D/g, ''); 
        
        return students.filter(s => {
            const studentYear = s.cohort.replace(/\D/g, '');
            const matchesYear = studentYear === classYear;
            const notEnrolled = !enrolledIds.includes(s.id);
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesYear && notEnrolled && matchesSearch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [students, classGroup.yearLevel, enrolledIds, searchTerm]);

    const enrolledList = useMemo(() => {
        return students
            .filter(s => enrolledIds.includes(s.id))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [students, enrolledIds]);

    const handleAdd = (id: string) => setEnrolledIds([...enrolledIds, id]);
    const handleRemove = (id: string) => setEnrolledIds(enrolledIds.filter(e => e !== id));

    const handleSave = () => {
        updateClass(classGroup.id, { studentIds: enrolledIds });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Manage Enrollment: {classGroup.name}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* Available Column */}
                    <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50">
                        <div className="p-3 border-b border-slate-200">
                            <div className="relative">
                                <Search className="absolute left-2 top-2 w-4 h-4 text-slate-400" />
                                <input 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder={`Search Year ${classGroup.yearLevel} students...`}
                                />
                            </div>
                            <div className="mt-2 text-xs font-bold text-slate-500 uppercase">Available ({availableStudents.length})</div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {availableStudents.map(s => (
                                <div key={s.id} onClick={() => handleAdd(s.id)} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-brand-400 hover:shadow-sm group transition-all">
                                    <span className="text-sm font-medium text-slate-700">{s.name}</span>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500" />
                                </div>
                            ))}
                            {availableStudents.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No matching students found.</p>}
                        </div>
                    </div>

                    {/* Enrolled Column */}
                    <div className="flex-1 flex flex-col bg-white">
                        <div className="p-3 border-b border-slate-200 bg-white">
                            <div className="h-[38px] flex items-center">
                                <span className="text-sm font-bold text-slate-800">Enrolled Students</span>
                            </div>
                            <div className="mt-2 text-xs font-bold text-slate-500 uppercase">Current Class List ({enrolledList.length})</div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {enrolledList.map(s => (
                                <div key={s.id} onClick={() => handleRemove(s.id)} className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-lg cursor-pointer hover:bg-red-50 hover:border-red-200 group transition-all">
                                    <span className="text-sm font-medium text-slate-700">{s.name}</span>
                                    <X className="w-4 h-4 text-green-400 group-hover:text-red-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm text-sm font-bold">
                        <Save className="w-4 h-4" /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
