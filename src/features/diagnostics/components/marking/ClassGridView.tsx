import React, { useRef, useState, useEffect } from 'react';
import { RapidTest, Student, RapidResult } from '@/types';
import { AlertCircle, ArrowDown, ArrowRight } from 'lucide-react';

interface ClassGridViewProps {
  test: RapidTest;
  students: Student[]; // Already filtered by class from parent
  testType: 'pre' | 'post';
  results: RapidResult[];
  onSaveData: (studentId: string, questionId: string, score: number, response: string) => void;
}

export const ClassGridView: React.FC<ClassGridViewProps> = ({
  test,
  students,
  testType,
  results,
  onSaveData
}) => {
  const [progressionDirection, setProgressionDirection] = useState<'down' | 'right'>('right');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusInput = (sIdx: number, qIdx: number) => {
    if (sIdx < 0 || sIdx >= students.length) return;
    if (qIdx < 0 || qIdx >= test.questions.length) return;

    const key = `${students[sIdx].id}-${test.questions[qIdx].id}`;
    const el = inputRefs.current[key];
    if (el) {
        el.focus();
        el.select();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, sIdx: number, qIdx: number) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); focusInput(sIdx - 1, qIdx); }
      if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); focusInput(sIdx + 1, qIdx); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); focusInput(sIdx, qIdx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); focusInput(sIdx, qIdx + 1); }
  };

  const advanceFocus = (sIdx: number, qIdx: number) => {
    if (progressionDirection === 'down') {
      focusInput(sIdx + 1, qIdx);
    } else {
      focusInput(sIdx, qIdx + 1);
    }
  }

  const handleChange = (studentId: string, questionId: string, value: string, maxMarks: number, type: string, sIdx: number, qIdx: number) => {
      // 1. Determine Score & Response based on type
      let score = 0;
      let response = value;

      if (type === 'MCQ') {
          const key = value.slice(-1).toLowerCase(); // Get last char to handle rapid typing/replacement
          if (['a', 'b', 'c', 'd'].includes(key)) {
              response = key.toUpperCase();
              const q = test.questions.find(q => q.id === questionId);
              score = (q?.correctAnswer && response === q.correctAnswer) ? maxMarks : 0;
              advanceFocus(sIdx, qIdx);
          } else {
              return; // Ignore other keys
          }
      } else if (type === 'Spelling' || type === 'Matching') { 
            const key = value.slice(-1).toLowerCase();
            if (key === 'c') {
                score = maxMarks;
                response = 'Correct';
                advanceFocus(sIdx, qIdx);
            } else if (key === 'i' || key === 'x') {
                score = 0;
                response = 'Incorrect';
                advanceFocus(sIdx, qIdx);
            } else {
                return; // Ignore other keys
            }
      } else {
           // Numeric
           score = parseFloat(value);
           if (isNaN(score) || score < 0 || score > maxMarks) return; // Cap
           response = value;
           // For numeric, we don't auto-advance on type, but on Enter key press
           // The onKeyDown handler for 'Enter' will handle the focus change.
      }

      onSaveData(studentId, questionId, score, response);
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent, sIdx: number, qIdx: number) => {
    // Standard navigation
    handleKeyDown(e, sIdx, qIdx);
    
    // Advance on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      advanceFocus(sIdx, qIdx);
    }
  };

  if (students.length === 0) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>No students selected. Please choose a class from the sidebar.</p>
          </div>
      );
  }

  return (
    <div className="flex-1 bg-white overflow-hidden flex flex-col">
       {/* Toolbar for Progression Controls */}
       <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
           <span className="text-xs font-bold text-slate-500 uppercase">Rapid Entry Grid</span>
           <div className="flex items-center gap-2">
               <span className="text-xs text-slate-500 font-medium">Auto-advance:</span>
               <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                   <button onClick={() => setProgressionDirection('down')} className={`p-1.5 rounded ${progressionDirection === 'down' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`} title="Down (Next Student)">
                       <ArrowDown className="w-3.5 h-3.5" />
                   </button>
                   <button onClick={() => setProgressionDirection('right')} className={`p-1.5 rounded ${progressionDirection === 'right' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`} title="Right (Next Question)">
                       <ArrowRight className="w-3.5 h-3.5" />
                   </button>
               </div>
           </div>
       </div>

       <div className="overflow-auto flex-1">
           <table className="w-full text-sm border-collapse table-fixed">
               <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                   <tr>
                       <th className="p-3 text-left font-bold text-slate-700 border-b border-r border-slate-200 sticky left-0 bg-slate-50 min-w-[200px] z-30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                           Student
                       </th>
                       {test.questions.map((q, idx) => (
                           <th key={q.id} className="p-2 text-center font-medium text-slate-600 border-b border-r border-slate-200 min-w-[100px]">
                               <div className="flex flex-col items-center">
                                   <span className="font-bold">Q{idx + 1}</span>
                                   <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{q.prompt}</span>
                                   <span className="text-[9px] bg-slate-200 px-1 rounded mt-0.5">/{q.maxMarks}</span>
                               </div>
                           </th>
                       ))}
                       <th className="p-3 text-center font-bold text-slate-700 border-b border-slate-200 bg-slate-50 w-[80px]">Total</th>
                   </tr>
               </thead>
               <tbody>
                   {students.map((student, sIdx) => {
                       const result = results.find(r => r.studentId === student.id && r.testId === test.id);
                       const scores = testType === 'pre' ? result?.preTestScores : result?.postTestScores;
                       const responses = testType === 'pre' ? result?.preTestResponses : result?.postTestResponses;
                       
                       const totalScore = scores ? Object.values(scores).reduce((a: number, b: number) => a + b, 0) : 0;

                       return (
                           <tr key={student.id} className="hover:bg-slate-50 group">
                               <td className="p-3 font-medium text-slate-700 border-r border-b border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                   {student.name}
                               </td>
                               {test.questions.map((q, qIdx) => {
                                   const isNumeric = q.type === 'Marks' || q.type === 'Written';
                                   
                                   // Get raw values
                                   const scoreVal = scores?.[q.id];
                                   const responseVal = responses?.[q.id];
                                   
                                   // Determine display value
                                   let displayVal: string | number = '';
                                   if (isNumeric) {
                                       displayVal = scoreVal !== undefined ? scoreVal : '';
                                   } else {
                                       displayVal = responseVal || '';
                                   }

                                   const key = `${student.id}-${q.id}`;
                                   let cellBg = 'bg-white';

                                   // Logic for coloring
                                   if (isNumeric && scoreVal !== undefined) {
                                       if (Number(scoreVal) === q.maxMarks) {
                                           cellBg = 'bg-green-100 text-green-800 font-bold';
                                       } else if (Number(scoreVal) === 0) {
                                           cellBg = 'bg-red-100 text-red-800 font-bold';
                                       } else {
                                           cellBg = 'bg-orange-100 text-orange-800 font-bold';
                                       }
                                   } else if (q.type === 'MCQ' && responseVal) {
                                       const isCorrect = q.correctAnswer && String(responseVal).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
                                       cellBg = isCorrect ? 'bg-green-100 text-green-800 font-bold' : 'bg-red-100 text-red-800 font-bold';
                                   } else if ((q.type === 'Spelling' || q.type === 'Matching') && responseVal) {
                                        const isCorrectBinary = (Number(scoreVal) || 0) === q.maxMarks;
                                        cellBg = isCorrectBinary ? 'bg-green-100 text-green-800 font-bold' : 'bg-red-100 text-red-800 font-bold';
                                        // Map words to symbols for display
                                        if (responseVal === 'Correct') displayVal = '✓';
                                        if (responseVal === 'Incorrect') displayVal = '✗';
                                   }

                                   return (
                                       <td key={q.id} className="p-0 border-r border-b border-slate-200 text-center">
                                           <input 
                                                ref={el => { inputRefs.current[key] = el; }}
                                                type="text"
                                                value={displayVal}
                                                onChange={(e) => {
                                                    // For non-numeric, handle change directly. For numeric, it's just a standard input.
                                                    if (!isNumeric) {
                                                        handleChange(student.id, q.id, e.target.value, q.maxMarks, q.type, sIdx, qIdx);
                                                    } else {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) {
                                                            onSaveData(student.id, q.id, val, e.target.value);
                                                        } else if (e.target.value === '') {
                                                            // Handle clear
                                                            onSaveData(student.id, q.id, 0, '');
                                                        }
                                                    }
                                                }}
                                                onKeyDown={(e) => isNumeric ? handleNumericKeyDown(e, sIdx, qIdx) : handleKeyDown(e, sIdx, qIdx)}
                                                className={`w-full h-full text-center p-2 outline-none focus:ring-2 focus:ring-brand-500 ${cellBg}`}
                                                placeholder="-"
                                           />
                                       </td>
                                   );
                               })}
                               <td className="p-3 text-center font-bold text-slate-800 bg-slate-50/30 border-b border-slate-200">
                                   {totalScore}
                               </td>
                           </tr>
                       );
                   })}
               </tbody>
           </table>
       </div>
    </div>
  );
};