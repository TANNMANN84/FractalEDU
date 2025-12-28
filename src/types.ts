import { ReactNode } from "react";

export type UUID = string;

// --- Enums ---
export enum Cohort {
  YEAR_7 = 'Year 7',
  YEAR_8 = 'Year 8',
  YEAR_9 = 'Year 9',
  YEAR_10 = 'Year 10',
  YEAR_11 = 'Year 11',
  YEAR_12 = 'Year 12',
}

export enum WellbeingStatus {
  GREEN = 'green',
  AMBER = 'amber',
  RED = 'red',
}

// Support Level (PRESERVED)
export enum SupportLevel {
  NONE = 'none',
  QDTP = 'QDTP',
  SUPPLEMENTARY = 'Supplementary',
  SUBSTANTIAL = 'Substantial',
  EXTENSIVE = 'Extensive',
}

// --- NCCD & Adjustments ---
export type NCCDLevel = 'QDTP' | 'Supplementary' | 'Substantial' | 'Extensive';
export type NCCDCategory = 'Physical' | 'Cognitive' | 'Social/Emotional' | 'Sensory';

export interface StudentNCCD {
  isNCCD: boolean;
  level: NCCDLevel;
  categories: NCCDCategory[];
  category?: NCCDCategory; // Deprecated, kept for legacy compatibility during migration
  impactStatement?: string;
  consultationDate?: string;
  active: boolean;
}

export interface Adjustment {
  id: string;
  category: 'Quality Teaching' | 'Differentiation' | 'Modification' | 'Cultural' | 'HPGE';
  description: string;
  active: boolean;
}

export interface CustomFlag {
  id: string;
  label: string;
  color: string; // hex or tailwind class
}

export interface StudentProfile {
    medicalConditions?: string[];
    learningNeeds?: string[];
    strengths?: string[];
    sentralId?: string;
    attendanceRate?: number;
    gender?: string;
    dob?: string;
    isAtsi?: boolean;
    eald?: boolean;
    oohc?: boolean;
    
    hasSpecificLearningNeeds?: boolean;
    customFlags?: CustomFlag[];
    hpge?: {
        status: 'Potential' | 'High Potential' | 'Gifted' | 'Highly Gifted';
        domain: ('Intellectual' | 'Creative' | 'Social-Emotional' | 'Physical')[];
    };
    photoUrl?: string;
    email?: string;
}

// --- Domain Entities ---

export interface WellbeingData {
  status: WellbeingStatus;
  notes: string;
  lastUpdated: string;
}

export interface SupportData {
  level: SupportLevel | string;
  needs: string[]; 
  strategies: string[];
}

export interface FileUpload {
    incident: any;
    type: any; id: string; name: string; 
}

export interface EvidenceLogEntry {
  id: string;
  date: string;
  type: 'General' | 'Literacy' | 'Numeracy' | 'SeatingPlan' | 'Behaviour' | 'NCCD' | 'Wellbeing' | 'HPGE' | 'Learning Support' | 'Cultural';
  content: string;
  author: string;
  tags?: string[];
  adjustments?: string[];
  file?: FileUpload;
}

export interface PlanDetail {
    active: boolean;
    notes?: string;
    file?: FileUpload | null;
}

export interface StudentPlans {
    behaviour: PlanDetail;
    learning: PlanDetail;
    medical: PlanDetail;
}

export interface SemesterReport {
    year: number;
    semester: 1 | 2;
    grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'N/A';
    subjects?: { name: string; grade: string }[];
}

export interface ValidScienceData {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    strands: {
        knowing: 'High' | 'Medium' | 'Low';
        planning: 'High' | 'Medium' | 'Low';
        problemSolving: 'High' | 'Medium' | 'Low';
    };
}

export interface Student {
  id: UUID;
  name: string;
  cohort: Cohort;
  avatarUrl?: string; // Legacy
  wellbeing: WellbeingData;
  support: SupportData; 
  academicTarget?: number;
  status?: 'Active' | 'Archived';

