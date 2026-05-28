import { IAssignment, IQuestionPaper, ISection, IQuestion, QuestionType, Difficulty } from '../models/Assignment';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SECTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

function getDifficultyLabel(d: Difficulty): string {
  return d === 'easy' ? 'Easy' : d === 'medium' ? 'Moderate' : 'Challenging';
}

function getTypeLabel(t: QuestionType): string {
  const map: Record<QuestionType, string> = {
    mcq: 'Multiple Choice Questions',
    short: 'Short Answer Questions',
    long: 'Long Answer Questions',
    truefalse: 'True or False Questions',
  };
  return map[t];
}

function getTypeInstruction(t: QuestionType, marks: number): string {
  const map: Record<QuestionType, string> = {
    mcq: `Choose the correct answer. Each question carries ${marks} mark${marks > 1 ? 's' : ''}.`,
    short: `Attempt all questions. Each question carries ${marks} mark${marks > 1 ? 's' : ''}.`,
    long: `Answer in detail. Each question carries ${marks} mark${marks > 1 ? 's' : ''}.`,
    truefalse: `Write True or False. Each question carries ${marks} mark${marks > 1 ? 's' : ''}.`,
  };
  return map[t];
}

// ─── Mock Generator ────────────────────────────────────────────────────────────
function generateMockPaper(assignment: IAssignment): IQuestionPaper {
  const configs = assignment.questionConfigs;
  const subject = assignment.subject;
  const cls = assignment.class;
  const diff = assignment.difficulty;

  const mockQuestionBank: Record<string, string[]> = {
    short: [
      `Define the core concept of ${subject} as studied in Class ${cls}.`,
      `Explain the significance of ${subject} in everyday life.`,
      `What are the key principles of ${subject}? List any two.`,
      `Describe one real-world application of ${subject}.`,
      `How does ${subject} relate to other academic disciplines?`,
      `What is the historical background of ${subject}?`,
      `Differentiate between the primary and secondary aspects of ${subject}.`,
      `State any one law or theorem relevant to ${subject}.`,
      `Why is it important to study ${subject} at the school level?`,
      `Give an example that illustrates a fundamental concept in ${subject}.`,
    ],
    long: [
      `Discuss in detail the importance of ${subject} and its applications in modern times.`,
      `Explain the major theories associated with ${subject} with suitable examples.`,
      `Compare and contrast two major concepts in ${subject} that you have studied in Class ${cls}.`,
      `Describe the evolution and development of ${subject} over the past century.`,
      `Write an essay on how ${subject} impacts society and individual growth.`,
    ],
    mcq: [
      `Which of the following best defines ${subject}?`,
      `A key characteristic of ${subject} is:`,
      `Which of the following is NOT related to ${subject}?`,
      `The primary purpose of studying ${subject} is:`,
      `${subject} was first formally introduced by:`,
      `Which concept is central to ${subject}?`,
      `The most important tool used in ${subject} is:`,
      `An example of a practical application of ${subject} is:`,
      `In Class ${cls}, the main topics covered in ${subject} include:`,
      `Which of the following describes ${subject} correctly?`,
    ],
    truefalse: [
      `${subject} is considered one of the foundational subjects in education. (True/False)`,
      `The study of ${subject} began in the 21st century. (True/False)`,
      `${subject} has no real-world application. (True/False)`,
      `Students studying Class ${cls} are introduced to advanced concepts in ${subject}. (True/False)`,
      `${subject} can be studied independently of other subjects. (True/False)`,
    ],
  };

  const sections: ISection[] = configs.map((config, sectionIdx) => {
    const bank = mockQuestionBank[config.type] || mockQuestionBank['short'];
    const difficultyDistribution: Difficulty[] = [];
    if (diff === 'easy') {
      difficultyDistribution.push(...Array(config.count).fill('easy'));
    } else if (diff === 'hard') {
      difficultyDistribution.push(...Array(Math.ceil(config.count * 0.3)).fill('easy'));
      difficultyDistribution.push(...Array(Math.floor(config.count * 0.3)).fill('medium'));
      difficultyDistribution.push(...Array(config.count - Math.ceil(config.count * 0.3) - Math.floor(config.count * 0.3)).fill('hard'));
    } else {
      difficultyDistribution.push(...Array(Math.ceil(config.count * 0.4)).fill('easy'));
      difficultyDistribution.push(...Array(Math.floor(config.count * 0.4)).fill('medium'));
      difficultyDistribution.push(...Array(config.count - Math.ceil(config.count * 0.4) - Math.floor(config.count * 0.4)).fill('hard'));
    }

    const questions: IQuestion[] = Array.from({ length: config.count }, (_, i) => {
      const qDiff = difficultyDistribution[i] || diff;
      const baseQuestion = bank[i % bank.length];
      const options: string[] | undefined = config.type === 'mcq' ? [
        `Option A: The fundamental aspect of ${subject}`,
        `Option B: An unrelated concept`,
        `Option C: A secondary characteristic`,
        `Option D: None of the above`,
      ] : undefined;

      return {
        number: i + 1,
        text: `[${getDifficultyLabel(qDiff)}] ${baseQuestion} [${config.marks} Mark${config.marks > 1 ? 's' : ''}]`,
        difficulty: qDiff,
        marks: config.marks,
        type: config.type,
        ...(options && { options }),
      };
    });

    return {
      title: `Section ${SECTION_LABELS[sectionIdx % SECTION_LABELS.length]}`,
      instruction: getTypeInstruction(config.type, config.marks),
      questions,
    };
  });

  const totalMarks = configs.reduce((acc, c) => acc + c.count * c.marks, 0);
  const totalQuestions = configs.reduce((acc, c) => acc + c.count, 0);
  const timePerQuestion = 3;
  const totalTime = totalQuestions * timePerQuestion;

  return {
    school: assignment.school || 'VedaAI School',
    subject: assignment.subject,
    class: assignment.class,
    timeAllowed: (assignment as any).timeDuration || `${totalTime} minutes`,
    maxMarks: totalMarks,
    sections,
  };
}

