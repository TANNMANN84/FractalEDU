import { RapidTest, RapidResult, Student } from '@/types';

export interface StudentGrowthStats {
  id: string;
  name: string;
  pre: number;
  post: number;
  growth: number;
  hasPre: boolean;
  hasPost: boolean;
}

export interface QuestionGrowthStats {
  id: string;
  prompt: string;
  preAvg: number; // Percentage 0-100
  postAvg: number; // Percentage 0-100
  diff: number;
}

export interface ClassGrowthSummary {
  classAvgPre: number;
  classAvgPost: number;
  avgGrowth: number;
  maxScore: number;
  studentStats: StudentGrowthStats[];
  questionStats: QuestionGrowthStats[];
}

export const calculateGrowthStats = (
  test: RapidTest,
  results: RapidResult[],
  students: Student[]
): ClassGrowthSummary => {
  const relevantResults = results.filter(r => r.testId === test.id);
  const maxScore = test.questions.reduce((sum, q) => sum + q.maxMarks, 0);

  // 1. Calculate Student Stats
  const studentStats = relevantResults.map(r => {
    const student = students.find(s => s.id === r.studentId);
    
    // Sum scores, treating undefined/null as 0
    // Explicitly cast to number[] to handle potential type inference issues with Object.values on partial/empty objects
    const preValues = Object.values(r.preTestScores || {}) as number[];
    const postValues = Object.values(r.postTestScores || {}) as number[];

    const preTotal = preValues.reduce((a, b) => a + (b || 0), 0);
    const postTotal = postValues.reduce((a, b) => a + (b || 0), 0);

    const hasPre = Object.keys(r.preTestScores || {}).length > 0;
    const hasPost = Object.keys(r.postTestScores || {}).length > 0;

    return {
      id: r.studentId,
      name: student ? student.name : 'Unknown Student',
      pre: preTotal,
      post: postTotal,
      growth: postTotal - preTotal,
      hasPre,
      hasPost
    };
  }).filter(s => s.hasPre || s.hasPost); // Only include if they have at least one data point

  // 2. Class Averages (Only counting those who took the specific test version)
  const validPre = studentStats.filter(s => s.hasPre);
  const validPost = studentStats.filter(s => s.hasPost);

  const classAvgPre = validPre.length > 0 
    ? validPre.reduce((sum, s) => sum + s.pre, 0) / validPre.length 
    : 0;
    
  const classAvgPost = validPost.length > 0 
    ? validPost.reduce((sum, s) => sum + s.post, 0) / validPost.length 
    : 0;

  // 3. Question Analysis
  const questionStats = test.questions.map(q => {
    let preSum = 0;
    let postSum = 0;
    let preCount = 0;
    let postCount = 0;

    relevantResults.forEach(r => {
      const preScore = r.preTestScores?.[q.id];
      const postScore = r.postTestScores?.[q.id];

      if (preScore !== undefined) {
        preSum += preScore;
        preCount++;
      }
      if (postScore !== undefined) {
        postSum += postScore;
        postCount++;
      }
    });

    // Avoid division by zero
    const preAvg = (preCount > 0 && q.maxMarks > 0) ? (preSum / (preCount * q.maxMarks)) * 100 : 0;
    const postAvg = (postCount > 0 && q.maxMarks > 0) ? (postSum / (postCount * q.maxMarks)) * 100 : 0;

    return {
      id: q.id,
      prompt: q.prompt,
      preAvg,
      postAvg,
      diff: postAvg - preAvg
    };
  });

  return {
    classAvgPre,
    classAvgPost,
    avgGrowth: classAvgPost - classAvgPre,
    maxScore,
    studentStats,
    questionStats
  };
};