  isAtsi?: boolean; 
  hasLearningPlan?: boolean;
  evidenceLog?: EvidenceLogEntry[];
  
  profile?: StudentProfile;
  nccd?: StudentNCCD;
  adjustments?: Adjustment[];

  // New Fields
  plans?: StudentPlans;
  behaviourHistory?: Record<number, {
      data: number;
      lst: number; positives: number; negatives: number 
}>;
  concerns?: Record<string, string>; // Key: concern name, Value: note

  naplan?: {
    year7?: { reading: string; writing: string; numeracy: string; grammar: string; };
    year9?: { reading: string; writing: string; numeracy: string; grammar: string; };
  };
  
  // Updated Academic Data
  academicData?: {
      validScience?: ValidScienceData;
      checkIn?: { reading: number; numeracy: number; year: number }[];
      reports?: SemesterReport[];
  };

  analysisResults?: { examResponses: Record<string, any> }; 
  diagnosticResults?: { rapidTestResults: Record<string, any> }; 
}

export interface ClassMemo {
  id: string;
  content: string;
  date: string;
}

export interface SeatingPlan {
  id: UUID;
  name: string;
  rows: number;
  columns: number;
  layout: {
    studentId: UUID;
    x: number;
    y: number;
  }[];
}

// --- Program & Digital Signatures ---
export interface Annotation {
  id: string;
  type: 'signature' | 'text' | 'drawing';
  page: number; // 1-based index
  x: number; // Percentage (0-100) relative to page width
  y: number; // Percentage (0-100) relative to page height
  scale?: number; // Scale factor, defaults to 1.0
  content?: string; // For text notes or evidence context
  timestamp: string;
  
  // Drawing specific
  path?: { x: number; y: number }[]; // Coordinates in percentages
  color?: string; // Hex code
  thickness?: number; // Line width
}

export interface ClassProgram {
  id: string;
  name: string;
  fileId: string; // Reference to storageService
  dateAdded: string;
  status: 'active' | 'finalized';
  annotations: Annotation[];
}

export interface ClassGroup {
  yearGroup: string;
  id: UUID;
  name: string;
  subject: string;
  yearLevel: string;
  teacherId: string;
  studentIds: UUID[];
  seatingPlans: SeatingPlan[];
  activeSeatingPlanId?: UUID;
  status?: 'Active' | 'Archived';
  memos?: ClassMemo[];
  programs?: ClassProgram[];
}

// --- Exam / Analytics Types ---

export interface Question {
  id: string;
  number: string; 
  maxMarks: number;
  type: 'MCQ' | 'Short' | 'Extended'; 
  correctAnswer?: string; 
  subQuestions: Question[]; 
  modules?: string[]; 
  contentAreas?: string[];
  outcomes?: string[];
  cognitiveVerbs?: string[];
  notes?: string;
}

export interface Exam {
  type: string;
  title: any;
  maxMarks: number;
  id: UUID;
  name: string;
  date: string;
  cohort?: string; 
  totalMarks: number;
  questions: Question[];
  syllabusId?: string; 
}

export interface Result {
  id: UUID;
  studentId: UUID;
  examId: UUID;
  scoreTotal: number;
  questionScores: Record<string, number>;
  questionResponses: Record<string, string>; 
}

// --- Rapid Test Types ---

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
  tags: string[]; 
  yearGroup: string; 
  questions: RapidQuestion[];
}

export interface RapidResult {
  studentId: string;
  testId: string;
  preTestScores: Record<string, number>; 
  postTestScores: Record<string, number>;
  preTestResponses?: Record<string, string>; 
  postTestResponses?: Record<string, string>;
}

// --- Monitoring Types ---

export type Term = '1' | '2' | '3' | '4';
export interface TermBased<T> { '1': T; '2': T; '3': T; '4': T; }
export interface WorkSampleScans { top: FileUpload | null; middle: FileUpload | null; low: FileUpload | null; }

export type ConcernCategory = 'Illness/Misadventure' | 'N-Warning' | 'Malpractice' | 'Other';
export interface ConcernEntry {
    name: any; 
    id: string; 
    file: FileUpload; 
    studentIds: string[]; 
    category?: ConcernCategory;
}

