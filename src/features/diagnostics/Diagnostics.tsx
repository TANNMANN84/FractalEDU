
import React, { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { Stethoscope, Plus, Edit, BarChart2, Table, Upload, Tag, Calendar, Share2, Trash2, Filter } from 'lucide-react';
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
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  
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

  // -- Filter Logic --
  const filteredTests = rapidTests.filter(test => {
    if (selectedYears.length === 0) return true;
    // Parse yearGroup to number for comparison
    const y = parseInt(test.yearGroup?.toString() || '0');
    return selectedYears.includes(y);
  });

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
          <h2 className="text-2xl font-bold text-slate-800">Pre/Post Diagnostics Tool</h2>
          <p className="text-slate-500">Pre and Post Testing marking assistant with a comparison and analytics tool.</p>
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

      {/* Year Filter */}
      <div className="flex items-center gap-4 py-1 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Filter className="w-4 h-4" />
              <span>Filter Year:</span>
          </div>
          <div className="flex items-center gap-3">
              {[7, 8, 9, 10].map(year => (
                  <label key={year} className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:border-brand-300 hover:bg-slate-50 transition-all select-none shadow-sm">
                      <input 
                          type="checkbox"
                          checked={selectedYears.includes(year)}
                          onChange={(e) => {
                              if (e.target.checked) {
                                  setSelectedYears(prev => [...prev, year]);
                              } else {
                                  setSelectedYears(prev => prev.filter(y => y !== year));
                              }
                          }}
                          className="rounded text-brand-600 focus:ring-brand-500 border-slate-300 w-4 h-4"
                      />
                      Year {year}
                  </label>
              ))}
              {selectedYears.length > 0 && (
                  <button 
                      onClick={() => setSelectedYears([])}
                      className="text-xs font-medium text-slate-400 hover:text-red-500 px-2"
                  >
                      Clear
                  </button>
              )}
          </div>
      </div>

      {/* Hero Banner (Only if list is empty or just for flavor) */}
      {rapidTests.length === 0 && selectedYears.length === 0 && (
        <div className="bg-gradient-to-r from-violet-500 to-fuchsia-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden shrink-0">
            <div className="relative z-10 max-w-lg">
            <h3 className="text-3xl font-bold mb-2">Measure Growth</h3>
            <p className="text-violet-100 mb-6">Create quick pre/post tests to track student improvement over a specific topic or skill interval.</p>
            </div>
            <Stethoscope className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-10 rotate-12" />
        </div>
      )}

      {/* Test List */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {filteredTests.map(test => (
            <div key={test.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group grid grid-cols-[1fr_auto_1fr] items-center gap-4 shrink-0">
                
                {/* Left: Title & Year */}
                <div className="flex items-center gap-4 min-w-0">
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-brand-600 transition-colors">{test.name}</h3>
                    
                    {test.yearGroup && (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-sm font-bold shrink-0" title={`Year ${test.yearGroup}`}>
                            {test.yearGroup}
                        </div>
                    )}

                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100 whitespace-nowrap">
                            {test.questions.length} Qs
                        </span>
                        {test.tags.map(tag => (
                            <span key={tag} className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100 hidden md:inline-flex items-center gap-1">
                                <Tag className="w-3 h-3" /> {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Center: Primary Action */}
                <div className="flex justify-center">
                    <button 
                        onClick={() => handleOpenEntry(test.id)}
                        className="px-6 py-2 bg-brand-600 text-white rounded-full text-sm font-bold hover:bg-brand-700 flex items-center gap-2 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        title="Enter Data"
                    >
                        <Table className="w-4 h-4" /> 
                        <span>Add Student Results</span>
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={() => handleOpenAnalysis(test.id)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors text-sm font-medium"
                        title="Analysis"
                    >
                        <BarChart2 className="w-4 h-4" />
                        <span className="hidden xl:inline">Analysis</span>
                    </button>
                    <button 
                        onClick={() => handleShare(test)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                        title="Share/Export"
                    >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden xl:inline">Share</span>
                    </button>
                    <button 
                        onClick={() => handleEditTest(test)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                        title="Edit Test"
                    >
                        <Edit className="w-4 h-4" />
                        <span className="hidden xl:inline">Edit</span>
                    </button>
                    <button 
                        onClick={() => setDeleteTarget(test)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden xl:inline">Delete</span>
                    </button>
                </div>
            </div>
        ))}

        {filteredTests.length === 0 && (
           <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
               <Stethoscope className="w-12 h-12 mb-3 opacity-20" />
               <p>{rapidTests.length === 0 ? "No rapid tests found." : "No tests match the selected filters."}</p>
               {rapidTests.length === 0 && <button onClick={handleCreateNew} className="mt-2 text-brand-600 hover:underline">Create your first test</button>}
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
