
import React, { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { Stethoscope, Plus, Edit, BarChart2, Table, Upload, Tag, Calendar, Share2, Trash2 } from 'lucide-react';
import { RapidTest } from '@/types';
import { RapidTestBuilder } from './components/RapidTestBuilder';
import { RapidMarkingPage } from './components/RapidMarkingPage';
import { RapidAnalysisView } from './components/analysis/RapidAnalysisView';
import { parseLegacyTest } from './utils/legacyImporter';
import { ConfirmDialog } from '@/shared/components/Dialogs';

export const Diagnostics: React.FC = () => {
  const { rapidTests, addRapidTest, deleteRapidTest } = useAppStore();
  
  // -- View Management --
  const [view, setView] = useState<'list' | 'builder' | 'entry' | 'analysis'>('list');
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [testToEdit, setTestToEdit] = useState<RapidTest | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<RapidTest | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTest = rapidTests.find(t => t.id === activeTestId);

  // -- Handlers --

  const handleCreateNew = () => {
    setTestToEdit(undefined);
    setView('builder');
  };

  const handleEditTest = (test: RapidTest) => {
    setTestToEdit(test);
    setView('builder');
  };

  const handleOpenEntry = (testId: string) => {
    setActiveTestId(testId);
    setView('entry');
  };

  const handleOpenAnalysis = (testId: string) => {
    setActiveTestId(testId);
    setView('analysis');
  };

  const handleBack = () => {
    setView('list');
    setActiveTestId(null);
    setTestToEdit(undefined);
  };

  const handleShare = (test: RapidTest) => {
      const exportData = {
          ...test,
          mode: 'rapid-test',
          exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${test.name.replace(/[^a-z0-9]/gi, '_')}_test.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const performDelete = () => {
      if (deleteTarget) {
          deleteRapidTest(deleteTarget.id);
          setDeleteTarget(null);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const importedTest = parseLegacyTest(json);
        
        // Ensure ID uniqueness
        if (rapidTests.some(t => t.id === importedTest.id)) {
             if (!confirm(`A test with ID "${importedTest.id}" already exists. Import as copy?`)) return;
             importedTest.id = crypto.randomUUID();
        }

        addRapidTest(importedTest);
        alert(`Successfully imported "${importedTest.name}"`);
      } catch (err) {
        console.error(err);
        alert('Failed to import test. Please check the JSON format.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // -- Render Logic --

  if (view === 'entry' && activeTest) {
      return <RapidMarkingPage test={activeTest} onBack={handleBack} />;
  }

  if (view === 'analysis' && activeTest) {
      return <RapidAnalysisView test={activeTest} onBack={handleBack} />;
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Diagnostics</h2>
          <p className="text-slate-500">Rapid testing and gap analysis tools.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium"
            >
                <Upload className="w-4 h-4" /> Import JSON
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileUpload} 
            />
            
            <button 
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium"
            >
                <Plus className="w-4 h-4" /> New Blank Test
            </button>
        </div>
      </div>

      {/* Hero Banner (Only if list is empty or just for flavor) */}
      {rapidTests.length === 0 && (
        <div className="bg-gradient-to-r from-violet-500 to-fuchsia-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden shrink-0">
            <div className="relative z-10 max-w-lg">
            <h3 className="text-3xl font-bold mb-2">Measure Growth</h3>
            <p className="text-violet-100 mb-6">Create quick pre/post tests to track student improvement over a specific topic or skill interval.</p>
            </div>
            <Stethoscope className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-10 rotate-12" />
        </div>
      )}

      {/* Test Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto">
        {rapidTests.map(test => (
            <div key={test.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full max-h-[280px]">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-brand-600 transition-colors line-clamp-2">{test.name}</h3>
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2">
                        {test.questions.length} Qs
                    </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {test.yearGroup && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                            Yr {test.yearGroup}
                        </span>
                    )}
                    {test.tags.map(tag => (
                        <span key={tag} className="text-xs font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-100 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {tag}
                        </span>
                    ))}
                </div>

                <p className="text-xs text-slate-400 mt-auto mb-4 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Created {new Date(test.dateCreated).toLocaleDateString()}
                </p>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                    <button 
                        onClick={() => handleOpenEntry(test.id)}
                        className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-lg text-sm font-bold hover:bg-brand-100 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Table className="w-4 h-4" /> Data Entry
                    </button>
                    <button 
                        onClick={() => handleOpenAnalysis(test.id)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Analysis"
                    >
                        <BarChart2 className="w-5 h-5" />
                    </button>
                    
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>

                    <button 
                        onClick={() => handleShare(test)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Share/Export"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleEditTest(test)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Test"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setDeleteTarget(test)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ))}

        {rapidTests.length === 0 && (
           <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
               <Stethoscope className="w-12 h-12 mb-3 opacity-20" />
               <p>No rapid tests found.</p>
               <button onClick={handleCreateNew} className="mt-2 text-brand-600 hover:underline">Create your first test</button>
           </div>
        )}
      </div>

      {view === 'builder' && (
          <RapidTestBuilder 
            onClose={() => setView('list')} 
            existingTest={testToEdit} 
          />
      )}

      <ConfirmDialog 
        isOpen={!!deleteTarget} 
        title="Delete Test" 
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all associated results.`} 
        onConfirm={performDelete} 
        onCancel={() => setDeleteTarget(null)} 
        isDanger={true}
      />

    </div>
  );
};
