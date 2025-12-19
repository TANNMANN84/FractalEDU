
import React, { useState } from 'react';
import { Student, SemesterReport } from '@/types';
import { useAppStore } from '@/store';
import { X, Save, Plus, Trash2 } from 'lucide-react';

interface Props {
    student: Student;
    onClose: () => void;
}

export const AcademicDataModal: React.FC<Props> = ({ student, onClose }) => {
    const { updateStudent } = useAppStore();

    // --- State Initialization ---
    const [valid, setValid] = useState(student.academicData?.validScience || { 
        level: 4, 
        strands: { knowing: 'Medium', planning: 'Medium', problemSolving: 'Medium' } 
    });

    // Check-in: Convert array to object for easier form handling { 7: {reading: x, numeracy: y} }
    const initialCheckIn = (student.academicData?.checkIn || []).reduce((acc, curr) => {
        acc[curr.year] = { reading: curr.reading, numeracy: curr.numeracy };
        return acc;
    }, {} as Record<number, { reading: number, numeracy: number }>);

    const [checkInState, setCheckInState] = useState<Record<number, { reading: number, numeracy: number }>>(initialCheckIn);

    const [reports, setReports] = useState<SemesterReport[]>(student.academicData?.reports || []);

    // --- Handlers ---

    const handleCheckInChange = (year: number, type: 'reading' | 'numeracy', value: string) => {
        const num = parseInt(value) || 0;
        setCheckInState(prev => ({
            ...prev,
            [year]: {
                ...(prev[year] || { reading: 0, numeracy: 0 }),
                [type]: num
            }
        }));
    };

    const addReport = () => {
        const newReport: SemesterReport = { 
            year: new Date().getFullYear(), 
            semester: 1, 
            grade: 'C',
            subjects: [
                { name: 'English', grade: 'C' },
                { name: 'Mathematics', grade: 'C' },
                { name: 'Science', grade: 'C' }
            ]
        };
        setReports([newReport, ...reports]);
    };

    const updateReport = (index: number, field: keyof SemesterReport, value: any) => {
        const updated = [...reports];
        (updated[index] as any)[field] = value;
        setReports(updated);
    };

    const updateReportSubject = (reportIndex: number, subjectName: string, grade: string) => {
        const updated = [...reports];
        const subjects = updated[reportIndex].subjects || [];
        const subIndex = subjects.findIndex(s => s.name === subjectName);
        
        if (subIndex >= 0) {
            subjects[subIndex].grade = grade;
        } else {
            subjects.push({ name: subjectName, grade });
        }
        updated[reportIndex].subjects = subjects;
        setReports(updated);
    };

    const getSubjectGrade = (report: SemesterReport, subjectName: string) => {
        return report.subjects?.find(s => s.name === subjectName)?.grade || '-';
    };

    const handleSave = () => {
        // Convert checkInState back to array
        const checkInArray = Object.entries(checkInState).map(([year, scores]: [string, { reading: number, numeracy: number }]) => ({
            year: parseInt(year),
            reading: scores.reading,
            numeracy: scores.numeracy
        })).filter(c => c.reading > 0 || c.numeracy > 0);

        updateStudent(student.id, {
            academicData: {
                validScience: valid as any,
                checkIn: checkInArray,
                reports
            }
        });
        onClose();
    };

    const GRADES = ['A', 'B', 'C', 'D', 'E', 'N/A'];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Edit Academic History</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* SECTION 1: VALID Science */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-100 pb-1">VALID Science 8</h4>
                        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Overall Level (1-6)</label>
                                <select 
                                    value={valid.level} 
                                    onChange={e => setValid({...valid, level: parseInt(e.target.value) as any})}
                                    className="w-full p-2 border border-slate-300 rounded text-sm focus:border-brand-500 outline-none"
                                >
                                    {[1,2,3,4,5,6].map(l => <option key={l} value={l}>Level {l}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                {['knowing', 'planning', 'problemSolving'].map(strand => (
                                    <div key={strand} className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600 capitalize font-medium">{strand.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <select 
                                            className="border border-slate-300 rounded text-xs p-1.5 w-24 focus:border-brand-500 outline-none"
                                            value={(valid.strands as any)[strand]}
                                            onChange={e => setValid({
                                                ...valid, 
                                                strands: { ...valid.strands, [strand]: e.target.value }
                                            })}
                                        >
                                            <option value="High">High</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Low">Low</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Check-in Assessments */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-100 pb-1">Check-in Assessments (%)</h4>
                        <div className="grid grid-cols-3 gap-4">
                            {[7, 8, 9].map(year => (
                                <div key={year} className="p-3 border border-slate-200 rounded-lg bg-white">
                                    <div className="text-center font-bold text-slate-700 text-sm mb-2">Year {year}</div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">Read</span>
                                            <input 
                                                type="number" 
                                                className="w-14 p-1 border rounded text-center text-sm"
                                                placeholder="%"
                                                value={checkInState[year]?.reading || ''}
                                                onChange={e => handleCheckInChange(year, 'reading', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">Num</span>
                                            <input 
                                                type="number" 
                                                className="w-14 p-1 border rounded text-center text-sm"
                                                placeholder="%"
                                                value={checkInState[year]?.numeracy || ''}
                                                onChange={e => handleCheckInChange(year, 'numeracy', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 3: Semester Reports */}
                    <div>
                        <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-1">
                            <h4 className="text-xs font-bold text-slate-500 uppercase">Semester Reports</h4>
                            <button onClick={addReport} className="text-xs flex items-center gap-1 text-brand-600 font-bold hover:bg-brand-50 px-2 py-1 rounded transition-colors">
                                <Plus className="w-3 h-3"/> Add Year
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {reports.length === 0 && <p className="text-sm text-slate-400 italic">No reports added.</p>}
                            
                            {reports.map((r, idx) => (
                                <div key={idx} className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                                    <select 
                                        value={r.year} 
                                        onChange={e => updateReport(idx, 'year', parseInt(e.target.value))} 
                                        className="w-20 p-1.5 text-sm border border-slate-300 rounded bg-white"
                                    >
                                        {[2020, 2021, 2022, 2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    
                                    <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                                        <span className="text-xs font-bold text-slate-400 mr-2">Yr</span>
                                        <input 
                                            type="number" 
                                            value={r.grade === 'N/A' || !r.grade ? 7 : r.grade /* hacky reuse of grade field for year level if needed, but keeping separate */}
                                            className="w-8 p-1 text-sm outline-none font-bold"
                                            placeholder="7"
                                            onChange={(e) => {
                                                // Actually we probably want Year Group here (7-12) separate from Calendar Year
                                                // For now assuming 'year' is Calendar Year.
                                            }}
                                        />
                                    </div>

                                    <div className="h-6 w-px bg-slate-300 mx-1"></div>

                                    {['English', 'Mathematics', 'Science'].map(subj => (
                                        <div key={subj} className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase w-8 text-right">{subj.substring(0,3)}</span>
                                            <select 
                                                className="p-1 border border-slate-300 rounded w-12 text-sm bg-white" 
                                                value={getSubjectGrade(r, subj)}
                                                onChange={e => updateReportSubject(idx, subj, e.target.value)}
                                            >
                                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                    ))}

                                    <button 
                                        onClick={() => setReports(reports.filter((_, i) => i !== idx))} 
                                        className="ml-auto p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
                
                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg text-sm">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex items-center gap-2 shadow-sm text-sm">
                        <Save className="w-4 h-4" /> Save Data
                    </button>
                </div>
            </div>
        </div>
    );
};