import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { Exam, Question } from '@/types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, Legend, ReferenceLine
} from 'recharts';
import { Filter, Download, Printer, PieChart as PieIcon, BarChart2, Layers, Brain, User, CheckSquare, Square, AlertTriangle, Target, BookOpen, Search } from 'lucide-react';
import { analyzePerformance } from '../../utils/analysisHelpers';
import { getLeafQuestions } from '../../utils/helpers';

interface AnalysisViewProps {
    exam: Exam;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ exam }) => {
    const { results, classes, students } = useAppStore();
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
    
    // UI State
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
    const [showComparison, setShowComparison] = useState<boolean>(true);
    const [deepDiveTab, setDeepDiveTab] = useState<'module' | 'verb' | 'outcome' | 'content'>('module');
    const [drillDownQuestionId, setDrillDownQuestionId] = useState<string>('');

    // --- 1. Filter Logic ---
    const cohortResults = useMemo(() => {
        let relevantResults = results.filter(r => r.examId === exam.id);
        if (selectedClassId !== 'all') {
            const cls = classes.find(c => c.id === selectedClassId);
            if (cls) {
                relevantResults = relevantResults.filter(r => cls.studentIds.includes(r.studentId));
            }
        }
        return relevantResults;
    }, [results, exam.id, selectedClassId, classes]);

    const targetResults = useMemo(() => {
        if (selectedStudentId === 'all') return cohortResults;
        return cohortResults.filter(r => r.studentId === selectedStudentId);
    }, [cohortResults, selectedStudentId]);

    const studentList = useMemo(() => {
        if (selectedClassId === 'all') return students;
        const cls = classes.find(c => c.id === selectedClassId);
        if (!cls) return [];
        return students.filter(s => cls.studentIds.includes(s.id));
    }, [students, classes, selectedClassId]);

    // --- 2. Perform Analysis ---
    const cohortAnalysis = useMemo(() => analyzePerformance(exam, cohortResults), [exam, cohortResults]);
    const targetAnalysis = useMemo(() => analyzePerformance(exam, targetResults), [exam, targetResults]);

    const isIndividualView = selectedStudentId !== 'all';
    const activeAnalysis = isIndividualView ? targetAnalysis : cohortAnalysis;
    const flatQuestions = useMemo(() => getLeafQuestions(exam.questions), [exam.questions]);

    // Init Drill Down if needed
    if (!drillDownQuestionId && flatQuestions.length > 0) {
        setDrillDownQuestionId(flatQuestions[0].id);
    }

    // --- 3. Chart Data Preparation ---
    const prepareChartData = (category: 'verb' | 'module' | 'outcome' | 'content') => {
        let cohortData: any[] = [];
        let targetData: any[] = [];

        switch (category) {
            case 'verb': cohortData = cohortAnalysis.byVerb; targetData = targetAnalysis.byVerb; break;
            case 'module': cohortData = cohortAnalysis.byModule; targetData = targetAnalysis.byModule; break;
            case 'outcome': cohortData = cohortAnalysis.byOutcome; targetData = targetAnalysis.byOutcome; break;
            case 'content': cohortData = cohortAnalysis.byContentArea; targetData = targetAnalysis.byContentArea; break;
        }

        if (!isIndividualView) {
            return cohortData.map(c => ({ name: c.name, value: c.pct }));
        }

        return cohortData.map(cItem => {
            const tItem = targetData.find(t => t.name === cItem.name);
            return {
                name: cItem.name,
                Class: cItem.pct,
                Student: tItem ? tItem.pct : 0
            };
        });
    };

    const deepDiveData = useMemo(() => prepareChartData(deepDiveTab), [cohortAnalysis, targetAnalysis, isIndividualView, deepDiveTab]);
    
    // --- 4. Drill Down Logic ---
    const drillDownQuestion = flatQuestions.find(q => q.id === drillDownQuestionId);
    
    const drillDownChartData = useMemo(() => {
        if (!drillDownQuestion) return [];
        
        // MCQ Distractor Logic
        if (drillDownQuestion.type === 'MCQ') {
            const counts = activeAnalysis.distractors[drillDownQuestion.id] || {};
            const data = ['A', 'B', 'C', 'D'].map(opt => ({
                name: opt,
                count: counts[opt] || 0,
                isCorrect: drillDownQuestion.correctAnswer === opt
            }));
            return data;
        } 
        
        // Score Distribution Logic
        const dist = activeAnalysis.scoreDistributions[drillDownQuestion.id] || {};
        const data = [];
        for (let i = 0; i <= drillDownQuestion.maxMarks; i++) {
            data.push({
                name: i.toString(),
                count: dist[i.toString()] || 0
            });
        }
        return data;

    }, [drillDownQuestion, activeAnalysis]);

    // --- 5. Actions ---
    const handleExport = () => {
        const data = {
            exam: exam,
            results: targetResults,
            generatedAt: new Date().toISOString(),
            version: "2.0"
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exam.name.replace(/\s+/g, '_')}_Analysis.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handlePrint = () => window.print();
    const getPieData = (data: any[]) => data.map((d: any) => ({ name: d.name, value: isIndividualView ? (d.Student ?? d.value) : d.value }));
    const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

    return (
        <div className="space-y-8 pb-12 print:p-0">
            {/* Control Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <Filter className="w-4 h-4 text-slate-400 ml-2" />
                        <select 
                            value={selectedClassId}
                            onChange={(e) => { setSelectedClassId(e.target.value); setSelectedStudentId('all'); }}
                            className="bg-transparent text-sm p-1.5 outline-none font-medium text-slate-700 min-w-[140px]"
                        >
                            <option value="all">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <User className="w-4 h-4 text-slate-400 ml-2" />
                        <select 
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="bg-transparent text-sm p-1.5 outline-none font-medium text-slate-700 min-w-[140px]"
                        >
                            <option value="all">Whole Cohort</option>
                            {studentList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {isIndividualView && (
                        <button 
                            onClick={() => setShowComparison(!showComparison)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                showComparison ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {showComparison ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            Compare to Class
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-md ${chartType === 'bar' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}><BarChart2 className="w-4 h-4" /></button>
                        <button onClick={() => setChartType('pie')} className={`p-1.5 rounded-md ${chartType === 'pie' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}><PieIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <button onClick={handleExport} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Export JSON"><Download className="w-4 h-4" /></button>
                    <button onClick={handlePrint} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Print Report"><Printer className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Section 1: Snapshot & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Score Stats */}
                <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {isIndividualView ? (
                        <>
                            <StatCard label="Student Score" value={`${activeAnalysis.stats.mean.toFixed(1)} / ${exam.totalMarks}`} subtext={showComparison ? `${((activeAnalysis.stats.mean/exam.totalMarks)*100).toFixed(1)}%` : undefined} color="bg-brand-50 text-brand-700" />
                            {showComparison && <StatCard label="Cohort Average" value={`${cohortAnalysis.stats.mean.toFixed(1)}`} subtext={`Diff: ${(activeAnalysis.stats.mean - cohortAnalysis.stats.mean).toFixed(1)}`} color="bg-slate-50 text-slate-700" />}
                            {showComparison && <StatCard label="Cohort Rank" value={`#${cohortResults.sort((a,b) => b.scoreTotal - a.scoreTotal).findIndex(r => r.studentId === selectedStudentId) + 1}`} subtext={`of ${cohortResults.length}`} color="bg-violet-50 text-violet-700" />}
                        </>
                    ) : (
                        <>
                            <StatCard label="Cohort Mean" value={`${cohortAnalysis.stats.mean.toFixed(1)}`} subtext={`${((cohortAnalysis.stats.mean/exam.totalMarks)*100).toFixed(1)}%`} color="bg-blue-50 text-blue-700" />
                            <StatCard label="Median" value={`${cohortAnalysis.stats.median.toFixed(1)}`} color="bg-indigo-50 text-indigo-700" />
                            <StatCard label="Highest" value={`${cohortAnalysis.stats.max}`} color="bg-emerald-50 text-emerald-700" />
                            <StatCard label="Lowest" value={`${cohortAnalysis.stats.min}`} color="bg-rose-50 text-rose-700" />
                        </>
                    )}
                </div>

                {/* Problem Questions Banner */}
                {!isIndividualView && activeAnalysis.problemQuestions.length > 0 && (
                    <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" /> Areas for Improvement
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            {activeAnalysis.problemQuestions.map(q => (
                                <div key={q.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex flex-col justify-between h-full hover:bg-amber-100 transition-colors cursor-pointer" onClick={() => setDrillDownQuestionId(q.id)}>
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-amber-900 text-lg">{q.number}</span>
                                            <span className="text-xs font-bold bg-white text-amber-600 px-1.5 py-0.5 rounded border border-amber-200">{q.pct.toFixed(0)}%</span>
                                        </div>
                                        <p className="text-xs text-amber-800 line-clamp-2">{q.prompt || 'No content provided'}</p>
                                    </div>
                                    <div className="mt-2 text-[10px] uppercase font-bold text-amber-400 tracking-wide">Avg: {q.avg.toFixed(1)}/{q.max}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bands Chart */}
                {!isIndividualView && (
                    <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h4 className="font-bold text-slate-700 mb-2">Performance Bands</h4>
                        <div className="flex-1 min-h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activeAnalysis.bands} layout="vertical" margin={{ left: 30, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} fontSize={10} tickFormatter={(val) => val.split(' ')[0] + ' ' + val.split(' ')[1]} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '12px'}} />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                        {activeAnalysis.bands.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Section 2: Deep Dives (Tabs) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[500px]">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        {deepDiveTab === 'module' && <Layers className="w-5 h-5 text-blue-500" />}
                        {deepDiveTab === 'verb' && <Brain className="w-5 h-5 text-purple-500" />}
                        {deepDiveTab === 'outcome' && <Target className="w-5 h-5 text-green-500" />}
                        {deepDiveTab === 'content' && <BookOpen className="w-5 h-5 text-amber-500" />}
                        Deep Dive Analysis
                    </h4>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {[
                            { id: 'module', label: 'Modules' },
                            { id: 'verb', label: 'Verbs' },
                            { id: 'outcome', label: 'Outcomes' },
                            { id: 'content', label: 'Content Areas' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setDeepDiveTab(tab.id as any)}
                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${deepDiveTab === tab.id ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                            <BarChart data={deepDiveData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="name" type="category" width={180} fontSize={11} interval={0} />
                                <Tooltip contentStyle={{ borderRadius: '8px' }} formatter={(val: number) => val.toFixed(1) + '%'} />
                                <Legend />
                                {isIndividualView && <Bar dataKey="Student" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Student" barSize={20} />}
                                {(!isIndividualView || showComparison) && (
                                    <Bar dataKey={isIndividualView ? "Class" : "value"} fill="#cbd5e1" radius={[0, 4, 4, 0]} name="Cohort Avg" barSize={20} />
                                )}
                            </BarChart>
                        ) : (
                            <PieChart>
                                <Pie data={getPieData(deepDiveData)} cx="50%" cy="50%" outerRadius={120} innerRadius={60} dataKey="value" label>
                                    {deepDiveData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Section 3: Drill Down */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Question Selector & Info */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5" /> Question Inspector
                    </h4>
                    
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Select Question</label>
                        <select 
                            value={drillDownQuestionId} 
                            onChange={(e) => setDrillDownQuestionId(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                            {flatQuestions.map(q => (
                                <option key={q.id} value={q.id}>Q{q.number} - {q.type} ({q.maxMarks}m)</option>
                            ))}
                        </select>
                    </div>

                    {drillDownQuestion && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex-1">
                            <div className="mb-4">
                                <span className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 font-bold uppercase">{drillDownQuestion.type}</span>
                                {drillDownQuestion.type === 'MCQ' && (
                                    <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase">Answer: {drillDownQuestion.correctAnswer}</span>
                                )}
                            </div>
                            <p className="text-sm text-slate-700 italic mb-4">"{drillDownQuestion.notes || 'No topic description'}"</p>
                            
                            <div className="space-y-2">
                                <div className="text-xs text-slate-500"><strong>Outcomes:</strong> {drillDownQuestion.outcomes?.join(', ') || '-'}</div>
                                <div className="text-xs text-slate-500"><strong>Content:</strong> {drillDownQuestion.contentAreas?.join(', ') || '-'}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Drill Down Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[350px]">
                    <h4 className="font-bold text-slate-700 mb-4">Response Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={drillDownChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={50}>
                                {drillDownChartData.map((entry: any, index: number) => {
                                    // Coloring Logic
                                    if (drillDownQuestion?.type === 'MCQ') {
                                        if (entry.isCorrect) return <Cell key={`cell-${index}`} fill="#22c55e" />; // Green for correct
                                        // Find if this is the most common distractor? 
                                        // For now, red for all wrong answers
                                        return <Cell key={`cell-${index}`} fill="#ef4444" />;
                                    }
                                    // For marks: Gradient from red to green?
                                    const score = parseInt(entry.name);
                                    const max = drillDownQuestion?.maxMarks || 1;
                                    const ratio = score / max;
                                    const color = ratio === 1 ? '#22c55e' : ratio >= 0.5 ? '#eab308' : '#ef4444';
                                    return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string; subtext?: string; color: string }> = ({ label, value, subtext, color }) => (
    <div className={`p-4 rounded-xl border border-slate-200/50 ${color}`}>
        <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtext && <p className="text-xs font-medium mt-1 opacity-80">{subtext}</p>}
    </div>
);