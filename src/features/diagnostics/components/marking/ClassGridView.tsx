import React, { useRef, useState, useEffect } from 'react';
import { RapidTest, Student, RapidResult } from '@/types';
import { AlertCircle } from 'lucide-react';

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
      if (e.key === 'ArrowLeft') { 
          // e.preventDefault(); focusInput(sIdx, qIdx - 1); // Optional: Standard nav
      }
      if (e.key === 'ArrowRight') { 
          // e.preventDefault(); focusInput(sIdx, qIdx + 1); 
      }
  };

  const handleChange = (studentId: string, questionId: string, value: string, maxMarks: number, type: string, sIdx: number, qIdx: number) => {
      // 1. Determine Score & Response based on type
      let score = 0;
      let response = value;

      if (type === 'MCQ') {
          // Auto-caps
          response = value.toUpperCase().slice(0, 1);
          // Determine score if we have correct answer
          const q = test.questions.find(q => q.id === questionId);
          if (q?.correctAnswer) {
              score = response === q.correctAnswer ? maxMarks : 0;
          }
          // Auto advance on single char entry
          if (response.length === 1) {
              focusInput(sIdx + 1, qIdx); 
          }
      } else if (type === 'Spelling' || type === 'Matching') {
           // For grid view, we might just assume marks unless we want full text
           // Let's assume text entry.
           // Score logic: If exact match?
           const q = test.questions.find(q => q.id === questionId);
           if (q?.correctAnswer && value.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
               score = maxMarks;
           }
      } else {
           // Numeric
           score = parseFloat(value);
           if (isNaN(score)) score = 0;
           if (score > maxMarks) return; // Cap
           response = value;
      }

      onSaveData(studentId, questionId, score, response);
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
       <div className="overflow-auto flex-1">
           <table className="w-full text-sm border-collapse">
               <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                   <tr>
                       <th className="p-3 text-left font-bold text-slate-700 border-b border-r border-slate-200 sticky left-0 bg-slate-50 min-w-[200px] z-30">Student</th>
                       {test.questions.map((q, idx) => (
                           <th key={q.id} className="p-2 text-center font-medium text-slate-600 border-b border-r border-slate-200 min-w-[100px]">
                               <div className="flex flex-col items-center">
                                   <span className="font-bold">Q{idx + 1}</span>
                                   <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{q.prompt}</span>
                                   <span className="text-[9px] bg-slate-200 px-1 rounded mt-0.5">/{q.maxMarks}</span>
                               </div>
                           </th>
                       ))}
                       <th className="p-3 text-center font-bold text-slate-700 border-b border-slate-200 bg-slate-50">Total</th>
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
                               <td className="p-3 font-medium text-slate-700 border-r border-b border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                   {student.name}
                               </td>
                               {test.questions.map((q, qIdx) => {
                                   const val = responses?.[q.id] || (scores?.[q.id] !== undefined ? scores?.[q.id] : '') || '';
                                   const key = `${student.id}-${q.id}`;
                                   const isCorrect = q.correctAnswer && String(val).toUpperCase() === q.correctAnswer;
                                   
                                   let cellBg = 'bg-white';
                                   if (q.type === 'MCQ' && val) {
                                       cellBg = isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';
                                   }

                                   return (
                                       <td key={q.id} className="p-1 border-r border-b border-slate-100 text-center">
                                           <input 
                                                ref={el => { inputRefs.current[key] = el; }}
                                                type="text"
                                                value={val}
                                                onChange={(e) => handleChange(student.id, q.id, e.target.value, q.maxMarks, q.type, sIdx, qIdx)}
                                                onKeyDown={(e) => handleKeyDown(e, sIdx, qIdx)}
                                                className={`w-full text-center p-2 rounded outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${cellBg}`}
                                                placeholder="-"
                                           />
                                       </td>
                                   );
                               })}
                               <td className="p-3 text-center font-bold text-slate-800 bg-slate-50/30 border-b border-slate-100">
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