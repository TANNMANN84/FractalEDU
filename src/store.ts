
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Student, 
  ClassGroup, 
  Exam, 
  Result, 
  EvidenceLogEntry,
  RapidTest,
  RapidResult,
  MonitoringDoc,
  Teacher,
  ClassProgram,
  Annotation
} from './types';

export interface ToastMessage { 
  id: string; 
  message: string; 
  type: 'success' | 'error' | 'info'; 
}

interface AppState {
  teacherProfile: Teacher | null;
  students: Student[];
  classes: ClassGroup[];
  exams: Exam[];
  results: Result[];
  rapidTests: RapidTest[];
  rapidResults: RapidResult[];
  monitoringDocs: MonitoringDoc[];
  
  // UI State
  toasts: ToastMessage[];

  // Actions
  setTeacherProfile: (profile: Teacher) => void;

  addStudent: (student: Student) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  setStudents: (students: Student[]) => void;
  
  addClass: (classGroup: ClassGroup) => void;
  updateClass: (id: string, updates: Partial<ClassGroup>) => void;
  setClasses: (classes: ClassGroup[]) => void;
  
  // Program & Annotation Actions
  addClassProgram: (classId: string, program: ClassProgram) => void;
  updateProgramAnnotations: (classId: string, programId: string, annotation: Annotation) => void;
  finalizeProgram: (classId: string, programId: string) => void;

  addExam: (exam: Exam) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  setExams: (exams: Exam[]) => void;
  
  addResult: (result: Result) => void;
  setResults: (results: Result[]) => void;

  addEvidence: (studentId: string, log: EvidenceLogEntry) => void;
  
  // Rapid Test Actions
  addRapidTest: (test: RapidTest) => void;
  updateRapidTest: (id: string, updates: Partial<RapidTest>) => void;
  setRapidResult: (result: RapidResult) => void; // Upsert

  // Monitoring Actions
  addMonitoringDoc: (doc: MonitoringDoc) => void;
  updateMonitoringDoc: (id: string, updates: Partial<MonitoringDoc>) => void;

  // --- DELETE ACTIONS ---
  deleteStudent: (id: string) => void;
  deleteClass: (id: string) => void;
  deleteExam: (id: string) => void;
  deleteRapidTest: (id: string) => void;
  deleteMonitoringDoc: (id: string) => void;

  // --- TOAST ACTIONS ---
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  replaceAllData: (data: Partial<AppState>) => void;
  mergeData: (data: Partial<AppState>) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      teacherProfile: null,
      students: [],
      classes: [],
      exams: [],
      results: [],
      rapidTests: [],
      rapidResults: [],
      monitoringDocs: [],
      toasts: [],

      setTeacherProfile: (profile) => set({ teacherProfile: profile }),

      addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
      updateStudent: (id, updates) => set((state) => ({
        students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
      setStudents: (students) => set({ students }),

      addClass: (classGroup) => set((state) => ({ classes: [...state.classes, classGroup] })),
      updateClass: (id, updates) => set((state) => ({
        classes: state.classes.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),
      setClasses: (classes) => set({ classes }),

      // Program Actions
      addClassProgram: (classId, program) => set((state) => ({
        classes: state.classes.map(c => 
          c.id === classId 
            ? { ...c, programs: [...(c.programs || []), program] }
            : c
        )
      })),

      updateProgramAnnotations: (classId, programId, annotation) => set((state) => ({
        classes: state.classes.map(c => {
          if (c.id !== classId) return c;
          return {
            ...c,
            programs: (c.programs || []).map(p => 
              p.id === programId
                ? { ...p, annotations: [...p.annotations, annotation] }
                : p
            )
          };
        })
      })),

      finalizeProgram: (classId, programId) => set((state) => ({
        classes: state.classes.map(c => {
          if (c.id !== classId) return c;
          return {
            ...c,
            programs: (c.programs || []).map(p => 
              p.id === programId
                ? { ...p, status: 'finalized' }
                : p
            )
          };
        })
      })),

      addExam: (exam) => set((state) => ({ exams: [...state.exams, exam] })),
      updateExam: (id, updates) => set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      })),
      setExams: (exams) => set({ exams }),

      addResult: (result) => set((state) => {
        const index = state.results.findIndex(r => r.studentId === result.studentId && r.examId === result.examId);
        if (index !== -1) {
            const newResults = [...state.results];
            newResults[index] = result;
            return { results: newResults };
        }
        return { results: [...state.results, result] };
      }),
      setResults: (results) => set({ results }),

      addEvidence: (studentId, log) => set((state) => ({
        students: state.students.map(s => 
          s.id === studentId 
            ? { ...s, evidenceLog: [log, ...(s.evidenceLog || [])] }
            : s
        )
      })),

      addRapidTest: (test) => set((state) => ({ rapidTests: [...state.rapidTests, test] })),
      updateRapidTest: (id, updates) => set((state) => ({
        rapidTests: state.rapidTests.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      setRapidResult: (result) => set((state) => {
         const existingIndex = state.rapidResults.findIndex(r => r.studentId === result.studentId && r.testId === result.testId);
         if (existingIndex >= 0) {
             const newResults = [...state.rapidResults];
             newResults[existingIndex] = result;
             return { rapidResults: newResults };
         }
         return { rapidResults: [...state.rapidResults, result] };
      }),

      addMonitoringDoc: (doc) => set((state) => ({ monitoringDocs: [...state.monitoringDocs, doc] })),
      updateMonitoringDoc: (id, updates) => set((state) => ({
          monitoringDocs: state.monitoringDocs.map(doc => doc.id === id ? { ...doc, ...updates } : doc)
      })),

      // --- DELETE IMPLEMENTATION ---
      deleteStudent: (id) => set((state) => ({ 
          students: state.students.filter(s => s.id !== id),
          results: state.results.filter(r => r.studentId !== id),
          rapidResults: state.rapidResults.filter(r => r.studentId !== id)
      })),
      deleteClass: (id) => set((state) => ({ 
          classes: state.classes.filter(c => c.id !== id),
          monitoringDocs: state.monitoringDocs.filter(d => d.classId !== id)
      })),
      deleteExam: (id) => set((state) => ({ 
          exams: state.exams.filter(e => e.id !== id),
          results: state.results.filter(r => r.examId !== id)
      })),
      deleteRapidTest: (id) => set((state) => ({ 
          rapidTests: state.rapidTests.filter(t => t.id !== id),
          rapidResults: state.rapidResults.filter(r => r.testId !== id)
      })),
      deleteMonitoringDoc: (id) => set((state) => ({ 
          monitoringDocs: state.monitoringDocs.filter(d => d.id !== id) 
      })),

      // --- TOAST IMPLEMENTATION ---
      addToast: (message, type = 'success') => set((state) => ({ 
          toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }] 
      })),
      removeToast: (id) => set((state) => ({ 
          toasts: state.toasts.filter(t => t.id !== id) 
      })),

      replaceAllData: (data) => set((state) => ({
        teacherProfile: data.teacherProfile || state.teacherProfile,
        students: data.students || [],
        classes: data.classes || [],
        exams: data.exams || [],
        results: data.results || [],
        rapidTests: data.rapidTests || [],
        rapidResults: data.rapidResults || [],
        monitoringDocs: data.monitoringDocs || [],
      })),

      mergeData: (data) => set((state) => ({
        students: [...state.students, ...(data.students || []).filter(n => !state.students.find(e => e.id === n.id))],
        classes: [...state.classes, ...(data.classes || []).filter(n => !state.classes.find(e => e.id === n.id))],
        exams: [...state.exams, ...(data.exams || []).filter(n => !state.exams.find(e => e.id === n.id))],
        results: [...state.results, ...(data.results || []).filter(n => !state.results.find(e => e.id === n.id))],
        rapidTests: [...state.rapidTests, ...(data.rapidTests || []).filter(n => !state.rapidTests.find(e => e.id === n.id))],
        rapidResults: [...state.rapidResults, ...(data.rapidResults || []).filter(n => !state.rapidResults.find(e => e.studentId === n.studentId && e.testId === n.testId))],
        monitoringDocs: [...state.monitoringDocs, ...(data.monitoringDocs || []).filter(n => !state.monitoringDocs.find(e => e.id === n.id))],
      })),

      reset: () => set({
        teacherProfile: null,
        students: [],
        classes: [],
        exams: [],
        results: [],
        rapidTests: [],
        rapidResults: [],
        monitoringDocs: [],
        toasts: []
      }),
    }),
    {
      name: 'fractal-edu-storage',
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
