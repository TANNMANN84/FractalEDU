
import React, { useState, useMemo } from 'react';
import { Student, StudentPlans, FileUpload, WellbeingStatus } from '@/types';
import { useAppStore } from '@/store';
import { X, Save, ChevronDown, ChevronUp, User, Plus, Trash2 } from 'lucide-react';
import { MonitoringFileUpload } from '../../monitoring/components/MonitoringFileUpload';

interface Props { 
    student: Student; 
    onClose: () => void; 
}

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

    // --- Form State ---
    const [formData, setFormData] = useState(() => {
        const s = student;
        const p = s?.profile;
        
        return {
            name: s?.name || '',
            cohort: s?.cohort || 'Year 7',
            
            // Context
            gender: p?.gender || '',
            photoUrl: p?.photoUrl || '',
            
            // Removed wellbeingStatus selector from UI but keeping data safe
            wellbeingStatus: s?.wellbeing?.status || WellbeingStatus.GREEN,
            wellbeingNotes: s?.wellbeing?.notes || '',

            attendance: p?.attendanceRate ?? 0,
            isAtsi: p?.isAtsi || s?.isAtsi || false,
            eald: p?.eald || false,
            oohc: p?.oohc || false,
            medicalConditions: getSafeMedicalConditions(student),
            
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
        for (let i = currentYearNum - 1; i >= 7; i--) {
            const yearDiff = currentYearNum - i;
            years.push({ grade: i, year: calendarYear - yearDiff });
        }
        return years;
    }, [currentYearNum, calendarYear]);

    // --- Handlers ---

    const handleSave = () => {
        const medicalArr = formData.medicalConditions.split(',').map(s => s.trim()).filter(Boolean);
        
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
                attendanceRate: formData.attendance,
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

    const updateHistory = (grade: number, field: 'positives' | 'negatives', value: string) => {
        const num = parseInt(value) || 0;
        setFormData(prev => ({
            ...prev,
            behaviourHistory: {
                ...prev.behaviourHistory,
                [grade]: {
                    ...(prev.behaviourHistory[grade] || { positives: 0, negatives: 0 }),
                    [field]: num
                }
            }
        }));
    };

    if (!student) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-brand-600" />
                        <h3 className="font-bold text-lg text-slate-800">Edit Student Context</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* 1. Identity & Context */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Core Details</label>
                            <input 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                                placeholder="Full Name" 
                            />
                            <div className="flex gap-2">
                                <select 
                                    value={formData.cohort} 
                                    onChange={e => setFormData({...formData, cohort: e.target.value})} 
                                    className="w-1/2 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                >
                                    {['Year 7','Year 8','Year 9','Year 10','Year 11','Year 12'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select 
                                    value={formData.gender} 
                                    onChange={e => setFormData({...formData, gender: e.target.value})} 
                                    className="w-1/2 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                >
                                    <option value="">Gender...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Non-binary">Non-binary</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                            </div>
                            
                            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                                <span className="text-sm text-slate-500 font-medium">Attendance Rate</span>
                                <input 
                                    type="number" 
                                    value={formData.attendance} 
                                    onChange={e => setFormData({...formData, attendance: parseFloat(e.target.value) || 0})} 
                                    className="w-full outline-none font-bold text-slate-700 bg-transparent text-sm text-right" 
                                />
                                <span className="text-sm text-slate-400">%</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Flags</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'isAtsi', label: 'ATSI' },
                                        { id: 'eald', label: 'EALD' },
                                        { id: 'oohc', label: 'OOHC' }
                                    ].map(flag => (
                                        <label key={flag.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={(formData as any)[flag.id]} 
                                                onChange={e => setFormData({...formData, [flag.id]: e.target.checked})} 
                                                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300" 
                                            />
                                            <span className="text-sm font-medium text-slate-700">{flag.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Wellbeing Notes</label>
                                <textarea
                                    value={formData.wellbeingNotes}
                                    onChange={e => setFormData({...formData, wellbeingNotes: e.target.value})}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none"
                                    placeholder="Internal notes regarding wellbeing status..."
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Medical Conditions</label>
                        <textarea 
                            value={formData.medicalConditions} 
                            onChange={e => setFormData({...formData, medicalConditions: e.target.value})} 
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-brand-500" 
                            placeholder="e.g. Asthma, Anaphylaxis"
                            rows={2}
                        />
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Support Plans</label>
                        <div className="space-y-3">
                            {(['behaviour', 'learning', 'medical'] as const).map(type => (
                                <div key={type} className={`border rounded-lg transition-all ${formData.plans[type]?.active ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                                    <div 
                                        className="flex items-center p-3 cursor-pointer select-none"
                                        onClick={() => togglePlan(type)}
                                    >
                                        <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center transition-colors ${formData.plans[type]?.active ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                            {formData.plans[type]?.active && <div className="w-2 h-2 bg-white rounded-sm" />}
                                        </div>
                                        <span className="font-bold text-sm text-slate-700 capitalize flex-1">{type} Support Plan</span>
                                        {formData.plans[type]?.active ? <ChevronUp className="w-4 h-4 text-indigo-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                                    </div>
                                    {formData.plans[type]?.active && (
                                        <div className="px-3 pb-3 space-y-3">
                                            <textarea 
                                                className="w-full p-2 text-sm border border-indigo-200 rounded bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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

                    <hr className="border-slate-100" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Concerns</h4>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    value={newConcern} 
                                    onChange={e => setNewConcern(e.target.value)} 
                                    className="flex-1 border rounded p-2 text-sm outline-none focus:border-brand-500" 
                                    placeholder="Add custom concern..." 
                                    onKeyDown={e => e.key === 'Enter' && addConcern()} 
                                />
                                <button onClick={addConcern} className="p-2 bg-slate-100 rounded hover:bg-slate-200 text-slate-600">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {formData.concerns.map((c, idx) => (
                                    <div key={idx} className="p-2 border rounded bg-amber-50 border-amber-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-xs text-amber-800">{c.label}</span>
                                            <button onClick={() => removeConcern(idx)}><Trash2 className="w-3 h-3 text-amber-400 hover:text-amber-600" /></button>
                                        </div>
                                        <input 
                                            className="w-full bg-white border border-amber-100 rounded p-1 text-xs outline-none focus:border-amber-300" 
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
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Behaviour History</label>
                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 text-slate-500 font-bold text-xs">
                                        <tr>
                                            <th className="p-2 text-left pl-3">Year</th>
                                            <th className="p-2 text-center text-green-600 w-16">Pos</th>
                                            <th className="p-2 text-center text-red-600 w-16">Neg</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {historyYears.map(({ grade, year }) => (
                                            <tr key={grade}>
                                                <td className="p-2 pl-3 font-medium text-slate-600">Yr {grade} <span className="text-slate-400 font-normal text-xs">({year})</span></td>
                                                <td className="p-1">
                                                    <input 
                                                        type="number" 
                                                        className="w-full text-center bg-white border border-slate-200 rounded p-1 text-green-700 font-bold focus:ring-1 focus:ring-green-500 outline-none text-xs"
                                                        value={formData.behaviourHistory[grade]?.positives ?? 0}
                                                        onChange={e => updateHistory(grade, 'positives', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-1 pr-2">
                                                    <input 
                                                        type="number" 
                                                        className="w-full text-center bg-white border border-slate-200 rounded p-1 text-red-700 font-bold focus:ring-1 focus:ring-red-500 outline-none text-xs"
                                                        value={formData.behaviourHistory[grade]?.negatives ?? 0}
                                                        onChange={e => updateHistory(grade, 'negatives', e.target.value)}
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

                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex items-center gap-2 shadow-sm transition-colors">
                        <Save className="w-4 h-4" /> Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
};
