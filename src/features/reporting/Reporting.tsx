
import React, { useState } from 'react';
import { FileText, BarChart2, ShieldCheck } from 'lucide-react';
import { ReportConfigModal } from './components/ReportConfigModal';

export const Reporting: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<'student' | 'class' | 'compliance' | null>(null);

  const reportTypes = [
    {
      id: 'student',
      title: 'Individual Student Reports',
      description: 'Generate specific profiles including General, HPGE, Literacy, Numeracy, Academic, and NCCD Evidence reports.',
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-600',
      border: 'hover:border-indigo-300'
    },
    {
      id: 'class',
      title: 'Class Reports',
      description: 'Overview of class performance, academic graphs (Pre/Post, NAPLAN), and student statistics.',
      icon: BarChart2,
      color: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-300'
    },
    {
      id: 'compliance',
      title: 'Junior Monitoring Report',
      description: 'Compliance certificates and full breakdown of monitoring sign-offs by Term or Whole Year.',
      icon: ShieldCheck,
      color: 'bg-amber-50 text-amber-600',
      border: 'hover:border-amber-300'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Reporting Suite</h2>
        <p className="text-slate-500">Generate professional PDFs and smart packages for handover or archival.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReportType(report.id as any)}
            className={`flex flex-col p-6 bg-white rounded-xl border border-slate-200 shadow-sm transition-all text-left group ${report.border} hover:shadow-md`}
          >
            <div className={`p-4 rounded-xl w-fit mb-4 ${report.color}`}>
              <report.icon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-brand-600 transition-colors">
              {report.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {report.description}
            </p>
          </button>
        ))}
      </div>

      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-2">Smart Packaging Engine</h3>
        <p className="text-sm text-slate-600">
          Fractal EDU automatically stitches image and PDF evidence directly into the final report. 
          Incompatible files (like Word docs or Excel sheets) are automatically bundled into a ZIP archive alongside the report.
        </p>
      </div>

      {selectedReportType && (
        <ReportConfigModal 
          type={selectedReportType} 
          onClose={() => setSelectedReportType(null)} 
        />
      )}
    </div>
  );
};
