import React, { useState, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, Legend 
} from 'recharts';
import { X, Filter, User, BarChart2, PieChart as PieIcon, Layers, Brain, Eye } from 'lucide-react';
import { Exam, Student, Result } from '@/types';
import { analyzePerformance } from '../../utils/analysisHelpers';

interface SharedAnalysisViewerProps {
    data: {
        exam: Exam;
        students: Student[];
        results: Result[];
    };
    onClose: () => void;
}

export const SharedAnalysisViewer: React.FC<SharedAnalysisViewerProps> = ({ data, onClose }) => {
    const { exam, students, results } = data;
    const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

    // -- Analysis Logic (Mirrors AnalysisView but uses props) --

    const targetResults = useMemo(() => {
        if (selectedStudentId === 'all') return results;
        return results.filter(r => r.studentId === selectedStudentId);
    }, [results, selectedStudentId]);

    const cohortAnalysis = useMemo(() => analyzePerformance(exam, results), [exam, results]);
    const targetAnalysis = useMemo(() => analyzePerformance(exam, targetResults), [exam, targetResults]);

    const isIndividualView = selectedStudentId !== 'all';
    const activeAnalysis = isIndividualView ? targetAnalysis : cohortAnalysis;

    // Prepare Chart Data
    const prepareChartData = (category: 'verb' | 'module') => {
        const cohortData = category === 'verb' ? cohortAnalysis.byVerb : cohortAnalysis.byModule;
        const targetData = category === 'verb' ? targetAnalysis.byVerb : targetAnalysis.byModule;

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

    const moduleChartData = useMemo(() => prepareChartData('module'), [cohortAnalysis, targetAnalysis, isIndividualView]);
    const verbChartData = useMemo(() => prepareChartData('verb'), [cohortAnalysis, targetAnalysis, isIndividualView]);
    
    const questionChartData = useMemo(() => {
        if (!isIndividualView) return cohortAnalysis.byQuestion.map(q => ({ name: q.number, value: q.pct }));
        return cohortAnalysis.byQuestion.map(cQ => {
            const tQ = targetAnalysis.byQuestion.find(t => t.id === cQ.id);
            return {
                name: cQ.number,
                Class: cQ.pct,
                Student: tQ ? tQ.pct : 0
            };
        });
    }, [cohortAnalysis, targetAnalysis, isIndividualView]);

    const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

    // Helper for Pie
    const getPieData = (d: any[]) => d.map((item: any) => ({ name: item.name, value: isIndividualView ? (item.Student ?? item.value) : item.value }));

    return (
        <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/50">
                        <Eye className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            Shared Analysis View
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-xs text-white uppercase tracking-wider">Read Only</span>
                        </h2>
                        <p className="text-xs text-slate-400">{exam.name} • {results.length} Students</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center shrink-0 px-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg p-1.5">
                        <User className="w-4 h-4 text-slate-500" />
                        <select 
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="bg-transparent text-sm font-medium text-slate-700 outline-none"
                        >
                            <option value="all">Whole Cohort</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setChartType('bar')}
                        className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <BarChart2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setChartType('pie')}
                        className={`p-1.5 rounded-md transition-all ${chartType === 'pie' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <PieIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard 
                            label="Mean" 
                            value={activeAnalysis.stats.mean.toFixed(1)} 
                            subtext={`/ ${exam.totalMarks}`}
                            color="text-blue-700" bg="bg-blue-50"
                        />
                        <StatCard 
                            label="Median" 
                            value={activeAnalysis.stats.median.toFixed(1)} 
                            color="text-indigo-700" bg="bg-indigo-50"
                        />
                        <StatCard 
                            label="Highest" 
                            value={activeAnalysis.stats.max.toString()} 
                            color="text-emerald-700" bg="bg-emerald-50"
                        />
                        <StatCard 
                            label="Lowest" 
                            value={activeAnalysis.stats.min.toString()} 
                            color="text-rose-700" bg="bg-rose-50"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Performance by Module" icon={Layers}>
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'bar' ? (
                                    <BarChart data={moduleChartData} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                                        <Tooltip />
                                        <Legend />
                                        {isIndividualView && <Bar dataKey="Student" fill="#0ea5e9" radius={[0, 4, 4, 0]} />}
                                        <Bar dataKey={isIndividualView ? "Class" : "value"} fill="#cbd5e1" radius={[0, 4, 4, 0]} name="Cohort Avg" />
                                    </BarChart>
                                ) : (
                                    <PieChart>
                                        <Pie data={getPieData(moduleChartData)} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                                            {moduleChartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                )}
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Performance by Verb" icon={Brain}>
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'bar' ? (
                                    <BarChart data={verbChartData} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                                        <Tooltip />
                                        <Legend />
                                        {isIndividualView && <Bar dataKey="Student" fill="#8b5cf6" radius={[0, 4, 4, 0]} />}
                                        <Bar dataKey={isIndividualView ? "Class" : "value"} fill="#e2e8f0" radius={[0, 4, 4, 0]} name="Cohort Avg" />
                                    </BarChart>
                                ) : (
                                    <PieChart>
                                        <Pie data={getPieData(verbChartData)} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                                            {verbChartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                )}
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <ChartCard title="Question Analysis" icon={BarChart2} className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={questionChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                {isIndividualView && <Bar dataKey="Student" fill="#0ea5e9" radius={[4, 4, 0, 0]} />}
                                <Bar dataKey={isIndividualView ? "Class" : "value"} fill="#94a3b8" radius={[4, 4, 0, 0]} name="Cohort Avg" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string; subtext?: string; color: string; bg: string }> = ({ label, value, subtext, color, bg }) => (
    <div className={`p-4 rounded-xl border border-slate-200 shadow-sm ${bg}`}>
        <p className="text-xs font-bold uppercase tracking-wide opacity-70 text-slate-600">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value} <span className="text-sm text-slate-400 font-medium">{subtext}</span></p>
    </div>
);

const ChartCard: React.FC<{ title: string; icon: any; children: React.ReactNode; className?: string }> = ({ title, icon: Icon, children, className = "h-80" }) => (
    <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col ${className}`}>
        <h4 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
            <Icon className="w-5 h-5 text-slate-400" /> {title}
        </h4>
        <div className="flex-1 min-h-0">
            {children}
        </div>
    </div>
);