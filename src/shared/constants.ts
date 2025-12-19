import { MonitoringDoc } from '@/types';

export const BLANK_MONITORING_DOC_SKELETON: Omit<MonitoringDoc, 'id' | 'classId'> = {
    year: new Date().getFullYear(),
    certifySyllabus: false,
    scopeAndSequence: null,
    teachingPrograms: { '1': [], '2': [], '3': [], '4': [] },
    semesterReports: { '1': null, '2': null, '3': null, '4': null },
    assessmentSchedule: null,
    assessmentTask1: [],
    assessmentTask2: [],
    assessmentTask3: [],
    prePostDiagnostic: [],
    marksAndRanks: { '1': null, '2': null, '3': null, '4': null },
    scannedWorkSamples: {
        task1: { top: null, middle: null, low: null },
        task2: { top: null, middle: null, low: null },
        task3: { top: null, middle: null, low: null },
    },
    specificLearningNeeds: { '1': false, '2': false, '3': false, '4': false },
    studentsCausingConcern: { '1': [], '2': [], '3': [], '4': [] },
    illnessMisadventure: { '1': [], '2': [], '3': [], '4': [] },
    malpractice: { '1': [], '2': [], '3': [], '4': [] },
    teacherSignOff: { 
        '1': { teacherName: '', date: null }, 
        '2': { teacherName: '', date: null }, 
        '3': { teacherName: '', date: null }, 
        '4': { teacherName: '', date: null } 
    },
    headTeacherSignOff: { 
        '1': { teacherName: '', date: null }, 
        '2': { teacherName: '', date: null }, 
        '3': { teacherName: '', date: null }, 
        '4': { teacherName: '', date: null } 
    },
};