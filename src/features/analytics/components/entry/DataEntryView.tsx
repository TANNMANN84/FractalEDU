import React, { useState } from 'react';
import { Exam } from '@/types';
import { ResultsEntryForm } from './ResultsEntryForm';
import { SplitEntryView } from './SplitEntryView';
import { Columns, Table } from 'lucide-react';

interface DataEntryViewProps {
    exam: Exam;
}

export const DataEntryView: React.FC<DataEntryViewProps> = ({ exam }) => {
    const [mode, setMode] = useState<'split' | 'spreadsheet'>('split');

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header / Toggle */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-800">Results Entry</h2>
                    <span className="text-slate-300">|</span>
                    <p className="text-sm text-slate-500 font-medium">{exam.name}</p>
                </div>

                <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex">
                    <button
                        onClick={() => setMode('split')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                            mode === 'split' 
                                ? 'bg-white text-brand-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Columns className="w-4 h-4" />
                        Split View
                    </button>
                    <button
                        onClick={() => setMode('spreadsheet')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                            mode === 'spreadsheet' 
                                ? 'bg-white text-brand-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Table className="w-4 h-4" />
                        Spreadsheet
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {mode === 'split' ? (
                    <SplitEntryView exam={exam} />
                ) : (
                    <ResultsEntryForm exam={exam} />
                )}
            </div>
        </div>
    );
};