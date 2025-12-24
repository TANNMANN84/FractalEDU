import { Exam, Question, Result, Student, Cohort, WellbeingStatus, SupportLevel } from '@/types';

export const parseLegacyData = (json: any): { exam: Exam, students: Student[], results: Result[], mode: 'template' | 'analysis' } => {
    // 1. Identify Mode
    let mode: 'template' | 'analysis' = 'template';
    
    // Check for explicit mode or presence of results/students
    if (json.mode === 'analysis') mode = 'analysis';
    else if (json.results && Array.isArray(json.results) && json.results.length > 0) mode = 'analysis';
    else if (json.students && Array.isArray(json.students) && json.students.some((s: any) => s.responses || s.marks)) mode = 'analysis';

    // 2. Parse Exam/Questions
    const rawExam = json.exam || json;
    const examId = rawExam.id || crypto.randomUUID();
    const questions: Question[] = (rawExam.questions || []).map((q: any) => mapLegacyQuestion(q));
    
    // Recalculate total marks if missing or stale
    const calculatedTotal = questions.reduce((sum, q) => sum + (getQuestionTotal(q)), 0);

    const exam: Exam = {
        id: examId,
        name: rawExam.name || 'Imported Exam',
        date: rawExam.date || new Date().toISOString(),
        cohort: rawExam.cohort || '12',
        totalMarks: rawExam.totalMarks || calculatedTotal,
        questions: questions,
        syllabusId: rawExam.syllabusId || 'chemistry',
        title: undefined,
        maxMarks: 0
    };

    // 3. Parse Students & Results (for Analysis mode)
    const students: Student[] = [];
    const results: Result[] = [];

    if (mode === 'analysis') {
        // Strategy A: V2 Export (Structure: { exam, results, generatedAt, version })
        if (json.version === "2.0" && json.results) {
            (json.results as Result[]).forEach(r => {
                results.push(r);
                // If students not in file, create placeholders so charts work
                if (!students.find(s => s.id === r.studentId)) {
                    students.push(createPlaceholderStudent(r.studentId, `Student ${r.studentId.substring(0,4)}`));
                }
            });
            // If V2 has explicit students array, use it
            if (json.students && Array.isArray(json.students)) {
                json.students.forEach((s: Student) => {
                    if (!students.find(existing => existing.id === s.id)) {
                        students.push(s);
                    }
                });
            }
        } 
        // Strategy B: Legacy Export (Structure: { exam, students: [{ id, name, responses: {...} }] })
        else if (json.students && Array.isArray(json.students)) {
            json.students.forEach((s: any) => {
                const sId = s.id || crypto.randomUUID();
                const studentName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown Student';
                
                const student = createPlaceholderStudent(sId, studentName);
                students.push(student);

                // Normalize results
                const scores: Record<string, number> = {};
                const responses: Record<string, string> = {};
                
                // Map legacy responses
                const sourceData = s.responses || s.marks || {};
                const flatQuestions = getAllQuestions(questions);
                
                Object.entries(sourceData).forEach(([key, val]: [string, any]) => {
                    // Try to find matching question by ID, then by Number
                    const q = flatQuestions.find(fq => fq.id === key) || flatQuestions.find(fq => fq.number === key);
                    
                    if (q) {
                        if (typeof val === 'object' && val !== null) {
                            scores[q.id] = Number(val.score ?? val.mark ?? 0);
                            responses[q.id] = String(val.value ?? val.response ?? '');
                        } else {
                            scores[q.id] = Number(val);
                        }
                    }
                });

                results.push({
                    id: crypto.randomUUID(),
                    examId: exam.id,
                    studentId: sId,
                    scoreTotal: Object.values(scores).reduce((a,b) => a+b, 0),
                    questionScores: scores,
                    questionResponses: responses
                });
            });
        }
    }

    return { exam, students, results, mode };
};

// --- Helpers ---

const mapLegacyQuestion = (q: any): Question => {
    // Map legacy types to new enum
    let type: 'MCQ' | 'Short' | 'Extended' = 'Short';
    if (q.type) {
        const lower = q.type.toLowerCase();
        if (lower.includes('mcq') || lower.includes('multiple')) type = 'MCQ';
        else if (lower.includes('extended') || lower.includes('long')) type = 'Extended';
        else if (lower.includes('mark')) type = 'Short';
    }

    // Helper to ensure array
    const toArray = (val: any) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string' && val.trim().length > 0) return [val];
        return [];
    };

    return {
        id: q.id || crypto.randomUUID(),
        number: q.number || q.label || '?',
        maxMarks: Number(q.maxMarks || q.marks || 1),
        type,
        correctAnswer: q.correctAnswer,
        notes: q.notes,
        subQuestions: (q.subQuestions || []).map(mapLegacyQuestion),
        
        // Critical: Map singular legacy keys to plural new keys
        modules: toArray(q.modules || q.module),
        contentAreas: toArray(q.contentAreas || q.contentArea),
        outcomes: toArray(q.outcomes || q.outcome),
        cognitiveVerbs: toArray(q.cognitiveVerbs || q.verbs || q.cognitiveVerb)
    };
};

const getQuestionTotal = (q: Question): number => {
    if (q.subQuestions && q.subQuestions.length > 0) {
        return q.subQuestions.reduce((sum, sq) => sum + getQuestionTotal(sq), 0);
    }
    return q.maxMarks;
};

const getAllQuestions = (qs: Question[]): Question[] => {
    let acc: Question[] = [];
    qs.forEach(q => {
        acc.push(q);
        if (q.subQuestions) acc = acc.concat(getAllQuestions(q.subQuestions));
    });
    return acc;
};

const createPlaceholderStudent = (id: string, name: string): Student => ({
    id,
    name,
    cohort: Cohort.YEAR_12,
    wellbeing: { status: WellbeingStatus.GREEN, notes: '', lastUpdated: new Date().toISOString() },
    support: { level: SupportLevel.NONE, needs: [], strategies: [] }
});