
import React, { useState } from 'react';
import { Student, NCCDCategory } from '@/types';
import { useAppStore } from '@/store';
import { STRATEGY_BANK } from '../../data/strategyBank';
import { Check, Brain, Activity, User, Ear, Flag, Plus, X } from 'lucide-react';

interface Props {
    student: Student;
    onAddEvidence: (strategy: string) => void;
}

export const NeedsAdjustments: React.FC<Props> = ({ student, onAddEvidence }) => {
    const { updateStudent } = useAppStore();

    const nccd = student.nccd || { 
        isNCCD: false,
        level: 'QDTP', 
        categories: [], 
        active: false, 
        impactStatement: '', 
        consultationDate: '' 
    };
    
    const profile = student.profile || {};
    const activeAdjIds = new Set(student.adjustments?.filter(a => a.active).map(a => a.description) || []);

    // --- Flag Helpers ---
    const [isCreatingFlag, setIsCreatingFlag] = useState(false);
    const [newFlagLabel, setNewFlagLabel] = useState('');
    const [newFlagColor, setNewFlagColor] = useState('bg-indigo-100 text-indigo-800 border-indigo-200');

    const hasFlag = (id: string) => profile.customFlags?.some(f => f.id === id);
    
    const toggleFlag = (id: string, label: string, color: string) => {
        const current = profile.customFlags || [];
        const exists = current.find(f => f.id === id);
        let newFlags;

        if (exists) {
            newFlags = current.filter(f => f.id !== id);
        } else {
            newFlags = [...current, { id, label, color }];
        }
        
        updateStudent(student.id, { 
            profile: { ...profile, customFlags: newFlags } 
        });
    };

    const handleCreateFlag = () => {
        if (!newFlagLabel.trim()) return;
        const id = `custom_${crypto.randomUUID()}`;
        toggleFlag(id, newFlagLabel, newFlagColor);
        setIsCreatingFlag(false);
        setNewFlagLabel('');
    };

    // --- NCCD Helpers ---
    const handleNccdUpdate = (updates: Partial<typeof nccd>) => {
        updateStudent(student.id, {
            nccd: { ...nccd, ...updates, active: true }
        });
    };

    const toggleCategory = (cat: NCCDCategory) => {
        const current = nccd.categories || [];
        // Legacy Support: If categories is undefined but category string exists, migrate it
        const safeCurrent = current.length === 0 && (nccd as any).category 
            ? [(nccd as any).category] 
            : current;

        const newCats = safeCurrent.includes(cat) 
            ? safeCurrent.filter(c => c !== cat) 
            : [...safeCurrent, cat];
            
        handleNccdUpdate({ categories: newCats });
    };

    // --- Strategy Toggle ---
    const toggleStrategy = (strategy: string, category: string) => {
        const currentAdjustments = student.adjustments || [];
        const exists = currentAdjustments.find(a => a.description === strategy);
        let newAdjustments;

        if (exists) {
            newAdjustments = currentAdjustments.map(a => 
                a.description === strategy ? { ...a, active: !a.active } : a
            );
        } else {
            newAdjustments = [...currentAdjustments, {
                id: crypto.randomUUID(),
                description: strategy,
                category: category as any,
                active: true
            }];
        }
        
        updateStudent(student.id, { adjustments: newAdjustments });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* 1. Student Flags (Replaces Consultation) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-indigo-500" /> Student Flags
                </h3>
                <div className="flex flex-wrap gap-3">
                    {/* Standard Flags */}
                    {[
                        { id: 'lit', label: 'Literacy Support', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                        { id: 'num', label: 'Numeracy Support', color: 'bg-green-100 text-green-800 border-green-200' },
                        { id: 'hpge', label: 'HPGE', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                        { id: 'learning_centre', label: 'Learning Centre Booking', color: 'bg-purple-100 text-purple-800 border-purple-200' },
                    ].map(flag => {
                        const isActive = hasFlag(flag.id);
                        return (
                            <button 
                                key={flag.id} 
                                onClick={() => toggleFlag(flag.id, flag.label, flag.color)} 
                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all flex items-center gap-2 ${
                                    isActive 
                                    ? flag.color 
                                    : 'bg-slate-50 text-slate-500 border-slate-200 opacity-60 hover:opacity-100'
                                }`}
                            >
                                {isActive && <Check className="w-3 h-3" />} {flag.label}
                            </button>
                        );
                    })}

                    {/* Existing Custom Flags */}
                    {profile.customFlags?.filter(f => f.id.startsWith('custom_')).map(flag => (
                        <button key={flag.id} onClick={() => toggleFlag(flag.id, flag.label, flag.color)} className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${flag.color} flex items-center gap-2`}>
                            {flag.label} <X className="w-3 h-3 hover:text-red-600" onClick={(e) => { e.stopPropagation(); toggleFlag(flag.id, '', ''); }} />
                        </button>
                    ))}

                    {/* Create New Trigger */}
                    {!isCreatingFlag ? (
                        <button 
                            onClick={() => setIsCreatingFlag(true)} 
                            className="px-3 py-2 rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-brand-600 hover:border-brand-300 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Custom
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-full border border-slate-300">
                            <input 
                                autoFocus 
                                className="bg-transparent text-xs font-bold outline-none pl-2 w-24" 
                                placeholder="Label..." 
                                value={newFlagLabel} 
                                onChange={e => setNewFlagLabel(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && handleCreateFlag()}
                            />
                            <div className="flex gap-1">
                                {['bg-pink-100 text-pink-800 border-pink-200', 'bg-cyan-100 text-cyan-800 border-cyan-200', 'bg-lime-100 text-lime-800 border-lime-200'].map(c => (
                                    <button key={c} onClick={() => setNewFlagColor(c)} className={`w-4 h-4 rounded-full ${c.split(' ')[0]} border ${newFlagColor === c ? 'ring-2 ring-slate-400' : ''}`} />
                                ))}
                            </div>
                            <button onClick={handleCreateFlag} className="p-1 bg-white rounded-full text-green-600 hover:bg-green-50"><Check className="w-3 h-3"/></button>
                            <button onClick={() => setIsCreatingFlag(false)} className="p-1 text-slate-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. NCCD Classification */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">NCCD Classification</h3>
                            <p className="text-xs text-slate-500">National Consistent Collection of Data</p>
                        </div>
                    </div>
                    
                    <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors ${nccd.isNCCD ? 'bg-pink-50 border-pink-200 text-pink-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input 
                            type="checkbox" 
                            checked={nccd.isNCCD} 
                            onChange={e => handleNccdUpdate({ isNCCD: e.target.checked })} 
                            className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300" 
                        />
                        <span className="text-sm font-bold">Include in NCCD</span>
                    </label>
                </div>

                {nccd.isNCCD && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-300">
                        {/* Level Selection */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wide">Level of Adjustment</label>
                            <div className="space-y-2">
                                {['QDTP', 'Supplementary', 'Substantial', 'Extensive'].map((lvl) => (
                                    <label key={lvl} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${nccd.level === lvl ? 'bg-pink-50 border-pink-500 shadow-sm ring-1 ring-pink-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                        <input 
                                            type="radio" 
                                            name="nccdLevel" 
                                            checked={nccd.level === lvl} 
                                            onChange={() => handleNccdUpdate({ level: lvl as any })}
                                            className="hidden"
                                        />
                                        <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${nccd.level === lvl ? 'border-pink-600' : 'border-slate-300'}`}>
                                            {nccd.level === lvl && <div className="w-2 h-2 rounded-full bg-pink-600" />}
                                        </div>
                                        <span className={`text-sm font-medium ${nccd.level === lvl ? 'text-pink-900' : 'text-slate-700'}`}>{lvl}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Category & Impact */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wide">Disability Categories</label>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[
                                    { id: 'Cognitive', icon: Brain },
                                    { id: 'Physical', icon: Activity },
                                    { id: 'Social/Emotional', icon: User },
                                    { id: 'Sensory', icon: Ear }
                                ].map((cat) => {
                                    // Handle legacy string vs new array
                                    const currentCats = nccd.categories || ( (nccd as any).category ? [(nccd as any).category] : [] );
                                    const isSelected = currentCats.includes(cat.id as any);
                                    
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => toggleCategory(cat.id as any)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                                                isSelected 
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500' 
                                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            <cat.icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            <span className="text-xs font-bold">{cat.id}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Impact Statement</label>
                            <textarea 
                                value={nccd.impactStatement || ''}
                                onChange={(e) => handleNccdUpdate({ impactStatement: e.target.value })}
                                className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-shadow resize-none bg-slate-50 focus:bg-white"
                                rows={3}
                                placeholder="Describe functional impact..."
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Strategy Bank */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Check className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Active Adjustments</h3>
                        <p className="text-xs text-slate-500">Select strategies currently implemented for this student.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {Object.entries(STRATEGY_BANK).map(([category, strategies]) => (
                        <div key={category}>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                {category}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {strategies.map(strat => {
                                    const isActive = activeAdjIds.has(strat);
                                    return (
                                        <div key={strat} className={`group flex items-center p-1 rounded-lg border transition-all ${isActive ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                            <button
                                                onClick={() => toggleStrategy(strat, category)}
                                                className="px-3 py-1.5 text-sm font-medium flex items-center gap-2 text-left"
                                            >
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${isActive ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                                                    {isActive && <Check className="w-2.5 h-2.5" />}
                                                </div>
                                                <span className={isActive ? 'text-emerald-900' : 'text-slate-600'}>{strat}</span>
                                            </button>
                                            
                                            {isActive && (
                                                <div className="pr-1 flex items-center border-l border-emerald-200 pl-1 ml-1">
                                                    <button 
                                                        onClick={() => onAddEvidence(strat)}
                                                        className="text-[10px] bg-white text-emerald-600 px-2 py-1 rounded font-bold hover:bg-emerald-100 transition-colors border border-emerald-100 flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" /> Proof
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
