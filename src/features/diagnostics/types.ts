export type UUID = string;

// --- Domain Enums ---
export enum Cohort {
  YEAR_7 = 'Year 7',
  YEAR_8 = 'Year 8',
  YEAR_9 = 'Year 9',
  YEAR_10 = 'Year 10',
  YEAR_11 = 'Year 11',
  YEAR_12 = 'Year 12',
}

export enum WellbeingStatus {
  GREEN = 'green', // All good
  AMBER = 'amber', // Watch list
  RED = 'red',     // Critical
}

export enum SupportLevel {
  NONE = 'none',
  SEN_K = 'SEN Support',
  EHCP = 'EHCP',
}

// --- Domain Entities ---

export interface WellbeingData {
  status: WellbeingStatus;
  notes: string;
  lastUpdated: string; // ISO Date
}

export interface SupportData {
  level: SupportLevel;
  needs: string[]; // e.g., ["Dyslexia", "ADHD"]
  strategies: string[];
}

export interface EvidenceLogEntry {
  id: string;
  date: string; // ISO date string
  type: 'General' | 'Literacy' | 'Numeracy' | 'SeatingPlan' | 'Behaviour';
  content: string;
  author: string;
}

export interface Student {
  id: UUID;
  name: string;
  cohort: Cohort;
  avatarUrl?: string;
  wellbeing: WellbeingData;
  support: SupportData;
  academicTarget?: number;

  // --- Profiler Fields ---
  isAtsi?: boolean;
  hasLearningPlan?: boolean;
  evidenceLog?: EvidenceLogEntry[];
  
  // Updated Naplan Structure
  naplan?: {
    year7?: {
      reading: string;
      writing: string;
      numeracy: string;
      grammar: string;
    };
    year9?: {
      reading: string;
      writing: string;
      numeracy: string;
      grammar: string;
    };
  };

  analysisResults?: { examResponses: Record<string, any> }; 
  diagnosticResults?: { rapidTestResults: Record<string, any> }; 
}

export interface SeatingPlan {
  id: UUID;
  name: string;
  rows: number;
  columns: number;
  layout: {
    studentId: UUID;
    x: number; // 0-indexed column
    y: number; // 0-indexed row
  }[];
}

export interface ClassGroup {
  id: UUID;
  name: string;
  subject: string;
  yearLevel: string; // e.g. "7", "8", "12"
  teacherId: string;
  studentIds: UUID[];
  seatingPlans: SeatingPlan[];
  activeSeatingPlanId?: UUID;
}

// --- Exam Analysis Types ---

export interface Question {
  id: string;
  number: string; // e.g., "1", "a", "i"
  maxMarks: number;
  type: 'MCQ' | 'Short' | 'Extended'; // Updated Types
  correctAnswer?: string; // For MCQ (e.g., 'A', 'B')
  
  subQuestions: Question[]; // Recursive structure, required array (empty if none)
  
  // Syllabus Mapping (Arrays)
  modules?: string[]; 
  contentAreas?: string[];
  outcomes?: string[];
  cognitiveVerbs?: string[];
  
  notes?: string;
}

export interface Exam {
  id: UUID;
  name: string;
  date: string;
  cohort?: string; // e.g. "12", "11"
  totalMarks: number;
  questions: Question[];
  syllabusId?: string; // e.g., 'chemistry', 'physics'
}

export interface Result {
  id: UUID;
  studentId: UUID;
  examId: UUID;
  scoreTotal: number;
  // Map question ID to score obtained
  questionScores: Record<string, number>;
  // Map question ID to the actual response string (e.g. 'A', 'B', 'Student Answer')
  questionResponses: Record<string, string>; 
}

// --- Diagnostics (Rapid Tests) ---

export type RapidQuestionType = 'Spelling' | 'MCQ' | 'Matching' | 'Written' | 'Marks';

export interface RapidQuestion {
  id: string;
  prompt: string;
  type: RapidQuestionType;
  maxMarks: number;
  correctAnswer?: string; // For Spelling/MCQ
  options?: string[]; // Only for MCQ
}

export interface RapidTest {
  id: string;
  name: string;
  dateCreated: string;
  tags: string[]; // e.g. ["Year 7", "Forces"]
  yearGroup: string; // e.g. "7"
  questions: RapidQuestion[];
}

export interface RapidResult {
  studentId: string;
  testId: string;
  preTestScores: Record<string, number>; // questionId -> mark
  postTestScores: Record<string, number>;
  preTestResponses?: Record<string, string>; // questionId -> text/option
  postTestResponses?: Record<string, string>;
}