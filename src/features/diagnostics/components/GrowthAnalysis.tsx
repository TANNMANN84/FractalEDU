import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import { useAppStore } from '@/store';
import { RapidTest } from '@/types';

interface GrowthAnalysisProps {
  test: RapidTest;
  onBack: () => void;
}

export const GrowthAnalysis: React.FC<GrowthAnalysisProps> = ({ test, onBack }) => {
  const { rapidResults, students } = useAppStore();

  // Prepare Data
  const analysisData = useMemo(() => {
    // 1. Get all results for this test
    const relevantResults = rapidResults.filter(r => r.testId === test.id);
    
    // 2. Map to student format
    const data = relevantResults.map(r => {
        const student = students.find(s => s.id === r.studentId);
        
        const preValues = Object.values(r.preTestScores) as number[];
        const postValues = Object.values(r.postTestScores) as number[];
        
        const preTotal = preValues.reduce((a, b) => a + (b || 0), 0);
        const postTotal = postValues.reduce((a, b) => a + (b || 0), 0);
        
        return {
            name: student ? student.name : 'Unknown',
            pre: preTotal,
            post: postTotal,
            growth: postTotal - preTotal,
            hasBoth: Object.keys(r.preTestScores).length > 0 && Object.keys(r.postTestScores).length > 0
        };
    }).filter(d => d.hasBoth); // Only analyze students with both scores

    return data;
  }, [rapidResults, students, test.id]);

  const maxScore = test.questions.reduce((a, b) => a + b.maxMarks, 0);

  // Stats
  const avgPre = analysisData.length > 0 ? analysisData.reduce((a, b) => a + b.pre, 0) / analysisData.length : 0;
  const avgPost = analysisData.length > 0 ? analysisData.reduce((a, b) => a + b.post, 0) / analysisData.length : 0;
  const avgGrowth = avgPost - avgPre;

  const barData = [
      { name: 'Class Average', Pre: avgPre, Post: avgPost }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Growth Analysis: {test.name}</h2>
            <p className="text-slate-500">{analysisData.length} students analyzed • Max Score: {maxScore}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase">Avg Pre-Test</h3>
            <p className="text-3xl font-bold text-slate-600 mt-2">{avgPre.toFixed(1)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase">Avg Post-Test</h3>
            <p className="text-3xl font-bold text-brand-600 mt-2">{avgPost.toFixed(1)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase">Avg Growth</h3>
            <p className={`text-3xl font-bold mt-2 ${avgGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {avgGrowth > 0 ? '+' : ''}{avgGrowth.toFixed(1)}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Scatter Plot: Effect Size / Individual Growth */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">
             <h3 className="font-bold text-slate-700 mb-4">Student Growth Scatter</h3>
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="pre" name="Pre-Test" domain={[0, maxScore]} label={{ value: 'Pre-Test Score', position: 'insideBottom', offset: -10 }} />
                    <YAxis type="number" dataKey="post" name="Post-Test" domain={[0, maxScore]} label={{ value: 'Post-Test Score', angle: -90, position: 'insideLeft' }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <ReferenceLine segment={[{ x: 0, y: 0 }, { x: maxScore, y: maxScore }]} stroke="#cbd5e1" strokeDasharray="3 3" />
                    <Scatter name="Students" data={analysisData} fill="#0ea5e9" />
                </ScatterChart>
             </ResponsiveContainer>
          </div>

          {/* Bar Chart: Class Comparison */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">
             <h3 className="font-bold text-slate-700 mb-4">Class Average Comparison</h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, maxScore]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Pre" fill="#94a3b8" name="Avg Pre-Test" />
                    <Bar dataKey="Post" fill="#16a34a" name="Avg Post-Test" />
                </BarChart>
             </ResponsiveContainer>
          </div>

      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
             <h3 className="font-bold text-slate-700">Growth Details</h3>
          </div>
          <table className="w-full text-sm text-left">
              <thead className="text-slate-500 bg-slate-50 border-b border-slate-200">
                  <tr>
                      <th className="px-6 py-3">Student</th>
                      <th className="px-6 py-3 text-center">Pre-Test</th>
                      <th className="px-6 py-3 text-center">Post-Test</th>
                      <th className="px-6 py-3 text-center">Growth</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {analysisData.sort((a,b) => b.growth - a.growth).map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-700">{d.name}</td>
                          <td className="px-6 py-3 text-center text-slate-500">{d.pre}</td>
                          <td className="px-6 py-3 text-center text-slate-500">{d.post}</td>
                          <td className={`px-6 py-3 text-center font-bold ${d.growth > 0 ? 'text-green-600' : d.growth < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                              {d.growth > 0 ? '+' : ''}{d.growth}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};