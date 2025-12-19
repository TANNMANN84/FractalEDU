import React, { useRef, useEffect } from 'react';
import { Check, X, Hash } from 'lucide-react';
import { RapidQuestion } from '@/types';

interface RapidMarkingInputProps {
  question: RapidQuestion;
  currentScore?: number;
  currentResponse?: string;
  onCommit: (score: number, response: string) => void;
  domRef: (el: HTMLDivElement | null) => void;
}

export const RapidMarkingInput: React.FC<RapidMarkingInputProps> = ({
  question,
  currentScore,
  currentResponse,
  onCommit,
  domRef
}) => {
  
  // Helper to handle commit and ensure focus stays or moves as expected by parent
  const handleSelection = (score: number, response: string) => {
    onCommit(score, response);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key.toLowerCase();

    // --- Scenario A: Spelling / Matching (Binary) ---
    if (question.type === 'Spelling' || question.type === 'Matching') {
      if (key === 'c') {
        e.preventDefault();
        handleSelection(question.maxMarks, 'Correct');
      } else if (key === 'i' || key === 'x') {
        e.preventDefault();
        handleSelection(0, 'Incorrect');
      }
    }

    // --- Scenario C: MCQ ---
    if (question.type === 'MCQ') {
      if (['a', 'b', 'c', 'd'].includes(key)) {
        e.preventDefault();
        // Check if correct
        const responseUpper = key.toUpperCase();
        const isCorrect = question.correctAnswer && responseUpper === question.correctAnswer;
        handleSelection(isCorrect ? question.maxMarks : 0, responseUpper);
      }
    }

    // --- Scenario B: Marks ---
    if (question.type === 'Marks' || question.type === 'Written') {
      // If using button array (maxMarks <= 5), map number keys
      if (question.maxMarks <= 5) {
        const num = parseInt(key);
        if (!isNaN(num) && num >= 0 && num <= question.maxMarks) {
          e.preventDefault();
          handleSelection(num, num.toString());
        }
      }
    }
  };

  // --- Renderers ---

  const renderBinaryChoice = () => {
    const isCorrect = currentScore === question.maxMarks;
    const isIncorrect = currentScore === 0 && currentResponse !== undefined && currentResponse !== '';

    return (
      <div className="flex gap-4 h-14 w-full max-w-xs">
        <button
          tabIndex={-1} // Prevent tab stopping inside, container handles focus
          onClick={() => handleSelection(0, 'Incorrect')}
          className={`
            flex-1 rounded-lg border-2 flex items-center justify-center transition-all
            ${isIncorrect 
              ? 'bg-red-600 border-red-600 text-white shadow-inner' 
              : 'bg-white border-slate-200 text-slate-300 hover:border-red-300 hover:text-red-400'}
          `}
        >
          <X className="w-8 h-8" />
        </button>
        <button
          tabIndex={-1}
          onClick={() => handleSelection(question.maxMarks, 'Correct')}
          className={`
            flex-1 rounded-lg border-2 flex items-center justify-center transition-all
            ${isCorrect 
              ? 'bg-green-600 border-green-600 text-white shadow-inner' 
              : 'bg-white border-slate-200 text-slate-300 hover:border-green-300 hover:text-green-400'}
          `}
        >
          <Check className="w-8 h-8" />
        </button>
      </div>
    );
  };

  const renderNumericArray = () => {
    // If marks are small enough, show buttons [0] [1] [2]...
    if (question.maxMarks <= 5) {
      const buttons = [];
      for (let i = 0; i <= question.maxMarks; i++) {
        const isSelected = currentScore === i;
        buttons.push(
          <button
            key={i}
            tabIndex={-1}
            onClick={() => handleSelection(i, i.toString())}
            className={`
              w-12 h-14 rounded-lg font-bold text-xl border-2 transition-all flex items-center justify-center
              ${isSelected 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50'}
            `}
          >
            {i}
          </button>
        );
      }
      return <div className="flex gap-2">{buttons}</div>;
    }

    // Fallback for large marks
    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="number"
            value={currentScore ?? ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val <= question.maxMarks) {
                onCommit(val, val.toString()); // Note: Don't auto-advance on typing, parent handles Enter
              }
            }}
            className="w-32 pl-9 pr-3 py-3 text-lg font-bold text-center border-2 border-slate-200 rounded-lg focus:border-brand-500 outline-none"
            placeholder="-"
          />
        </div>
        <span className="text-slate-400 font-bold">/ {question.maxMarks}</span>
      </div>
    );
  };

  const renderMcqButtons = () => {
    return (
      <div className="flex gap-2">
        {['A', 'B', 'C', 'D'].map((opt) => {
          const isSelected = currentResponse === opt;
          return (
            <button
              key={opt}
              tabIndex={-1}
              onClick={() => {
                const isCorrect = question.correctAnswer && opt === question.correctAnswer;
                handleSelection(isCorrect ? question.maxMarks : 0, opt);
              }}
              className={`
                w-14 h-14 rounded-lg font-bold text-xl border-2 transition-all flex items-center justify-center
                ${isSelected 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'}
              `}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      ref={domRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-300 border border-transparent rounded-xl p-2 transition-all"
    >
      {/* 
         We render different inputs based on type. 
         The container DIV catches keyboard events.
      */}
      {(question.type === 'Spelling' || question.type === 'Matching') && renderBinaryChoice()}
      {(question.type === 'Marks' || question.type === 'Written') && renderNumericArray()}
      {question.type === 'MCQ' && renderMcqButtons()}
    </div>
  );
};