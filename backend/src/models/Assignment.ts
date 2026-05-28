import mongoose, { Schema, Document } from 'mongoose';

export type QuestionType = 'mcq' | 'short' | 'long' | 'truefalse';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type JobStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface IQuestion {
  number: number;
  text: string;
  difficulty: Difficulty;
  marks: number;
  type: QuestionType;
  options?: string[];
}

export interface IQuestionConfig {
  type: QuestionType;
  count: number;
  marks: number;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IQuestionPaper {
  school: string;
  subject: string;
  class: string;
  timeAllowed: string;
  maxMarks: number;
  sections: ISection[];
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  class: string;
  school: string;
  dueDate: Date;
  questionConfigs: IQuestionConfig[];
  difficulty: Difficulty;
  instructions: string;
  timeDuration?: string;
  fileUrl?: string;
  extractedText?: string;
  status: JobStatus;
  jobId?: string;
  result?: IQuestionPaper;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  number: { type: Number, required: true },
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  marks: { type: Number, required: true },
  type: { type: String, enum: ['mcq', 'short', 'long', 'truefalse'], required: true },
  options: [String],
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema],
});

const QuestionPaperSchema = new Schema<IQuestionPaper>({
  school: String,
  subject: String,
  class: String,
  timeAllowed: String,
  maxMarks: Number,
  sections: [SectionSchema],
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    school: { type: String, default: 'VedaAI School' },
    dueDate: { type: Date, required: true },
    questionConfigs: [{
      type: { type: String, enum: ['mcq', 'short', 'long', 'truefalse'], required: true },
      count: { type: Number, required: true, min: 1 },
      marks: { type: Number, required: true, min: 1 }
    }],
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    instructions: { type: String, default: '' },
    timeDuration: { type: String, default: '' },
    fileUrl: String,
    extractedText: String,
    status: { type: String, enum: ['pending', 'processing', 'complete', 'failed'], default: 'pending' },
    jobId: String,
    result: QuestionPaperSchema,
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
