
import React, { useState, useMemo } from 'react';
import { Student, StudentPlans, FileUpload, WellbeingStatus } from '@/types';
import { useAppStore } from '@/store';
import { X, Save, ChevronDown, ChevronUp, User, Plus, Trash2 } from 'lucide-react';
import { MonitoringFileUpload } from '../../monitoring/components/MonitoringFileUpload';

interface Props { 
    student: Student; 
    onClose: () => void; 
}

const MEDICAL_OPTIONS = ['Allergies/Anaphylaxis', 'Diabetes', 'Epilepsy', 'Neurodevelopmental (ADHD/ASD)'];

export const EditProfileModal: React.FC<Props> = ({ student, onClose }) => { 
    const { updateStudent } = useAppStore();

    // --- Safe Data Initialization Helpers ---
    const getSafePlans = (s: Student | null | undefined): StudentPlans => {
        const safeP = s?.plans;
        const safePlan = (input: any) => ({ 
            active: input?.active || false, 
            notes: input?.notes || '', 
            file: input?.file || null 
        });
        return {
            behaviour: safePlan(safeP?.behaviour),
            learning: safePlan(safeP?.learning),
            medical: safePlan(safeP?.medical)
        };
    };

    const getSafeMedicalConditions = (s: Student | null | undefined): string => {
        const conditions = s?.profile?.medicalConditions;
        if (Array.isArray(conditions)) return conditions.join(', ');
        if (typeof conditions === 'string') return conditions;
        return '';
    };

    const getInitialMedicalTags = (s: Student | null | undefined) => {
        const conditions = s?.profile?.medicalConditions || [];
        return conditions.filter(c => MEDICAL_OPTIONS.includes(c));
    };

    // --- Form State ---
    const [formData, setFormData] = useState(() => {
        const s = student;
        const p = s?.profile;
        const medicalConditionsList = p?.medicalConditions || [];
        
        return {
            name: s?.name || '',
            cohort: s?.cohort || 'Year 7',
            
            // Context
            gender: p?.gender || '',
            photoUrl: p?.photoUrl || '',
            
            // Removed wellbeingStatus selector from UI but keeping data safe
            wellbeingStatus: s?.wellbeing?.status || WellbeingStatus.GREEN,
            wellbeingNotes: s?.wellbeing?.notes || '',

            attendanceData: p?.attendanceData || {},
            attendanceNotes: p?.attendanceNotes || '',

            isAtsi: p?.isAtsi || s?.isAtsi || false,
            eald: p?.eald || false,
            oohc: p?.oohc || false,
            medicalTags: getInitialMedicalTags(student),
            medicalNotes: medicalConditionsList.filter(c => !MEDICAL_OPTIONS.includes(c)).join(', '),
            
            plans: getSafePlans(student),
            behaviourHistory: s?.behaviourHistory || {},
            
            // Transform object to array for easier dynamic editing
            concerns: Object.entries(s?.concerns || {}).map(([k, v]) => ({ id: k, label: k, note: v }))
        };
    });

    const [newConcern, setNewConcern] = useState('');

    // --- Helpers ---
    const getYearNumber = (c: any) => {
        if(!c || typeof c !== 'string') return 7;
        const match = c.match(/\d+/);
        return match ? parseInt(match[0]) : 7;
    };

    const currentYearNum = Math.min(Math.max(getYearNumber(formData.cohort), 7), 12);
    const calendarYear = new Date().getFullYear();
    
    const historyYears = useMemo(() => {
        const years = [];
        for (let i = currentYearNum; i >= 7; i--) {
            const yearDiff = currentYearNum - i;
            years.push({ grade: i, year: calendarYear - yearDiff });
        }
        return years;
    }, [currentYearNum, calendarYear]);

    // --- Handlers ---

    const handleSave = () => {
        const medicalArr = [
            ...formData.medicalTags,
            ...formData.medicalNotes.split(',').map(s => s.trim()).filter(Boolean)
        ];
        
        // Convert concerns array back to object
        const concernsObj: Record<string, string> = {};
        formData.concerns.forEach(c => {
            if (c.label.trim()) {
                concernsObj[c.label] = c.note;
            }
        });

        updateStudent(student.id, {
            name: formData.name,
            cohort: formData.cohort as any,
            isAtsi: formData.isAtsi, 
            
            wellbeing: {
                ...student.wellbeing,
                // Status not updated from here anymore
                notes: formData.wellbeingNotes,
                lastUpdated: new Date().toISOString()
            },

            profile: {
                ...student.profile,
                photoUrl: formData.photoUrl,
                gender: formData.gender,
                attendanceData: formData.attendanceData,
                attendanceNotes: formData.attendanceNotes,
                medicalConditions: medicalArr,
                isAtsi: formData.isAtsi,
                eald: formData.eald,
                oohc: formData.oohc
            },

            plans: formData.plans,
            behaviourHistory: formData.behaviourHistory,
            concerns: concernsObj
        });
        onClose();
    };

    const handleAttendanceChange = (year: number, term: 'term1' | 'term2' | 'term3' | 'term4', value: string) => {
        const num = parseFloat(value);
        setFormData(prev => ({
            ...prev,
            attendanceData: {
                ...prev.attendanceData,
                [year]: {
                    ...(prev.attendanceData[year] || {}),
                    [term]: isNaN(num) ? undefined : num
                }
            }
        }));
    };

    const toggleMedicalTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            medicalTags: prev.medicalTags.includes(tag) ? prev.medicalTags.filter(t => t !== tag) : [...prev.medicalTags, tag]
        }));
    };

    // Plan Handlers
    const togglePlan = (type: keyof StudentPlans) => {
        setFormData(prev => ({
            ...prev,
            plans: {
                ...prev.plans,
                [type]: { 
                    ...prev.plans[type], 
                    active: !prev.plans[type].active 
                }
            }
        }));
    };

    const updatePlanNotes = (type: keyof StudentPlans, notes: string) => {
        setFormData(prev => ({
            ...prev,
            plans: {
                ...prev.plans,
                [type]: { ...prev.plans[type], notes }
            }
        }));
    };

    const updatePlanFile = (type: keyof StudentPlans, file: FileUpload | null) => {
        setFormData(prev => ({
            ...prev,
            plans: {
                ...prev.plans,
                [type]: { ...prev.plans[type], file }
            }
        }));
    };

    // Concern Handlers
    const addConcern = () => {
        if (!newConcern.trim()) return;
        setFormData(prev => ({
            ...prev,
            concerns: [...prev.concerns, { id: crypto.randomUUID(), label: newConcern, note: '' }]
        }));
        setNewConcern('');
    };

    const removeConcern = (index: number) => {
        setFormData(prev => ({
            ...prev,
            concerns: prev.concerns.filter((_, i) => i !== index)
        }));
    };

    const updateConcernNote = (index: number, note: string) => {
        setFormData(prev => ({
            ...prev,
            concerns: prev.concerns.map((c, i) => i === index ? { ...c, note } : c)
        }));
    };

    const updateHistory = (grade: number, field: string, value: string) => {
        const num = parseInt(value) || 0;
        setFormData(prev => ({
            ...prev,
            behaviourHistory: {
                ...prev.behaviourHistory,
                [grade]: {
                    ...(prev.behaviourHistory[grade] || { positives: 0, negatives: 0, lst: 0, data: 0 }),
                    [field]: num
                }
            }
        }));
    };

    const attendanceYears = useMemo(() => {
        const years = [];
        for (let i = 7; i <= currentYearNum; i++) years.push(i);
        return years;
    }, [currentYearNum]);

    if (!student) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-brand-600" />
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Edit Student Details</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* 1. Identity & Context */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Core Details</label>
                            <input 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none" 
                                placeholder="Full Name" 
                            />
                            <div className="flex gap-2">
                                <select 
                                    value={formData.cohort} 
                                    onChange={e => setFormData({...formData, cohort: e.target.value})} 
                                    className="w-1/2 p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none"
                                >
                                    {['Year 7','Year 8','Year 9','Year 10','Year 11','Year 12'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select 
                                    value={formData.gender} 
                                    onChange={e => setFormData({...formData, gender: e.target.value})} 
                                    className="w-1/2 p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none"
                                >
                                    <option value="">Gender...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Non-binary">Non-binary</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Attendance History</label>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-5 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center py-1 border-b border-slate-200 dark:border-slate-700">
                                        <div>Year</div>
                                        <div>T1</div>
                                        <div>T2</div>
                                        <div>T3</div>
                                        <div>T4</div>
                                    </div>
                                    {attendanceYears.map(year => (
                                        <div key={year} className="grid grid-cols-5 text-sm border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <div className="py-1.5 px-2 font-bold text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-center">{year}</div>
                                            {(['term1', 'term2', 'term3', 'term4'] as const).map(term => (
                                                <div key={term} className="border-l border-slate-100 dark:border-slate-800">
                                                    <input 
                                                        type="number" 
                                                        className="w-full h-full text-center bg-transparent outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 transition-colors text-slate-700 dark:text-slate-200"
                                                        placeholder="-"
                                                        value={formData.attendanceData[year]?.[term] ?? ''}
                                                        onChange={e => handleAttendanceChange(year, term, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Flags</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'isAtsi', label: 'ATSI' },
                                        { id: 'eald', label: 'EALD' }
                                    ].map(flag => (
                                        <label key={flag.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={(formData as any)[flag.id]} 
                                                onChange={e => setFormData({...formData, [flag.id]: e.target.checked})} 
                                                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300 dark:border-slate-600" 
                                            />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{flag.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Wellbeing Notes</label>
                                <textarea
                                    value={formData.wellbeingNotes}
                                    onChange={e => setFormData({...formData, wellbeingNotes: e.target.value})}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none"
                                    placeholder="Internal notes regarding wellbeing status..."
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Attendance Notes</label>
                                <textarea
                                    value={formData.attendanceNotes}
                                    onChange={e => setFormData({...formData, attendanceNotes: e.target.value})}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none"
                                    placeholder="Trends or comments on attendance..."
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Medical</label>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex flex-col gap-2 min-w-[200px]">
                                {MEDICAL_OPTIONS.map(option => (
                                    <label key={option} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.medicalTags.includes(option)}
                                            onChange={() => toggleMedicalTag(option)}
                                            className="rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-600"
                                        />
                                        {option}
                                    </label>
                                ))}
                            </div>
                            <textarea 
                                value={formData.medicalNotes} 
                                onChange={e => setFormData({...formData, medicalNotes: e.target.value})} 
                                className="flex-1 p-3 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 transition-colors outline-none focus:ring-2 focus:ring-brand-500" 
                                placeholder="Other medical conditions or details..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Support Plans</label>
                        <div className="space-y-3">
                            {(['behaviour', 'learning', 'medical'] as const).map(type => (
                                <div key={type} className={`border rounded-lg transition-all ${formData.plans[type]?.active ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                    <div 
                                        className="flex items-center p-3 cursor-pointer select-none"
                                        onClick={() => togglePlan(type)}
                                    >
                                        <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center transition-colors ${formData.plans[type]?.active ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                                            {formData.plans[type]?.active && <div className="w-2 h-2 bg-white rounded-sm" />}
                                        </div>
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200 capitalize flex-1">{type} Support Plan</span>
                                        {formData.plans[type]?.active ? <ChevronUp className="w-4 h-4 text-indigo-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                                    </div>
                                    {formData.plans[type]?.active && (
                                        <div className="px-3 pb-3 space-y-3">
                                            <textarea 
                                                className="w-full p-2 text-sm border border-indigo-200 dark:border-indigo-800 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder={`Plan details or links...`}
                                                rows={2}
                                                value={formData.plans[type]?.notes || ''}
                                                onChange={e => updatePlanNotes(type, e.target.value)}
                                            />
                                            <MonitoringFileUpload 
                                                label="Attach Plan Document"
                                                file={formData.plans[type].file || null}
                                                onUpload={(f) => updatePlanFile(type, f)}
                                                onRemove={() => updatePlanFile(type, null)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Concerns</h4>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    value={newConcern} 
                                    onChange={e => setNewConcern(e.target.value)} 
                                    className="flex-1 border border-slate-300 dark:border-slate-700 rounded p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500" 
                                    placeholder="Add custom concern..." 
                                    onKeyDown={e => e.key === 'Enter' && addConcern()} 
                                />
                                <button onClick={addConcern} className="p-2 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {formData.concerns.map((c, idx) => (
                                    <div key={idx} className="p-2 border rounded bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-xs text-amber-800 dark:text-amber-200">{c.label}</span>
                                            <button onClick={() => removeConcern(idx)}><Trash2 className="w-3 h-3 text-amber-400 hover:text-amber-600" /></button>
                                        </div>
                                        <input 
                                            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-amber-100 dark:border-amber-800 rounded p-1 text-xs outline-none focus:border-amber-300" 
                                            placeholder="Notes..." 
                                            value={c.note} 
                                            onChange={e => updateConcernNote(idx, e.target.value)} 
                                        />
                                    </div>
                                ))}
                                {formData.concerns.length === 0 && <p className="text-xs text-slate-400 italic">No active concerns.</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Wellbeing History</label>
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-xs">
                                        <tr>
                                            <th className="p-2 text-left pl-3">Year</th>
                                            <th className="p-2 text-center text-green-600 w-16">Pos</th>
                                            <th className="p-2 text-center text-red-600 w-16">Neg</th>
                                            <th className="p-2 text-center text-teal-600 w-16">LST</th>
                                            <th className="p-2 text-center text-blue-600 w-16">Data</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {historyYears.map(({ grade, year }) => (
                                            <tr key={grade}>
                                                <td className="p-2 pl-3 font-medium text-slate-600 dark:text-slate-300">Yr {grade} <span className="text-slate-400 font-normal text-xs">({year})</span></td>
                                                <td className="p-1">
                                                    <input 
                                                        type="number" 
                                                        className="w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-green-700 dark:text-green-400 font-bold focus:ring-1 focus:ring-green-500 outline-none text-xs"
                                                        value={formData.behaviourHistory[grade]?.positives || ''}
                                                        onChange={e => updateHistory(grade, 'positives', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-1 pr-2">
                                                    <input 
                                                        type="number" 
                                                        className="w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-red-700 dark:text-red-400 font-bold focus:ring-1 focus:ring-red-500 outline-none text-xs"
                                                        value={formData.behaviourHistory[grade]?.negatives || ''}
                                                        onChange={e => updateHistory(grade, 'negatives', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-1 pr-2">
                                                    <input 
                                                        type="number" 
                                                        className="w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-teal-700 dark:text-teal-400 font-bold focus:ring-1 focus:ring-teal-500 outline-none text-xs"
                                                        value={(formData.behaviourHistory[grade] as any)?.lst || ''}
                                                        onChange={e => updateHistory(grade, 'lst', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-1 pr-2">
                                                    <input 
                                                        type="number" 
                                                        className="w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-blue-700 dark:text-blue-400 font-bold focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                                                        value={(formData.behaviourHistory[grade] as any)?.data || ''}
                                                        onChange={e => updateHistory(grade, 'data', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex items-center gap-2 shadow-sm transition-colors">
                        <Save className="w-4 h-4" /> Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
};
