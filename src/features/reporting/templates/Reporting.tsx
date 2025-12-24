import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { ReviewPackage } from '@/types';
import { FileText, Download, Printer, ChevronDown, AlertTriangle, CheckCircle, TrendingUp, Users, Calendar } from 'lucide-react';

export const Reporting: React.FC = () => {
    const { classes, students, monitoringDocs } = useAppStore();
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    const selectedClass = classes.find(c => c.id === selectedClassId);
    const classStudents = selectedClass 
        ? students.filter(s => selectedClass.studentIds.includes(s.id))
        : [];
    
    const monitoringDoc = selectedClass 
        ? monitoringDocs.find(d => d.classId === selectedClass.id)
        : null;

    const handleExportPackage = () => {
        if (!selectedClass || !monitoringDoc) return;

        const pkg: ReviewPackage = {
            // @ts-ignore - ensuring compatibility with Settings.tsx import logic
            dataType: 'reviewPackage',
            classGroup: selectedClass,
            students: classStudents,
            monitoringDoc: monitoringDoc,
            profilerSnapshot: [],
            files: undefined
        };

        const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedClass.name.replace(/[^a-z0-9]/gi, '_')}_ReviewPackage.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Class Reporting</h2>
                    <p className="text-slate-500 dark:text-slate-400">Generate comprehensive handover packages and compliance reports.</p>
                </div>
                
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <select 
                            value={selectedClassId} 
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                        >
                            <option value="">Select a Class...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <button 
                        onClick={() => window.print()}
                        disabled={!selectedClass}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
                    >
                        <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Print</span>
                    </button>

                    <button 
                        onClick={handleExportPackage}
                        disabled={!selectedClass}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
                    >
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export Package</span>
                    </button>
                </div>
            </div>

            {/* Report Content */}
            {selectedClass ? (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col print:shadow-none print:border-none print:absolute print:inset-0 print:z-50">
                    {/* Report Header */}
                    <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 print:bg-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{selectedClass.name}</h1>
                                <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> {selectedClass.subject}</span>
                                    <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {classStudents.length} Students</span>
                                    <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Cohort: {classStudents[0]?.cohort || 'Mixed'}</span>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Generated</div>
                                <div className="text-lg font-medium text-slate-800 dark:text-slate-200 flex items-center justify-end gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Body */}
                    <div className="flex-1 overflow-y-auto p-8 print:overflow-visible">
                        
                        {/* Monitoring / Handover Section */}
                        <div className="mb-8 break-inside-avoid">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Monitoring & Wellbeing Handover
                            </h3>
                            {monitoringDoc ? (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm">
                                    <span className="font-bold">Monitoring Document Active</span>
                                    <p className="mt-1 text-xs opacity-80">Handover notes and compliance data are attached to this class.</p>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-500 italic text-sm">
                                    No monitoring document initialized for this class.
                                </div>
                            )}
                        </div>

                        {/* Student List */}
                        <div className="break-before-auto">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <CheckCircle className="w-5 h-5 text-brand-500" />
                                Class List
                            </h3>
                            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Support Level</th>
                                            <th className="px-4 py-3">Wellbeing</th>
                                            <th className="px-4 py-3">NCCD / ATSI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {classStudents.map(student => (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 break-inside-avoid">
                                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{student.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                        student.support.level === 'extensive' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                        student.support.level === 'substantial' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                        student.support.level === 'supplementary' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                        'bg-slate-100 text-slate-500 border border-slate-200'
                                                    }`}>
                                                        {student.support.level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${
                                                            student.wellbeing.status === 'red' ? 'bg-red-500 shadow-sm' :
                                                            student.wellbeing.status === 'amber' ? 'bg-amber-500 shadow-sm' :
                                                            'bg-emerald-500 shadow-sm'
                                                        }`} />
                                                        <span className="capitalize text-slate-600 dark:text-slate-400">{student.wellbeing.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                                    <div className="flex gap-1">
                                                        {student.isAtsi && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">ATSI</span>}
                                                        {student.support.needs.length > 0 && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">NCCD</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {classStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No students found in this class.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Select a class to generate report</p>
                    <p className="text-sm max-w-md text-center mt-2">Choose a class from the dropdown above to view the handover details and export the review package.</p>
                </div>
            )}
        </div>
    );
};