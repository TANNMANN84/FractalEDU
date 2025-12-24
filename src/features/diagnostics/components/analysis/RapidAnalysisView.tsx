import React, { useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { useAppStore } from '@/store';
import { RapidTest } from '@/types';
import { calculateGrowthStats } from '../../utils/growthHelpers';

interface RapidAnalysisViewProps {
  test: RapidTest;
  onBack: () => void;
}

export const RapidAnalysisView: React.FC<RapidAnalysisViewProps> = ({ test, onBack }) => {
  const { rapidResults, students } = useAppStore();

  const availableStudents = useMemo(() => {
    if (!test.yearGroup) return students;
    const testYearNum = test.yearGroup.toString().replace(/\D/g, '');
    if (!testYearNum) return students;

    return students.filter(s => {
      if (!s.cohort) return false;
      const studentCohortNum = s.cohort.toString().replace(/\D/g, '');
      return studentCohortNum === testYearNum;
    });
  }, [students, test.yearGroup]);

  const { 
    classAvgPre, 
    classAvgPost, 
    avgGrowth, 
    maxScore, 
    studentStats, 
    questionStats 
  } = useMemo(() => calculateGrowthStats(test, rapidResults, availableStudents), [test, rapidResults, availableStudents]);

  // Transform for Scatter Chart
  const scatterData = studentStats.map(s => ({
    x: s.pre,
    y: s.post,
    name: s.name,
    growth: s.growth
  }));

  // Transform for Question Bar Chart (limit label length)
  const questionChartData = questionStats.map(q => ({
    name: q.prompt.length > 15 ? q.prompt.substring(0, 15) + '...' : q.prompt,
    fullPrompt: q.prompt,
    Pre: parseFloat(q.preAvg.toFixed(1)),
    Post: parseFloat(q.postAvg.toFixed(1))
  }));

  return (
    <div className="space-y-6 bg-slate-50 min-h-full pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">{test.name} Analysis</h2>
            <p className="text-slate-500 text-sm">Comparing Pre vs Post Performance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            label="Average Pre-Test" 
            value={classAvgPre.toFixed(1)} 
            suffix={`/ ${maxScore}`}
            color="text-slate-600"
            bgColor="bg-white"
        />
        <StatCard 
            label="Average Post-Test" 
            value={classAvgPost.toFixed(1)} 
            suffix={`/ ${maxScore}`}
            color="text-brand-600"
            bgColor="bg-white"
        />
        <StatCard 
            label="Average Growth" 
            value={`${avgGrowth > 0 ? '+' : ''}${avgGrowth.toFixed(1)}`} 
            suffix="Marks"
            color={avgGrowth >= 0 ? "text-green-600" : "text-red-500"}
            bgColor={avgGrowth >= 0 ? "bg-green-50" : "bg-red-50"}
            icon={avgGrowth > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Student Growth Scatter */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
             <h3 className="font-bold text-slate-700 mb-2">Student Growth Distribution</h3>
             <p className="text-xs text-slate-400 mb-4">Points above the diagonal line indicate improvement.</p>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="Pre-Test" domain={[0, maxScore]} label={{ value: 'Pre-Test', position: 'insideBottom', offset: -10 }} />
                        <YAxis type="number" dataKey="y" name="Post-Test" domain={[0, maxScore]} label={{ value: 'Post-Test', angle: -90, position: 'insideLeft' }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                        {/* Diagonal Reference Line (Approximate x=y) */}
                        <ReferenceLine segment={[{ x: 0, y: 0 }, { x: maxScore, y: maxScore }]} stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth={2} />
                        <Scatter name="Students" data={scatterData} fill="#0ea5e9" />
                    </ScatterChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Chart 2: Question Mastery */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
             <h3 className="font-bold text-slate-700 mb-2">Topic Mastery Improvement</h3>
             <p className="text-xs text-slate-400 mb-4">Percentage of class achieving full marks per question.</p>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={questionChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} tick={{fill: '#64748b'}} />
                        <YAxis domain={[0, 100]} unit="%" fontSize={12} tick={{fill: '#64748b'}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{fill: '#f1f5f9'}}
                        />
                        <Legend />
                        <Bar dataKey="Pre" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Pre-Test %" />
                        <Bar dataKey="Post" fill="#16a34a" radius={[4, 4, 0, 0]} name="Post-Test %" />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
             <h3 className="font-bold text-slate-700">Growth Leaderboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-slate-500 bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 font-semibold">Student Name</th>
                        <th className="px-6 py-3 text-center font-semibold">Pre-Test</th>
                        <th className="px-6 py-3 text-center font-semibold">Post-Test</th>
                        <th className="px-6 py-3 text-center font-semibold">Total Change</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {studentStats
                        .sort((a,b) => b.growth - a.growth) // Sort by highest growth
                        .map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-slate-700 flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {idx + 1}
                                </span>
                                {s.name}
                            </td>
                            <td className="px-6 py-3 text-center text-slate-500">
                                {s.hasPre ? s.pre : '-'}
                            </td>
                            <td className="px-6 py-3 text-center text-slate-800 font-medium">
                                {s.hasPost ? s.post : '-'}
                            </td>
                            <td className="px-6 py-3 text-center">
                                <div className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded ${
                                    s.growth > 0 ? 'text-green-700 bg-green-50' : 
                                    s.growth < 0 ? 'text-red-700 bg-red-50' : 
                                    'text-slate-500 bg-slate-100'
                                }`}>
                                    {s.growth > 0 ? <TrendingUp className="w-3 h-3" /> : s.growth < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                    {s.growth > 0 ? '+' : ''}{s.growth}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const StatCard: React.FC<{ label: string; value: string; suffix?: string; color: string; bgColor: string; icon?: React.ReactNode }> = ({ label, value, suffix, color, bgColor, icon }) => (
    <div className={`p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between ${bgColor}`}>
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
            <div className={`text-3xl font-extrabold ${color} flex items-baseline gap-1`}>
                {value}
                {suffix && <span className="text-sm font-medium text-slate-400 opacity-80">{suffix}</span>}
            </div>
        </div>
        {icon && <div className={`p-3 rounded-full bg-white/50 ${color}`}>{icon}</div>}
    </div>
);

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-bold text-slate-800 text-sm mb-1">{data.name}</p>
          <div className="grid grid-cols-2 gap-x-4 text-xs">
              <span className="text-slate-500">Pre:</span>
              <span className="font-mono text-right font-medium">{data.x}</span>
              <span className="text-slate-500">Post:</span>
              <span className="font-mono text-right font-bold text-brand-600">{data.y}</span>
              <span className="text-slate-500">Growth:</span>
              <span className={`font-mono text-right font-bold ${data.growth > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {data.growth > 0 ? '+' : ''}{data.growth}
              </span>
          </div>
        </div>
      );
    }
    return null;
  };
