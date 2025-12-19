
import React, { useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { RapidTest, Student } from '@/types';
import { RapidMarkingInput } from './RapidMarkingInput';

interface SingleStudentViewProps {
  test: RapidTest;
  student: Student;
  testType: 'pre' | 'post';
  scores: Record<string, number>;
  responses: Record<string, string>;
  onSaveData: (questionId: string, score: number, response: string) => void;
  onNextStudent: () => void;
  onPrevStudent: () => void;
}

export const SingleStudentView: React.FC<SingleStudentViewProps> = ({
  test,
  student,
  testType,
  scores,
  responses,
  onSaveData,
  onNextStudent,
  onPrevStudent
}) => {
  // Map questionId -> element ref (Divs now, not inputs)
  const inputRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Focus first question when student changes
  useEffect(() => {
      if (test.questions.length > 0) {
          const firstQId = test.questions[0].id;
          const el = inputRefs.current[firstQId];
          if (el) {
              setTimeout(() => el.focus(), 50);
          }
      }
  }, [student.id, test.questions]);

  const handleFocusNext = (currentIndex: number) => {
    if (currentIndex < test.questions.length - 1) {
      const nextQ = test.questions[currentIndex + 1];
      const el = inputRefs.current[nextQ.id];
      if (el) {
        el.focus();
      }
    } else {
        // End of test - auto-advance student
        onNextStudent();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold uppercase">{student.cohort}</span>
                    <span>•</span>
                    <span>{testType === 'pre' ? 'Pre-Test' : 'Post-Test'} Entry</span>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={onPrevStudent} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button onClick={onNextStudent} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm font-medium">
                    Next Student <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Scrollable Questions Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-4">
                {test.questions.map((q, index) => (
                    <div 
                        key={q.id} 
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center"
                    >
                        {/* Prompt Side */}
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">Question {index + 1}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{q.type}</span>
                            </div>
                            <h3 className="text-xl font-medium text-slate-800">{q.prompt}</h3>
                            
                            {/* Context for MCQ Options or Spelling Word */}
                            {q.type === 'MCQ' && q.options && (
                                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                                    {q.options.map((opt, i) => (
                                        <div key={i} className="text-sm text-slate-500 flex items-start gap-2">
                                            <span className="font-bold text-slate-300 shrink-0">{['A','B','C','D'][i]}.</span> 
                                            <span className="leading-snug">{opt}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(q.type === 'Spelling' || q.type === 'Matching') && q.correctAnswer && (
                                <div className="mt-2 text-sm text-slate-400">
                                    Target: <span className="font-mono font-bold text-slate-600">{q.correctAnswer}</span>
                                </div>
                            )}
                        </div>

                        {/* Input Side (Clicker Interface) */}
                        <div className="shrink-0">
                            <RapidMarkingInput 
                                question={q}
                                currentScore={scores[q.id]}
                                currentResponse={responses[q.id]}
                                domRef={(el) => { inputRefs.current[q.id] = el; }}
                                onCommit={(score, response) => {
                                    onSaveData(q.id, score, response);
                                    setTimeout(() => handleFocusNext(index), 50); // Slight delay for visual feedback
                                }}
                            />
                        </div>
                    </div>
                ))}

                <div className="pt-8 flex justify-center pb-12">
                     <button onClick={onNextStudent} className="px-8 py-3 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-105 transition-transform font-bold flex items-center gap-2">
                        Finish & Next Student <ArrowRight className="w-5 h-5" />
                     </button>
                </div>
            </div>
        </div>
    </div>
  );
};
