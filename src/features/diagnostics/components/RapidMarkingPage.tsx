import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { RapidTest, RapidResult } from '@/types';
import { MarkingSidebar } from './marking/MarkingSidebar';
import { SingleStudentView } from './marking/SingleStudentView';
import { ClassGridView } from './marking/ClassGridView';
import { ArrowLeft, LayoutGrid, Square, Download } from 'lucide-react';

interface RapidMarkingPageProps {
  test: RapidTest;
  onBack: () => void;
}

export const RapidMarkingPage: React.FC<RapidMarkingPageProps> = ({ test, onBack }) => {
  const { students, classes, rapidResults, setRapidResult } = useAppStore();
  
  // View State
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [testType, setTestType] = useState<'pre' | 'post'>('pre');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Derived filtered students (for next/prev logic)
  const filteredStudents = React.useMemo(() => {
    let list = students;
    if (selectedClassId !== 'all') {
      const cls = classes.find(c => c.id === selectedClassId);
      list = list.filter(s => cls?.studentIds.includes(s.id));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, classes, selectedClassId]);

  // Init selection
  useEffect(() => {
    if (filteredStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(filteredStudents[0].id);
    }
  }, [filteredStudents]);

  // Data Handler
  const handleSaveData = (studentId: string, questionId: string, score: number, response: string) => {
     // 1. Get existing result or create new
     const existing = rapidResults.find(r => r.studentId === studentId && r.testId === test.id);
     
     const baseScores = existing ? (testType === 'pre' ? existing.preTestScores : existing.postTestScores) : {};
     const baseResponses = existing ? (testType === 'pre' ? existing.preTestResponses : existing.postTestResponses) : {};

     const newScores = { ...baseScores, [questionId]: score };
     const newResponses = { ...(baseResponses || {}), [questionId]: response };

     const updatedResult: RapidResult = {
         studentId,
         testId: test.id,
         preTestScores: testType === 'pre' ? newScores : (existing?.preTestScores || {}),
         postTestScores: testType === 'post' ? newScores : (existing?.postTestScores || {}),
         preTestResponses: testType === 'pre' ? newResponses : (existing?.preTestResponses || {}),
         postTestResponses: testType === 'post' ? newResponses : (existing?.postTestResponses || {})
     };

     setRapidResult(updatedResult);
  };

  // Nav Handlers
  const handleNextStudent = () => {
     const idx = filteredStudents.findIndex(s => s.id === selectedStudentId);
     if (idx < filteredStudents.length - 1) {
         setSelectedStudentId(filteredStudents[idx + 1].id);
     }
  };

  const handlePrevStudent = () => {
     const idx = filteredStudents.findIndex(s => s.id === selectedStudentId);
     if (idx > 0) {
         setSelectedStudentId(filteredStudents[idx - 1].id);
     }
  };

  const currentResult = rapidResults.find(r => r.studentId === selectedStudentId && r.testId === test.id);
  const currentScores = testType === 'pre' ? currentResult?.preTestScores : currentResult?.postTestScores;
  const currentResponses = testType === 'pre' ? currentResult?.preTestResponses : currentResult?.postTestResponses;

  const currentStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
        
        {/* Sidebar (Always visible unless mobile?) */}
        <MarkingSidebar 
            students={students}
            classes={classes}
            results={rapidResults}
            testId={test.id}
            testType={testType}
            selectedStudentId={selectedStudentId}
            selectedClassId={selectedClassId}
            onSelectStudent={setSelectedStudentId}
            onSelectClass={setSelectedClassId}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
            
            {/* Toolbar */}
            <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                     </button>
                     <div>
                        <h2 className="font-bold text-slate-800 text-lg leading-tight">{test.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                             <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                                 <button 
                                    onClick={() => setTestType('pre')} 
                                    className={`px-3 py-0.5 text-xs font-bold rounded ${testType === 'pre' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}
                                 >
                                    PRE
                                 </button>
                                 <button 
                                    onClick={() => setTestType('post')} 
                                    className={`px-3 py-0.5 text-xs font-bold rounded ${testType === 'post' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}
                                 >
                                    POST
                                 </button>
                             </div>
                        </div>
                     </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex">
                        <button 
                            onClick={() => setViewMode('single')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'single' ? 'bg-white shadow text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Single Student View"
                        >
                            <Square className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Class Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Viewport */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {viewMode === 'single' ? (
                    currentStudent ? (
                        <SingleStudentView 
                            test={test}
                            student={currentStudent}
                            testType={testType}
                            scores={currentScores || {}}
                            responses={currentResponses || {}}
                            onSaveData={(qId, score, resp) => handleSaveData(currentStudent.id, qId, score, resp)}
                            onNextStudent={handleNextStudent}
                            onPrevStudent={handlePrevStudent}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            Select a student to begin marking.
                        </div>
                    )
                ) : (
                    <ClassGridView 
                        test={test}
                        students={filteredStudents}
                        testType={testType}
                        results={rapidResults}
                        onSaveData={(sId, qId, score, resp) => handleSaveData(sId, qId, score, resp)}
                    />
                )}
            </div>
        </div>
    </div>
  );
};