// ─── Gemini Generator ──────────────────────────────────────────────────────────
async function generateWithGemini(assignment: IAssignment): Promise<IQuestionPaper> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

  const configDescriptions = assignment.questionConfigs
    .map(c => `- ${c.count} ${getTypeLabel(c.type)} (${c.type}), each worth ${c.marks} mark(s)`)
    .join('\n');

  const prompt = `You are an expert teacher creating a question paper. Generate a structured question paper as a valid JSON object.

Assignment Details:
- Subject: ${assignment.subject}
- Class: ${assignment.class}
- School: ${assignment.school}
- Overall Difficulty: ${assignment.difficulty}
- Required Question Configuration:
${configDescriptions}
- Time Duration: ${(assignment as any).timeDuration || 'Calculate automatically based on questions'}
- Additional Instructions: ${assignment.instructions || 'None'}
${assignment.extractedText ? `- Reference Material: ${assignment.extractedText.substring(0, 2000)}` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "school": "school name",
  "subject": "subject name",
  "class": "class",
  "timeAllowed": "X minutes",
  "maxMarks": number,
  "sections": [
    {
      "title": "Section A",
      "instruction": "instruction text",
      "questions": [
        {
          "number": 1,
          "text": "question text",
          "difficulty": "easy|medium|hard",
          "marks": number,
          "type": "mcq|short|long|truefalse",
          "options": ["A. option1", "B. option2", "C. option3", "D. option4"]
        }
      ]
    }
  ]
}

Create one section per question type as specified in the configuration. Include exactly the requested number of questions and marks for each type. Mix difficulties based on the overall difficulty setting (${assignment.difficulty}).`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code blocks if present
  const jsonText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

  const parsed = JSON.parse(jsonText) as IQuestionPaper;
  return parsed;
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export async function generateQuestionPaper(assignment: IAssignment): Promise<IQuestionPaper> {
  const useMock = process.env.USE_MOCK_LLM === 'true';

  let paper: IQuestionPaper;
  if (useMock) {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000));
    paper = generateMockPaper(assignment);
  } else {
    try {
      paper = await generateWithGemini(assignment);
    } catch (err) {
      console.warn('⚠️  Gemini failed, falling back to mock generator:', err);
      paper = generateMockPaper(assignment);
    }
  }

  // Always force the user's explicit time duration if they provided one
  if (assignment.timeDuration) {
    paper.timeAllowed = assignment.timeDuration;
  }

  return paper;
}
