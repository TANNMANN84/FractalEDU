
import React, { useMemo, useState } from 'react';
import { Student } from '@/types';
import { useAppStore } from '@/store';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Award, BookOpen, Sprout, Edit2, Save, FileText, CheckCircle2, Pencil } from 'lucide-react';
import { AcademicDataModal } from '../AcademicDataModal';

interface Props { 
    student: Student; 
}

export const AcademicProfile: React.FC<Props> = ({ student }) => { 
    const { results, exams, rapidTests, rapidResults, updateStudent } = useAppStore();
    
    const [isEditingNaplan, setIsEditingNaplan] = useState(false);
    const [isEditDataOpen, setIsEditDataOpen] = useState(false);
    const [naplanState, setNaplanState] = useState(student.naplan || { year7: {}, year9: {} });

    // --- Handlers ---
    const handleNaplanChange = (year: 'year7' | 'year9', field: string, val: string) => {
        setNaplanState(prev => ({
            ...prev,
            [year]: { ...(prev[year] || {}), [field]: val }
        }));
    };

    const saveNaplan = () => {
        updateStudent(student.id, { naplan: naplanState as any });
        setIsEditingNaplan(false);
    };

    // --- 1. Formal Exams (Senior Data) ---
    const internalData = useMemo(() => {
        const studentResults = results.filter(r => r.studentId === student.id);
        return studentResults.map(res => {
            const exam = exams.find(e => e.id === res.examId);
            if (!exam) return null;
            
            const cohortResults = results.filter(r => r.examId === exam.id);
            const avg = cohortResults.length ? cohortResults.reduce((acc, curr) => acc + curr.scoreTotal, 0) / cohortResults.length : 0;
            
            return {
                id: exam.id,
                name: exam.name,
                date: exam.date,
                score: res.scoreTotal,
                max: exam.totalMarks,
                percent: Math.round((res.scoreTotal / exam.totalMarks) * 100),
                cohortAvg: Math.round((avg / exam.totalMarks) * 100)
            };
        }).filter(Boolean).sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());
    }, [results, exams, student.id]);

    // --- 2. Diagnostics (Junior Growth Data) ---
    const diagnosticData = useMemo(() => {
        const studentRapidResults = rapidResults.filter(r => r.studentId === student.id);
        
        return studentRapidResults.map(res => {
            const test = rapidTests.find(t => t.id === res.testId);
            if (!test) return null;
            
            // Calculate Totals based on values in the map
            const preValues = Object.values(res.preTestScores || {}) as number[];
            const postValues = Object.values(res.postTestScores || {}) as number[];

            const preTotal = preValues.reduce((a, b) => a + (b || 0), 0);
            const postTotal = postValues.reduce((a, b) => a + (b || 0), 0);
            
            // Calculate Max Marks (Sum of all questions)
            const maxMarks = test.questions.reduce((sum, q) => sum + q.maxMarks, 0);
            
            const prePercent = maxMarks > 0 ? Math.round((preTotal / maxMarks) * 100) : 0;
            const postPercent = maxMarks > 0 ? Math.round((postTotal / maxMarks) * 100) : 0;
            const growth = postPercent - prePercent;
            
            // Only show if at least one test was taken
            if (preValues.length === 0 && postValues.length === 0) return null;

            return {
                id: test.id,
                name: test.name,
                pre: prePercent,
                post: postPercent,
                growth: growth,
                max: maxMarks
            };
        }).filter(Boolean);
    }, [rapidResults, rapidTests, student.id]);

    // --- 3. Semester Reports Generation (Mock/Derived) ---
    const reportYears = useMemo(() => {
        // Use manually entered reports if available, otherwise fallback or empty
        const manualReports = student.academicData?.reports || [];
        if (manualReports.length > 0) {
            return manualReports.sort((a, b) => b.year - a.year);
        }
        return []; 
    }, [student.academicData?.reports]);

    const validData = student.academicData?.validScience || { level: 4, strands: { knowing: 'Medium', planning: 'Medium', problemSolving: 'Medium' } };
    const checkInData = student.academicData?.checkIn || [];

    // Helper Component for Bands
    const BandInput = ({ year, field, val }: { year: 'year7'|'year9', field: string, val: string }) => {
        const bands = ['Exceeding', 'Strong', 'Developing', 'Needs additional support', 'Exempt'];
        if (isEditingNaplan) {
            return (
                <select 
                    value={val || ''} 
                    onChange={(e) => handleNaplanChange(year, field, e.target.value)}
                    className="w-full text-xs border border-brand-300 rounded p-1 bg-white focus:ring-1 focus:ring-brand-500 outline-none"
                >
                    <option value="">- Select -</option>
                    {bands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            );
        }
        let color = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        if (['Strong', 'Exceeding'].includes(val)) color = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (['Developing'].includes(val)) color = 'bg-amber-100 text-amber-800 border-amber-200';
        if (['Needs additional support'].includes(val)) color = 'bg-red-100 text-red-800 border-red-200';
        return <span className={`px-2 py-1 rounded text-xs font-bold border ${color} block text-center truncate`}>{val || '-'}</span>;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            
            {/* 1. NAPLAN (Context) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-500" /> NAPLAN Profile
                    </h3>
                    <button 
                        onClick={() => isEditingNaplan ? saveNaplan() : setIsEditingNaplan(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isEditingNaplan ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        {isEditingNaplan ? <><Save className="w-3 h-3"/> Save</> : <><Edit2 className="w-3 h-3"/> Edit</>}
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Year 7 Column */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Year 7 Results
                        </h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-slate-600 dark:text-slate-300">
                            {['Reading', 'Writing', 'Numeracy', 'Grammar'].map(domain => (
                                <React.Fragment key={domain}>
                                    <span className="text-sm self-center">{domain}</span>
                                    <BandInput year="year7" field={domain.toLowerCase()} val={(naplanState.year7 as any)?.[domain.toLowerCase()]} />
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                    {/* Year 9 Column */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span> Year 9 Results
                        </h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-slate-600 dark:text-slate-300">
                            {['Reading', 'Writing', 'Numeracy', 'Grammar'].map(domain => (
                                <React.Fragment key={domain}>
                                    <span className="text-sm self-center">{domain}</span>
                                    <BandInput year="year9" field={domain.toLowerCase()} val={(naplanState.year9 as any)?.[domain.toLowerCase()]} />
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. VALID & Check-in (New) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                
                {/* VALID Science */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                    <button 
                        onClick={() => setIsEditDataOpen(true)} 
                        className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit History"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-500" /> VALID Science 8
                    </h3>
                    <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                        <div>
                            <span className="text-xs font-bold text-indigo-400 dark:text-indigo-300 uppercase">Overall Level</span>
                            <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-200">{validData.level} <span className="text-sm text-indigo-400 dark:text-indigo-300 font-normal">/ 6</span></div>
                        </div>
                        <div className="text-right space-y-1 text-indigo-900 dark:text-indigo-200">
                            <div className="text-xs">Knowing: <strong className="text-indigo-600 dark:text-indigo-400">{validData.strands.knowing}</strong></div>
                            <div className="text-xs">Planning: <strong className="text-indigo-600 dark:text-indigo-400">{validData.strands.planning}</strong></div>
                            <div className="text-xs">Problem Solving: <strong className="text-indigo-600 dark:text-indigo-400">{validData.strands.problemSolving}</strong></div>
                        </div>
                    </div>
                </div>

                {/* Check-in Assessments */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                    <button 
                        onClick={() => setIsEditDataOpen(true)} 
                        className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit History"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Check-in Assessments
                    </h3>
                    <div className="space-y-3">
                        {checkInData.length > 0 ? checkInData.map((c) => (
                            <div key={c.year} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span className="font-bold text-slate-700 dark:text-slate-200 w-12">Yr {c.year}</span>
                                <div className="flex gap-4">
                                    <span className="text-slate-600 dark:text-slate-400">Reading: <strong className="text-emerald-600 dark:text-emerald-400">{c.reading}%</strong></span>
                                    <span className="text-slate-600 dark:text-slate-400">Numeracy: <strong className="text-amber-600 dark:text-amber-400">{c.numeracy}%</strong></span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400 italic text-center py-4">No check-in data recorded.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Academic Reports Table (New) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                <button 
                    onClick={() => setIsEditDataOpen(true)} 
                    className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit History"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-500" /> Academic Reports
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="p-3">Year</th>
                                <th className="p-3">Sem</th>
                                <th className="p-3">English</th>
                                <th className="p-3">Maths</th>
                                <th className="p-3">Science</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportYears.map((r, idx) => (
                                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{r.year}</td>
                                    <td className="p-3 text-slate-500 dark:text-slate-400">Sem {r.semester}</td>
                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                                        {r.subjects?.find(s=>s.name==='English')?.grade || '-'}
                                    </td>
                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                                        {r.subjects?.find(s=>s.name==='Mathematics')?.grade || '-'}
                                    </td>
                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                                        {r.subjects?.find(s=>s.name==='Science')?.grade || '-'}
                                    </td>
                                </tr>
                            ))}
                            {reportYears.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-slate-400 italic">No report history available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. Diagnostic Growth (The "Value Add") */}
            {diagnosticData.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-6 flex items-center gap-2">
                        <Sprout className="w-5 h-5 text-emerald-500" />
                        Diagnostic Growth
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={diagnosticData as any[]} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                                <XAxis type="number" domain={[0, 100]} unit="%" />
                                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(148, 163, 184, 0.1)'}}
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc'}}
                                />
                                <Legend />
                                <Bar dataKey="pre" name="Pre-Test" fill="#cbd5e1" barSize={12} radius={[0, 4, 4, 0]} />
                                <Bar dataKey="post" name="Post-Test" fill="#10b981" barSize={12} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* 5. Formal Assessment History */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-brand-500" />
                    Internal Assessment
                </h3>
                {internalData.length > 0 ? (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={internalData as any[]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="name" tick={{fontSize: 10}} />
                                <YAxis domain={[0, 100]} unit="%" />
                                <Tooltip contentStyle={{borderRadius: '8px', backgroundColor: '#1e293b', color: '#f8fafc', border: 'none'}} />
                                <Legend />
                                <Bar dataKey="percent" name="Student" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="cohortAvg" name="Cohort Avg" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-slate-400 italic text-sm">No formal assessment data recorded.</p>
                )}
            </div>

            {isEditDataOpen && (
                <AcademicDataModal 
                    student={student} 
                    onClose={() => setIsEditDataOpen(false)} 
                />
            )}
        </div>
    );
};
