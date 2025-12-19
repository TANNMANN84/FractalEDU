import { RapidTest, RapidQuestion, RapidQuestionType } from '@/types';

export const parseLegacyTest = (jsonData: any): RapidTest => {
  // 1. Basic Validation
  if (!jsonData || typeof jsonData !== 'object') {
    throw new Error("Invalid JSON data");
  }
  if (!jsonData.name) {
    throw new Error("Missing test name in file");
  }

  // 2. Map Year Group (Handle number vs string)
  const yearGroup = jsonData.yearGroup !== undefined ? String(jsonData.yearGroup) : "";

  // 3. Process Questions
  const questions: RapidQuestion[] = (jsonData.questions || []).map((q: any) => ({
    id: q.id || crypto.randomUUID(),
    prompt: q.prompt || "Untitled Question",
    type: isValidType(q.type) ? q.type : 'Marks',
    maxMarks: Number(q.maxMarks) || 1,
    correctAnswer: q.correctAnswer, // Optional
    options: Array.isArray(q.options) ? q.options : undefined // Optional
  }));

  // 4. Construct Result
  return {
    id: jsonData.id || crypto.randomUUID(),
    name: jsonData.name,
    tags: Array.isArray(jsonData.tags) ? jsonData.tags : [],
    yearGroup,
    questions,
    dateCreated: jsonData.dateCreated || new Date().toISOString()
  };
};

// Helper to validate types
const isValidType = (type: string): type is RapidQuestionType => {
  return ['Spelling', 'MCQ', 'Matching', 'Written', 'Marks'].includes(type);
};