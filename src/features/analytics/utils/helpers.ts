
import { Question } from '@/types';

export const toRomanNumeral = (num: number): string => {
  const roman: { [key: string]: number } = {
    m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1
  };
  let str = '';
  for (const i of Object.keys(roman)) {
    const q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    str += i.repeat(q);
  }
  return str;
};

export const createQuestionObject = (number: string): Question => {
  return {
    id: crypto.randomUUID(),
    number,
    maxMarks: 1,
    type: 'Short', // Default to Short answer
    notes: '',
    subQuestions: [],
    modules: [],
    contentAreas: [],
    outcomes: [],
    cognitiveVerbs: [],
  };
};

export const getLeafQuestions = (questions: Question[]): Question[] => {
    let leaves: Question[] = [];
    questions.forEach(q => {
        if (q.subQuestions && q.subQuestions.length > 0) {
            leaves = [...leaves, ...getLeafQuestions(q.subQuestions)];
        } else {
            leaves.push(q);
        }
    });
    return leaves;
};

export const getFlattedQuestions = (questions: Question[], prefix = ''): (Question & { fullLabel: string })[] => {
    let flat: (Question & { fullLabel: string })[] = [];
    questions.forEach(q => {
        const label = prefix ? `${prefix}(${q.number})` : q.number;
        
        // If it has subquestions, we generally only want the leaves for data entry,
        // but the recursive structure might have marks at the parent level in some systems.
        // For Fractal EDU, we assume marks are on leaves.
        if (q.subQuestions && q.subQuestions.length > 0) {
            flat = [...flat, ...getFlattedQuestions(q.subQuestions, q.number)];
        } else {
            flat.push({ ...q, fullLabel: label });
        }
    });
    return flat;
};

export const calculateTotalMarks = (questions: Question[]): number => {
    return getLeafQuestions(questions).reduce((sum, q) => sum + Number(q.maxMarks), 0);
};

// --- Tree Helpers ---

export const findQuestionInTree = (questions: Question[], id: string): Question | null => {
    for (const q of questions) {
        if (q.id === id) return q;
        if (q.subQuestions.length > 0) {
            const found = findQuestionInTree(q.subQuestions, id);
            if (found) return found;
        }
    }
    return null;
};

export const updateQuestionInTree = (questions: Question[], updatedQ: Question): Question[] => {
    return questions.map(q => {
        if (q.id === updatedQ.id) return updatedQ;
        if (q.subQuestions.length > 0) {
             return { ...q, subQuestions: updateQuestionInTree(q.subQuestions, updatedQ) };
        }
        return q;
    });
};

export const deleteQuestionFromTree = (questions: Question[], id: string): Question[] => {
    return questions.reduce((acc, q) => {
        if (q.id === id) {
            // Skip this question (delete)
            return acc;
        }
        
        // Check children
        const newSubQuestions = deleteQuestionFromTree(q.subQuestions || [], id);
        
        // Return new object with updated children
        acc.push({
            ...q,
            subQuestions: newSubQuestions
        });
        
        return acc;
    }, [] as Question[]);
};

export const addQuestionToParent = (questions: Question[], parentId: string, newQ: Question): Question[] => {
    return questions.map(q => {
        if (q.id === parentId) {
            return { ...q, subQuestions: [...q.subQuestions, newQ] };
        }
        if (q.subQuestions.length > 0) {
            return { ...q, subQuestions: addQuestionToParent(q.subQuestions, parentId, newQ) };
        }
        return q;
    });
};

export const getNextNumber = (lastNumber: string): string => {
    if (!lastNumber) return "1";
    
    const num = parseInt(lastNumber);
    if (!isNaN(num)) return (num + 1).toString();
    
    const lower = lastNumber.toLowerCase();
    
    // Roman numeral rough check (1-10)
    const romanMap: any = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };
    if (romanMap[lower]) {
        const nextVal = romanMap[lower] + 1;
        const reverseMap: any = { 1:'i', 2:'ii', 3:'iii', 4:'iv', 5:'v', 6:'vi', 7:'vii', 8:'viii', 9:'ix', 10:'x', 11:'xi', 12:'xii' };
        return reverseMap[nextVal] || '';
    }

    // Alpha check
    if (/^[a-z]$/.test(lower)) {
        return String.fromCharCode(lastNumber.charCodeAt(0) + 1);
    }
    if (/^[A-Z]$/.test(lastNumber)) {
         return String.fromCharCode(lastNumber.charCodeAt(0) + 1);
    }

    return '';
};
