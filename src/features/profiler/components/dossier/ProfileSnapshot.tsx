
import React from 'react';
import { Student } from '@/types';
import { User, AlertTriangle, CheckCircle2, FileText, TrendingUp, AlertOctagon, Flag, Percent } from 'lucide-react';

interface ProfileSnapshotProps {
    student: Student;
    onEdit?: () => void;
}

export const ProfileSnapshot: React.FC<ProfileSnapshotProps> = ({ student, onEdit }) => {
    // Safe Data Accessors
    const activeStrategies = student.adjustments?.filter(a => a.active) || [];
    
    const plans = student.plans || { 
        behaviour: { active: false }, 
        learning: { active: false }, 
        medical: { active: false } 
    };
    
    const concerns = Object.entries(student.concerns || {}).filter(([_, note]) => note !== undefined);
    
    const history = Object.entries(student.behaviourHistory || {})
        .sort((a, b) => Number(b[0]) - Number(a[0]));

    const attendance = student.profile?.attendanceRate || 0;
    
    // Attendance Data Logic
    const attendanceData = student.profile?.attendanceData || {};
    const attendanceNotes = student.profile?.attendanceNotes;
    const years = Object.keys(attendanceData).map(Number).sort((a, b) => b - a);
    const latestYear = years.length > 0 ? years[0] : null;
    const termData = latestYear ? attendanceData[latestYear] : null;

    const flags = student.profile?.customFlags || [];

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">

            {/* ROW 1: Identity & Wellbeing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                
                {/* 1. Personal Profile (The "Bio") */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                            <User className="w-5 h-5 text-brand-500" /> Student Profile
                        </h3>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                            {(student.profile?.isAtsi || student.isAtsi) && <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-[10px] font-bold border border-red-200 dark:border-red-800">ATSI</span>}
                            {student.profile?.eald && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-[10px] font-bold border border-blue-200 dark:border-blue-800">EALD</span>}
                            {student.profile?.oohc && <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-[10px] font-bold border border-purple-200 dark:border-purple-800">OOHC</span>}
                            {student.nccd?.isNCCD && <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 rounded text-[10px] font-bold border border-pink-200 dark:border-pink-800">NCCD</span>}
                            
                            {/* Custom Flags */}
                            {flags.map(f => (
                                <span key={f.id} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${f.color}`}>
                                    {f.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Gender</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{student.profile?.gender || 'Not specified'}</p>
                        </div>
                        <div className="col-span-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <Percent className="w-3 h-3"/> Attendance {latestYear ? `(${latestYear})` : ''}
                                </span>
                                {!termData && <span className={`text-sm font-bold ${attendance < 85 ? 'text-red-600' : 'text-green-600'}`}>{attendance}%</span>}
                            </div>
                            
                            {termData ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['term1', 'term2', 'term3', 'term4'] as const).map((term, i) => {
                                            const val = termData[term];
                                            return (
                                                <div key={term} className="flex flex-col gap-1">
                                                    <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded relative overflow-hidden flex items-end">
                                                        {val !== undefined && (
                                                            <div 
                                                                className={`w-full transition-all ${val < 85 ? 'bg-red-500' : 'bg-green-500'}`} 
                                                                style={{ height: `${val}%` }}
                                                                title={`Term ${i+1}: ${val}%`}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center px-0.5">
                                                        <span className="text-[9px] text-slate-400 font-medium">T{i+1}</span>
                                                        {val !== undefined && <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{val}%</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {attendanceNotes && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-800">
                                            Note: "{attendanceNotes}"
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className={`h-full ${attendance < 85 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${attendance}%` }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Concerns & Alerts */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4 flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 text-amber-500" /> Active Concerns
                    </h3>
                    {concerns.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {concerns.map(([type, note]) => (
                                <div key={type} className="flex items-start gap-3 p-2 bg-red-50/50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-800">
                                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="block text-xs font-bold text-red-800 dark:text-red-300 uppercase">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="text-xs text-red-700 dark:text-red-400 leading-snug">{note || 'No details provided.'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-4">
                            <CheckCircle2 className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-sm">No active concerns logged.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ROW 2: Plans & Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 3. Official Plans */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" /> Official Plans
                    </h3>
                    <div className="space-y-3">
                        {['behaviour', 'learning', 'medical'].map(type => {
                            const plan = (plans as any)[type];
                            if (!plan?.active) return null;
                            return (
                                <div key={type} className="flex flex-col p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 transition-colors hover:border-indigo-200 dark:hover:border-indigo-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-indigo-900 dark:text-indigo-200 capitalize">{type} Plan</span>
                                        <span className="text-[10px] bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 font-bold uppercase tracking-wide">Active</span>
                                    </div>
                                    {plan.notes && <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 italic opacity-80">"{plan.notes}"</p>}
                                </div>
                            );
                        })}
                        {!plans.behaviour.active && !plans.learning.active && !plans.medical.active && (
                            <div className="text-center py-6 text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                No official support plans active.
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Behaviour History */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" /> Wellbeing & Behaviour Trends
                    </h3>
                    <div className="space-y-4">
                        {history.length > 0 ? history.map(([year, stats]: any) => {
                            const pos = stats.positives || 0;
                            const neg = stats.negatives || 0;
                            const lst = stats.lst || 0;
                            const data = stats.data || 0;
                            const total = pos + neg;
                            const posPct = total > 0 ? (pos / total) * 100 : 0;
                            
                            return (
                                <div key={year}>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Year {year}</span>
                                        <span><span className="text-emerald-600">{pos} Pos</span> <span className="text-slate-300">|</span> <span className="text-red-600">{neg} Neg</span> <span className="text-slate-300">|</span> <span className="text-teal-600">{lst} LST</span> <span className="text-slate-300">|</span> <span className="text-blue-600">{data} Data</span></span>
                                    </div>
                                    <div className="h-3 w-full bg-red-100 rounded-full overflow-hidden flex shadow-inner">
                                        <div style={{ width: `${posPct}%` }} className="h-full bg-emerald-400 dark:bg-emerald-500" />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-6 text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                No historical data recorded.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* ROW 3: Strategies (Full Width) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Strategy Cheat Sheet
                </h3>
                {activeStrategies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {activeStrategies.map((adj: any, idx: number) => (
                            <span key={idx} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm border border-slate-200 dark:border-slate-700 font-medium">
                                {adj.description}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 italic text-sm">No specific adjustments active. Go to "Needs & Adjustments" to add strategies.</p>
                )}
            </div>
        </div>
    );
};
