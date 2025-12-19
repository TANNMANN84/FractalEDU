import { Exam, Result, Question } from '@/types';
import { getLeafQuestions } from './helpers';

export interface AnalysisStats {
    mean: number;
    median: number;
    max: number;
    min: number;
    stdDev: number;
    count: number;
}

export interface TagPerformance {
    name: string;
    score: number;
    max: number;
    pct: number;
}

export interface QuestionPerformance {
    id: string;
    number: string;
    avg: number;
    max: number;
    pct: number;
    type: string;
    prompt?: string;
}

export interface DistractorAnalysis {
    [questionId: string]: { [option: string]: number };
}

export interface ScoreDistribution {
    [questionId: string]: { [score: string]: number };
}

export interface BandData {
    name: string;
    count: number;
    fill: string;
    range: string;
}

export interface ExamAnalysis {
    stats: AnalysisStats;
    byQuestion: QuestionPerformance[];
    byVerb: TagPerformance[];
    byModule: TagPerformance[];
    byContentArea: TagPerformance[];
    byOutcome: TagPerformance[];
    distractors: DistractorAnalysis;
    scoreDistributions: ScoreDistribution;
    bands: BandData[];
    problemQuestions: QuestionPerformance[];
}

const calculateStats = (scores: number[], totalMarks: number): AnalysisStats => {
    if (scores.length === 0) return { mean: 0, median: 0, max: 0, min: 0, stdDev: 0, count: 0 };
    
    scores.sort((a, b) => a - b);
    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = sum / scores.length;
    
    const mid = Math.floor(scores.length / 2);
    const median = scores.length % 2 !== 0 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;
    
    const max = scores[scores.length - 1];
    const min = scores[0];
    
    const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return { mean, median, max, min, stdDev, count: scores.length };
};

export const analyzePerformance = (exam: Exam, results: Result[]): ExamAnalysis => {
    const flatQuestions = getLeafQuestions(exam.questions);
    const studentScores = results.map(r => r.scoreTotal);
    
    // 1. General Stats
    const stats = calculateStats(studentScores, exam.totalMarks);

    // Initialize accumulators
    const questionStats: Record<string, { sum: number, count: number }> = {};
    const tagStats: Record<string, { [key: string]: { sum: number, max: number } }> = {
        verb: {},
        module: {},
        area: {},
        outcome: {}
    };
    const distractors: DistractorAnalysis = {};
    const scoreDistributions: ScoreDistribution = {};
    
    // Band Buckets
    const bands = {
        'Band 6': 0, 'Band 5': 0, 'Band 4': 0, 'Band 3': 0, 'Band 2': 0, 'Band 1': 0
    };

    // Helper to init tag stats
    const updateTagStat = (type: 'verb' | 'module' | 'area' | 'outcome', tags: string[] | undefined, score: number, max: number) => {
        if (!tags) return;
        tags.forEach(tag => {
            if (!tagStats[type][tag]) tagStats[type][tag] = { sum: 0, max: 0 };
            tagStats[type][tag].sum += score;
            tagStats[type][tag].max += max;
        });
    };

    // Initialize Question Stats Containers
    flatQuestions.forEach(q => {
        questionStats[q.id] = { sum: 0, count: 0 };
        scoreDistributions[q.id] = {};
        if (q.type === 'MCQ') {
            distractors[q.id] = {};
        }
    });

    // Process Results
    results.forEach(result => {
        // Band Calculation
        const pct = exam.totalMarks > 0 ? (result.scoreTotal / exam.totalMarks) * 100 : 0;
        if (pct >= 90) bands['Band 6']++;
        else if (pct >= 80) bands['Band 5']++;
        else if (pct >= 70) bands['Band 4']++;
        else if (pct >= 60) bands['Band 3']++;
        else if (pct >= 50) bands['Band 2']++;
        else bands['Band 1']++;

        flatQuestions.forEach(q => {
            const score = result.questionScores[q.id];
            const response = result.questionResponses[q.id];

            if (score !== undefined && !isNaN(score)) {
                // Question Analysis
                questionStats[q.id].sum += score;
                questionStats[q.id].count += 1;

                // Tag Analysis
                updateTagStat('verb', q.cognitiveVerbs, score, q.maxMarks);
                updateTagStat('module', q.modules, score, q.maxMarks);
                updateTagStat('area', q.contentAreas, score, q.maxMarks);
                updateTagStat('outcome', q.outcomes, score, q.maxMarks);

                // Score Distribution
                const sKey = score.toString();
                if (!scoreDistributions[q.id][sKey]) scoreDistributions[q.id][sKey] = 0;
                scoreDistributions[q.id][sKey]++;
            }

            // Distractor Analysis (MCQ)
            if (q.type === 'MCQ' && response) {
                const opt = response.toUpperCase();
                if (!distractors[q.id][opt]) distractors[q.id][opt] = 0;
                distractors[q.id][opt]++;
            }
        });
    });

    // Format Outputs
    const byQuestion = flatQuestions.map(q => {
        const { sum, count } = questionStats[q.id];
        const avg = count > 0 ? sum / count : 0;
        return {
            id: q.id,
            number: q.number,
            prompt: q.notes, // Use notes as prompt snippet
            avg,
            max: q.maxMarks,
            pct: q.maxMarks > 0 ? (avg / q.maxMarks) * 100 : 0,
            type: q.type
        };
    });

    const formatTagOutput = (type: 'verb' | 'module' | 'area' | 'outcome'): TagPerformance[] => {
        return Object.entries(tagStats[type]).map(([name, data]) => ({
            name,
            score: data.sum,
            max: data.max,
            pct: data.max > 0 ? (data.sum / data.max) * 100 : 0
        })).sort((a, b) => b.pct - a.pct);
    };

    const bandData: BandData[] = [
        { name: 'Band 1', range: '<50%', count: bands['Band 1'], fill: '#ef4444' },
        { name: 'Band 2', range: '50-59%', count: bands['Band 2'], fill: '#f97316' },
        { name: 'Band 3', range: '60-69%', count: bands['Band 3'], fill: '#eab308' },
        { name: 'Band 4', range: '70-79%', count: bands['Band 4'], fill: '#84cc16' },
        { name: 'Band 5', range: '80-89%', count: bands['Band 5'], fill: '#22c55e' },
        { name: 'Band 6', range: '90%+', count: bands['Band 6'], fill: '#15803d' },
    ];

    const problemQuestions = [...byQuestion].sort((a, b) => a.pct - b.pct).slice(0, 3);

    return {
        stats,
        byQuestion,
        byVerb: formatTagOutput('verb'),
        byModule: formatTagOutput('module'),
        byContentArea: formatTagOutput('area'),
        byOutcome: formatTagOutput('outcome'),
        bands: bandData,
        problemQuestions,
        distractors,
        scoreDistributions
    };
};