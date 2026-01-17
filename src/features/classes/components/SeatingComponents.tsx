
import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Student } from '@/types';

// --- Draggable Student Card ---
interface DraggableStudentProps {
  student: Student;
  id: string; // Unique ID for dnd-kit
  isOverlay?: boolean;
  showGender?: boolean;
}

export const DraggableStudent: React.FC<DraggableStudentProps> = ({ student, id, isOverlay, showGender }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { studentId: student.id, type: 'student' },
  });

  const style: React.CSSProperties | undefined = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  const baseClasses = "p-1 rounded-lg border shadow-sm text-xs font-bold cursor-grab active:cursor-grabbing select-none transition-all w-full flex flex-col items-center justify-center text-center h-full overflow-hidden";
  
  // Logic for Background Color
  let bgClass = "bg-white dark:bg-slate-800 hover:border-brand-300 dark:hover:border-brand-500 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700";
  
  if (showGender && student.profile?.gender) {
      const g = student.profile.gender.toLowerCase();
      if (g === 'male') bgClass = "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";
      else if (g === 'female') bgClass = "bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-100";
      else bgClass = "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100";
  } else {
      // Default Risk/Status coloring if Gender is off
      if (student.wellbeing.status === 'red') bgClass = "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100";
      else if (student.support.level !== 'none') bgClass = "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100";
      else if (student.isAtsi) bgClass = "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100";
  }

  if (isOverlay) {
      bgClass += " shadow-xl scale-105 rotate-2 ring-2 ring-brand-400 opacity-90";
  }
  
  if (isDragging && !isOverlay) {
      return <div ref={setNodeRef} className="opacity-30 w-full h-full bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600" />;
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`${baseClasses} ${bgClass}`}
    >
      <div className="w-full px-1 whitespace-normal break-words leading-tight">{student.name}</div>
      <div className="flex gap-1 mt-1 justify-center shrink-0">
        {student.support.level !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Learning Support" />}
        {student.wellbeing.status !== 'green' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Wellbeing Concern" />}
      </div>
    </div>
  );
};

// --- Droppable Desk Cell ---
interface DeskCellProps {
  row: number;
  col: number;
  student?: Student | null;
  showGender?: boolean;
}

export const DeskCell: React.FC<DeskCellProps> = ({ row, col, student, showGender }) => {
  const deskId = `seat-${row}-${col}`;
  const { isOver, setNodeRef } = useDroppable({
    id: deskId,
    data: { row, col, type: 'seat' }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        w-28 h-20 rounded-xl border-2 transition-all flex items-center justify-center p-1
        ${isOver ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-200 dark:ring-brand-800' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}
        ${!student && !isOver ? 'border-dashed' : 'border-solid shadow-sm'}
      `}
    >
      {student ? (
        <DraggableStudent 
          student={student} 
          id={`seated-${student.id}`} 
          showGender={showGender}
        />
      ) : (
        <span className="text-slate-300 dark:text-slate-600 text-[10px] font-medium pointer-events-none uppercase tracking-wide">Empty</span>
      )}
    </div>
  );
};
