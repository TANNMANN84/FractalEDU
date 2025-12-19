
import React, { useState, useMemo } from 'react';
import { Student, ClassGroup } from '@/types';
import { useAppStore } from '@/store';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie
} from 'recharts';
import { Plus, Trash2, Calendar, Activity } from 'lucide-react';

interface Props {
    students: Student[];
    classGroup: ClassGroup;
    className?: string;
}

const COLORS: Record<string, string> = {
    'Exceeding': '#3b82f6', // Blue
    'Strong': '#22c55e', // Green
    'Developing': '#eab308', // Yellow
    'Needs additional support': '#ef4444', // Red
    'Not Assessed': '#94a3b8', // Gray
    'Exempt': '#94a3b8'
};

const PieWidget = React.memo(({ title, data, color }: { title: string, data: any[], color: string }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const pct = total > 0 ? Math.round((data[0].value / total) * 100) : 0;
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 text-center w-full">{title}</h4>
            <div className="w-24 h-24 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={data} 
                            innerRadius={25} 
                            outerRadius={40} 
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell fill={color} />
                            <Cell fill="#e2e8f0" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold text-slate-700">{data[0].value}</span>
                </div>
            </div>
            <div className="mt-4 w-full flex justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{background: color}}></div> {pct}%</span>
                <span>{data[1].value} No</span>
            </div>
        </div>
    );
});

export const ClassAnalyticsDashboard: React.FC<Props> = React.memo(({ students, classGroup, className }) => {
    const { updateClass } = useAppStore();
    const [naplanYear, setNaplanYear] = useState<'year9' | 'year7'>('year9');
    const [naplanDomain, setNaplanDomain] = useState<'reading' | 'writing' | 'numeracy' | 'grammar'>('reading');
    const [memoText, setMemoText] = useState('');

    // --- 1. NAPLAN Stats ---
    const naplanData = useMemo(() => {
        const counts = {
            'Exceeding': 0,
            'Strong': 0,
            'Developing': 0,
            'Needs additional support': 0,
            'Not Assessed': 0
        };
        
        students.forEach(s => {
            // @ts-ignore - dynamic access
            const band = s.naplan?.[naplanYear]?.[naplanDomain];
            
            if (band && Object.keys(counts).includes(band)) {
                counts[band as keyof typeof counts]++;
            } else {
                counts['Not Assessed']++; 
            }
        });

        return [
            { name: 'Exceeding', value: counts['Exceeding'] },
            { name: 'Strong', value: counts['Strong'] },
            { name: 'Developing', value: counts['Developing'] },
            { name: 'Needs additional support', value: counts['Needs additional support'] },
            { name: 'Not Assessed', value: counts['Not Assessed'] }
        ];
    }, [students, naplanYear, naplanDomain]);

    // --- 2. Pie Stats ---
    const getPieData = (check: (s: Student) => boolean) => {
        const yes = students.filter(check).length;
        const no = students.length - yes;
        return [
            { name: 'Yes', value: yes },
            { name: 'No', value: no }
        ];
    };

    const nccdData = useMemo(() => getPieData(s => !!s.nccd?.active), [students]);
    const learningData = useMemo(() => getPieData(s => !!s.plans?.learning?.active || !!s.hasLearningPlan), [students]);
    const behaviourData = useMemo(() => getPieData(s => !!s.plans?.behaviour?.active), [students]);
    const hpgeData = useMemo(() => getPieData(s => !!s.profile?.hpge?.status), [students]);
    const atsiData = useMemo(() => getPieData(s => s.profile?.isAtsi || s.isAtsi || false), [students]);

    // --- 3. Memos ---
    const handleAddMemo = () => {
        if (!memoText.trim()) return;
        const newMemos = [...(classGroup.memos || []), { id: crypto.randomUUID(), content: memoText, date: new Date().toISOString() }];
        updateClass(classGroup.id, { memos: newMemos });
        setMemoText('');
    };

    const handleDeleteMemo = (id: string) => {
        updateClass(classGroup.id, { memos: (classGroup.memos || []).filter(m => m.id !== id) });
    };

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${className}`}>
            
            {/* Left Col: Memos & Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-500" /> Class Memos
                    </h3>
                    
                    <div className="flex gap-2 mb-4">
                        <input 
                            value={memoText} 
                            onChange={e => setMemoText(e.target.value)}
                            className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="Add reminder..."
                            onKeyDown={e => e.key === 'Enter' && handleAddMemo()}
                        />
                        <button 
                            onClick={handleAddMemo} 
                            className="bg-brand-600 text-white rounded-lg p-2 hover:bg-brand-700 shadow-sm"
                        >
                            <Plus className="w-4 h-4"/>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {(classGroup.memos || []).slice().reverse().map(memo => (
                            <div key={memo.id} className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 group relative hover:border-slate-200 transition-colors">
                                <p className="text-slate-700 pr-4 leading-relaxed break-words">{memo.content}</p>
                                <span className="text-[10px] text-slate-400 mt-2 block border-t border-slate-200 pt-1">
                                    {new Date(memo.date).toLocaleDateString()}
                                </span>
                                <button 
                                    onClick={() => handleDeleteMemo(memo.id)} 
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3"/>
                                </button>
                            </div>
                        ))}
                        {(!classGroup.memos || classGroup.memos.length === 0) && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <p className="text-xs italic">No memos yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Col: Analytics */}
            <div className="lg:col-span-3 space-y-6">
                
                {/* NAPLAN Bar */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">NAPLAN Distribution</h3>
                        </div>
                        <div className="flex gap-2">
                            <select 
                                value={naplanYear} 
                                onChange={(e) => setNaplanYear(e.target.value as any)}
                                className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-brand-500"
                            >
                                <option value="year9">Year 9</option>
                                <option value="year7">Year 7</option>
                            </select>
                            <select 
                                value={naplanDomain} 
                                onChange={(e) => setNaplanDomain(e.target.value as any)}
                                className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-brand-500"
                            >
                                <option value="reading">Reading</option>
                                <option value="writing">Writing</option>
                                <option value="numeracy">Numeracy</option>
                                <option value="grammar">Grammar</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={naplanData} layout="vertical" margin={{ left: 100, right: 30 }} barSize={24}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={140} 
                                    tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} 
                                    interval={0}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0] as any} background={{ fill: '#f8fafc', radius: [0, 4, 4, 0] as any }}>
                                    {naplanData.map((entry, index) => {
                                        let colorKey = entry.name;
                                        return <Cell key={`cell-${index}`} fill={COLORS[colorKey] || '#94a3b8'} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Context Pies */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <PieWidget title="NCCD" data={nccdData} color="#ec4899" />
                    <PieWidget title="Learning" data={learningData} color="#8b5cf6" />
                    <PieWidget title="Behaviour" data={behaviourData} color="#f43f5e" />
                    <PieWidget title="HPGE" data={hpgeData} color="#f59e0b" />
                    <PieWidget title="ATSI" data={atsiData} color="#14b8a6" />
                </div>
            </div>
        </div>
    );
});
