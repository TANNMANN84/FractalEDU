
import React, { useState } from 'react';
import { X, Save, Link as LinkIcon, CheckSquare, Square } from 'lucide-react';
import { useAppStore } from '@/store';
import { Student, EvidenceLogEntry, Annotation } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
    programId: string;
    programName: string;
    pageNumber: number;
    coords: { x: number; y: number };
    onConfirm: (annotation: Annotation) => void;
}

export const ProgramLinkModal: React.FC<Props> = ({ 
    isOpen, onClose, classId, programId, programName, pageNumber, coords, onConfirm 
}) => {
    const { students, classes, addEvidence } = useAppStore();
    const classGroup = classes.find(c => c.id === classId);
    
    // Filter students in this class
    const classStudents = students
        .filter(s => classGroup?.studentIds.includes(s.id))
        .sort((a, b) => a.name.localeCompare(b.name));

    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [adjustmentType, setAdjustmentType] = useState('Differentiation');
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    const toggleStudent = (id: string) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedStudentIds(newSet);
    };

    const handleSave = () => {
        if (selectedStudentIds.size === 0) {
            alert("Please select at least one student.");
            return;
        }

        // 1. Generate Annotation
        const newAnnotation: Annotation = {
            id: crypto.randomUUID(),
            type: 'text', // We use 'text' type but render a link icon based on content prefix
            page: pageNumber,
            x: coords.x,
            y: coords.y,
            content: `LINK: ${adjustmentType} (${selectedStudentIds.size} students)`,
            timestamp: new Date().toISOString()
        };

        // 2. Generate Evidence Logs
        selectedStudentIds.forEach(studentId => {
            const studentName = students.find(s => s.id === studentId)?.name || 'Student';
            
            const log: EvidenceLogEntry = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                type: 'Learning Support',
                content: `Program Adjustment (${adjustmentType}): ${note}\n\nRef: ${programName} (Page ${pageNumber})`,
                author: 'Current Teacher',
                tags: ['Program Link', 'Differentiation'],
                adjustments: [adjustmentType]
            };
            
            addEvidence(studentId, log);
        });

        onConfirm(newAnnotation);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-indigo-600" /> Link Students to Program
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    
                    {/* Strategy Details */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Adjustment Type</label>
                            <select 
                                value={adjustmentType}
                                onChange={(e) => setAdjustmentType(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option>Differentiation</option>
                                <option>Extension / HPGE</option>
                                <option>Assessment Modification</option>
                                <option>Scaffolding</option>
                                <option>Cultural Perspective</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Context / Notes</label>
                            <textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Describe the adjustment provided..."
                            />
                        </div>
                    </div>

                    {/* Student Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Students</label>
                        <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {classStudents.map(s => (
                                <button 
                                    key={s.id}
                                    onClick={() => toggleStudent(s.id)}
                                    className={`w-full flex items-center gap-3 p-2 text-left hover:bg-slate-50 transition-colors ${selectedStudentIds.has(s.id) ? 'bg-indigo-50' : ''}`}
                                >
                                    {selectedStudentIds.has(s.id) 
                                        ? <CheckSquare className="w-4 h-4 text-indigo-600" /> 
                                        : <Square className="w-4 h-4 text-slate-300" />
                                    }
                                    <span className={`text-sm ${selectedStudentIds.has(s.id) ? 'font-bold text-indigo-900' : 'text-slate-700'}`}>
                                        {s.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-right">
                            {selectedStudentIds.size} selected
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm text-sm font-bold flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Link & Log Evidence
                    </button>
                </div>
            </div>
        </div>
    );
};
