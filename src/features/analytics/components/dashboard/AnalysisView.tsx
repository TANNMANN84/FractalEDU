import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { Exam, Question } from '@/types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, Legend, ReferenceLine
} from 'recharts';
import { Filter, Download, Printer, PieChart as PieIcon, BarChart2, Layers, Brain, User, CheckSquare, Square, AlertTriangle, Target, BookOpen, Search, Maximize2, Minimize2 } from 'lucide-react';
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
    const [expandDeepDive, setExpandDeepDive] = useState(false);

    // --- 0. Contextual Filtering ---
    const examCohort = useMemo(() => (exam as any).cohort || (exam as any).yearLevel || (exam as any).yearGroup, [exam]);

    const availableClasses = useMemo(() => {
        if (!examCohort) return classes;
        const examCohortNum = examCohort.toString().replace(/\D/g, '');
        if (!examCohortNum) return classes;

        return classes.filter(c => {
            const cYear = (c as any).yearGroup || (c as any).year;
            if (cYear) {
                const cYearNum = cYear.toString().replace(/\D/g, '');
                if (cYearNum === examCohortNum) return true;
            }
            
            const match = c.name.match(/^(\d+)/);
            if (match && match[1] === examCohortNum) {
                return true;
            }

            return false;
        });
    }, [classes, examCohort]);

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
        let list = students;
        if (examCohort) {
            const examCohortNum = examCohort.toString().replace(/\D/g, '');
            if (examCohortNum) {
                list = list.filter(s => {
                    if (!s.cohort) return false;
                    const studentCohortNum = s.cohort.toString().replace(/\D/g, '');
                    return studentCohortNum === examCohortNum;
                });
            }
        }

        if (selectedClassId === 'all') return list;
        const cls = classes.find(c => c.id === selectedClassId);
        if (!cls) return [];
        return list.filter(s => cls.studentIds.includes(s.id));
    }, [students, classes, selectedClassId, examCohort]);

    // --- 2. Perform Analysis ---
    const cohortAnalysis = useMemo(() => analyzePerformance(exam, cohortResults), [exam, cohortResults]);
    const targetAnalysis = useMemo(() => analyzePerformance(exam, targetResults), [exam, targetResults]);

    const isIndividualView = selectedStudentId !== 'all';
    const activeAnalysis = isIndividualView ? targetAnalysis : cohortAnalysis;
    const flatQuestions = useMemo(() => getLeafQuestions(exam.questions), [exam.questions]);

    const percentileDistribution = useMemo(() => {
        if (isIndividualView || !exam.totalMarks || exam.totalMarks === 0) return [];

        const buckets: { [key: string]: number } = {
            '<50%': 0,
            '50-59%': 0,
            '60-69%': 0,
            '70-79%': 0,
            '80-89%': 0,
            '90-100%': 0,
        };

        cohortResults.forEach(r => {
            const pct = (r.scoreTotal / exam.totalMarks) * 100;
            if (pct < 50) buckets['<50%']++;
            else if (pct < 60) buckets['50-59%']++;
            else if (pct < 70) buckets['60-69%']++;
            else if (pct < 80) buckets['70-79%']++;
            else if (pct < 90) buckets['80-89%']++;
            else buckets['90-100%']++;
        });

        const colors: Record<string, string> = {
            '<50%': '#ef4444',
            '50-59%': '#f97316',
            '60-69%': '#eab308',
            '70-79%': '#84cc16',
            '80-89%': '#22c55e',
            '90-100%': '#15803d',
        };

        return Object.entries(buckets).map(([name, count]) => ({ name, count, fill: colors[name] }));
    }, [cohortResults, exam.totalMarks, isIndividualView]);

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

    // Helper to render chart (to avoid duplication)
    const renderDeepDiveChart = (category: 'module' | 'verb' | 'outcome' | 'content') => {
        const data = prepareChartData(category);
        return (
             <div className="h-[350px] w-full">
                {expandDeepDive && <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-4 capitalize text-sm border-b border-slate-100 dark:border-slate-700 pb-2">{category}s</h5>}
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                            <YAxis dataKey="name" type="category" width={180} fontSize={11} interval={0} stroke="#94a3b8" />
                            <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} formatter={(val: number) => val.toFixed(1) + '%'} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            {isIndividualView && <Bar dataKey="Student" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Student" barSize={20} />}
                            {(!isIndividualView || showComparison) && (
                                <Bar 
                                    dataKey={isIndividualView ? "Class" : "value"} 
                                    fill={isIndividualView ? "#94a3b8" : "#6366f1"} 
                                    radius={[0, 4, 4, 0]} 
                                    name={isIndividualView ? "Cohort Avg" : "Average"} 
                                    barSize={20} 
                                />
                            )}
                        </BarChart>
                    ) : (
                        <PieChart>
                            <Pie data={getPieData(data)} cx="50%" cy="50%" outerRadius={120} innerRadius={60} dataKey="value" label>
                                {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12 print:p-0">
            {/* Control Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-1">
                        <Filter className="w-4 h-4 text-slate-400 ml-2" />
                        <select 
                            value={selectedClassId}
                            onChange={(e) => { setSelectedClassId(e.target.value); setSelectedStudentId('all'); }}
                            className="bg-transparent text-sm p-1.5 outline-none font-medium text-slate-700 dark:text-slate-200 min-w-[140px]"
                        >
                            <option value="all">All Classes</option>
                            {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-1">
                        <User className="w-4 h-4 text-slate-400 ml-2" />
                        <select 
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="bg-transparent text-sm p-1.5 outline-none font-medium text-slate-700 dark:text-slate-200 min-w-[140px]"
                        >
                            <option value="all">Whole Cohort</option>
                            {studentList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {isIndividualView && (
                        <button 
                            onClick={() => setShowComparison(!showComparison)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border dark:border-slate-600 ${
                                showComparison 
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {showComparison ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            Compare to Class
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                        <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-600 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'}`}><BarChart2 className="w-4 h-4" /></button>
                        <button onClick={() => setChartType('pie')} className={`p-1.5 rounded-md transition-colors ${chartType === 'pie' ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-600 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'}`}><PieIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                    <button onClick={handleExport} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400" title="Export JSON"><Download className="w-4 h-4" /></button>
                    <button onClick={handlePrint} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400" title="Print Report"><Printer className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Section 1: Snapshot & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-8 space-y-4">
                    {/* Score Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {isIndividualView ? (
                            <>
                                <StatCard label="Student Score" value={`${activeAnalysis.stats.mean.toFixed(1)} / ${exam.totalMarks}`} subtext={showComparison ? `${((activeAnalysis.stats.mean/exam.totalMarks)*100).toFixed(1)}%` : undefined} color="bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300" />
                                {showComparison && <StatCard label="Cohort Average" value={`${cohortAnalysis.stats.mean.toFixed(1)}`} subtext={`Diff: ${(activeAnalysis.stats.mean - cohortAnalysis.stats.mean).toFixed(1)}`} color="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300" />}
                                {showComparison && <StatCard label="Cohort Rank" value={`#${cohortResults.sort((a,b) => b.scoreTotal - a.scoreTotal).findIndex(r => r.studentId === selectedStudentId) + 1}`} subtext={`of ${cohortResults.length}`} color="bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300" />}
                            </>
                        ) : (
                            <>
                                <StatCard label="Cohort Mean" value={`${cohortAnalysis.stats.mean.toFixed(1)}`} subtext={`${((cohortAnalysis.stats.mean/exam.totalMarks)*100).toFixed(1)}%`} color="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" />
                                <StatCard label="Median" value={`${cohortAnalysis.stats.median.toFixed(1)}`} color="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300" />
                                <StatCard label="Highest" value={`${cohortAnalysis.stats.max}`} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" />
                                <StatCard label="Lowest" value={`${cohortAnalysis.stats.min}`} color="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300" />
                            </>
                        )}
                    </div>

                    {/* Analysis Snapshot */}
                    {!isIndividualView && activeAnalysis.problemQuestions.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-amber-500" /> Analysis Snapshot
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Based on current data, the cohort found the following questions most challenging: 
                                <span className="font-semibold text-slate-800 dark:text-slate-200"> {activeAnalysis.problemQuestions.map(q => q.number).join(', ')}.</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Score Distribution Chart */}
                {!isIndividualView && (
                    <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Score Distribution</h4>
                        <div className="flex-1 min-h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={percentileDistribution} layout="vertical" margin={{ left: 10, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                                    <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
                                    <YAxis dataKey="name" type="category" width={55} fontSize={10} stroke="#94a3b8" />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '12px', backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}} formatter={(value: number) => [`${value} students`, 'Count']} />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={15}>
                                        {percentileDistribution.map((entry, index) => (
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
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[500px]">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-lg">
                        {deepDiveTab === 'module' && <Layers className="w-5 h-5 text-blue-500" />}
                        {deepDiveTab === 'verb' && <Brain className="w-5 h-5 text-purple-500" />}
                        {deepDiveTab === 'outcome' && <Target className="w-5 h-5 text-green-500" />}
                        {deepDiveTab === 'content' && <BookOpen className="w-5 h-5 text-amber-500" />}
                        Deep Dive Analysis
                    </h4>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setExpandDeepDive(!expandDeepDive)}
                            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                        >
                            {expandDeepDive ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            {expandDeepDive ? 'Collapse View' : 'Expand All Graphs'}
                        </button>

                        {!expandDeepDive && (
                            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                {[
                                    { id: 'module', label: 'Modules' },
                                    { id: 'verb', label: 'Verbs' },
                                    { id: 'outcome', label: 'Outcomes' },
                                    { id: 'content', label: 'Content Areas' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setDeepDiveTab(tab.id as any)}
                                        className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${deepDiveTab === tab.id ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {expandDeepDive ? (
                    <div className="space-y-12">
                        {renderDeepDiveChart('module')}
                        {renderDeepDiveChart('verb')}
                        {renderDeepDiveChart('outcome')}
                        {renderDeepDiveChart('content')}
                    </div>
                ) : (
                    renderDeepDiveChart(deepDiveTab)
                )}
            </div>

            {/* Section 3: Drill Down */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Question Selector & Info */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-slate-500" /> Question Inspector
                    </h4>
                    
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 block">Select Question</label>
                        <select 
                            value={drillDownQuestionId} 
                            onChange={(e) => setDrillDownQuestionId(e.target.value)}
                            className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                            {flatQuestions.map(q => (
                                <option key={q.id} value={q.id}>Q{q.number} - {q.type} ({q.maxMarks}m)</option>
                            ))}
                        </select>
                    </div>

                    {drillDownQuestion && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 flex-1">
                            <div className="mb-4">
                                <span className="text-[10px] bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 px-2 py-1 rounded text-slate-500 dark:text-slate-300 font-bold uppercase">{drillDownQuestion.type}</span>
                                {drillDownQuestion.type === 'MCQ' && (
                                    <span className="ml-2 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded font-bold uppercase">Answer: {drillDownQuestion.correctAnswer}</span>
                                )}
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-4">"{drillDownQuestion.notes || 'No topic description'}"</p>
                            
                            <div className="space-y-2">
                                <div className="text-xs text-slate-500 dark:text-slate-400"><strong>Outcomes:</strong> {drillDownQuestion.outcomes?.join(', ') || '-'}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400"><strong>Content:</strong> {drillDownQuestion.contentAreas?.join(', ') || '-'}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Drill Down Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[350px]">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Response Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={drillDownChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis allowDecimals={false} label={{ value: 'Students', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} stroke="#94a3b8" />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
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
    <div className={`p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 ${color}`}>
        <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtext && <p className="text-xs font-medium mt-1 opacity-80">{subtext}</p>}
    </div>
);