export interface AssessmentItem {
  id: string;
  name: string;
  files: { 
      notification?: FileUpload; 
      blankTask?: FileUpload; 
      rubric?: FileUpload; 
  };
  samples: { 
      high?: FileUpload; 
      mid?: FileUpload; 
      low?: FileUpload; 
  };
}

export interface TermSignOff { teacherName: string; date: string; signatureImage?: string; }
export interface MonitoringDoc {
    behaviorNotes: string;
    academicNotes: string;
    id: string; classId: string; year: number; certifySyllabus: boolean; scopeAndSequence: FileUpload | null;
    teachingPrograms: TermBased<FileUpload[]>; semesterReports: TermBased<FileUpload | null>; assessmentSchedule: FileUpload | null;
    assessments?: TermBased<AssessmentItem[]>;
    /** @deprecated use assessments instead */
    assessmentTask1?: FileUpload[]; 
    /** @deprecated use assessments instead */
    assessmentTask2?: FileUpload[]; 
    /** @deprecated use assessments instead */
    assessmentTask3?: FileUpload[]; 
    prePostDiagnostic: FileUpload[];
    marksAndRanks: TermBased<FileUpload | null>; scannedWorkSamples: { task1: WorkSampleScans; task2: WorkSampleScans; task3: WorkSampleScans; };
    specificLearningNeeds: TermBased<boolean>; studentsCausingConcern: TermBased<ConcernEntry[]>; illnessMisadventure: TermBased<FileUpload[]>;
    malpractice: TermBased<FileUpload[]>; teacherSignOff: TermBased<TermSignOff | { teacherName: string; date: null; }>;
    headTeacherSignOff: TermBased<TermSignOff | { teacherName: string; date: null; }>;
}

export interface Teacher { 
    id?: string;
    title?: string;
    name: string; 
    email: string; 
    role?: string;
    faculty?: string;
    schoolName?: string;
    signature?: string; // Base64 signature image
}

export interface BackupFile { dataType: 'fullBackup'; appData: any; files: { [id: string]: string }; }
export interface StudentProfilerSnapshotEntry { studentId: string; name: string; hasWellbeingNotes: boolean; hasEvidenceLogs: boolean; hasWorkSamples: boolean; hasDifferentiation: boolean; naplan: { year7: any; year9: any; }; }

export interface ReviewPackage { 
  dataType: 'reviewPackage'; 
  classGroup: ClassGroup; 
  monitoringDoc: MonitoringDoc; 
  students: Student[]; 
  profilerSnapshot: StudentProfilerSnapshotEntry[]; 
  /** Embedded files record: [fileId]: Base64Content */
  files: Record<string, string>; 
}

export interface StudentTransferPackage { dataType: 'studentTransfer'; student: Student; files: { [id: string]: string }; }
export interface ClassTransferPackage { dataType: 'classTransfer'; classGroup: ClassGroup; students: Student[]; monitoringDoc: MonitoringDoc | null; files: { [id: string]: string }; }

// --- Timetable Structure ---
export type PeriodType = 'Teaching' | 'Break' | 'Admin' | 'Sport' | 'RollCall';

export interface TimeSlot {
    id: string;
    name: string;
    type: PeriodType;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    duration: number;  // minutes
    classId?: string;
    room?: string;
    label?: string; // For duties or custom notes
}

export interface DaySchedule {
    id: string;
    day: string; // "Monday", "Tuesday", etc.
    week: 'A' | 'B' | null; // null if weekly
    slots: TimeSlot[];
}

export interface SchoolStructure {
    cycle: 'Weekly' | 'Fortnightly';
    termStartDate?: string; // ISO Date string (YYYY-MM-DD) representing the Monday of Week A
    termDurationWeeks?: number;
    isTimetableLocked?: boolean;
    days: DaySchedule[];
}

export interface DaybookEntry {
    id: string;
    date: string; // YYYY-MM-DD
    slotId: string;
    content: string;
}