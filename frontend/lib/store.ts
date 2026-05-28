import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QuestionType = 'mcq' | 'short' | 'long' | 'truefalse';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type JobStatus = 'idle' | 'pending' | 'processing' | 'complete' | 'failed';

export interface Question {
  number: number;
  text: string;
  difficulty: Difficulty;
  marks: number;
  type: QuestionType;
  options?: string[];
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface QuestionPaper {
  school: string;
  subject: string;
  class: string;
  timeAllowed: string;
  maxMarks: number;
  sections: Section[];
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  class: string;
  school: string;
  dueDate: string;
  status: JobStatus;
  createdAt: string;
}

export interface QuestionConfig {
  id: string;
  type: QuestionType;
  count: number;
  marks: number;
}

// Form state for step 1 & 2
export interface AssignmentFormState {
  // Step 1
  title: string;
  subject: string;
  className: string;
  school: string;
  dueDate: string;
  timeDuration?: string;
  file: File | null;
  // Step 2
  questionConfigs: QuestionConfig[];
  difficulty: Difficulty;
  instructions: string;
}

interface AssignmentStore {
  // Form
  form: AssignmentFormState;
  currentStep: number;
  setFormField: <K extends keyof AssignmentFormState>(key: K, value: AssignmentFormState[K]) => void;
  setStep: (step: number) => void;
  resetForm: () => void;

  // Current job
  currentAssignmentId: string | null;
  jobStatus: JobStatus;
  statusMessage: string;
  currentPaper: QuestionPaper | null;
  setCurrentAssignment: (id: string) => void;
  setJobStatus: (status: JobStatus, message?: string) => void;
  setPaper: (paper: QuestionPaper) => void;

  // List
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
}

const defaultForm: AssignmentFormState = {
  title: '',
  subject: '',
  className: '',
  school: '',
  dueDate: '',
  timeDuration: '',
  file: null,
  questionConfigs: [
    { id: '1', type: 'mcq', count: 4, marks: 1 }
  ],
  difficulty: 'medium',
  instructions: '',
};

export const useAssignmentStore = create<AssignmentStore>()(
  persist(
    (set) => ({
      form: defaultForm,
      currentStep: 1,
      setFormField: (key, value) =>
        set((state) => ({ form: { ...state.form, [key]: value } })),
      setStep: (step) => set({ currentStep: step }),
      resetForm: () => set({ form: defaultForm, currentStep: 1, currentAssignmentId: null, jobStatus: 'idle', currentPaper: null }),

      currentAssignmentId: null,
      jobStatus: 'idle',
      statusMessage: '',
      currentPaper: null,
      setCurrentAssignment: (id) => set({ currentAssignmentId: id, jobStatus: 'pending', currentPaper: null }),
      setJobStatus: (status, message = '') => set({ jobStatus: status, statusMessage: message }),
      setPaper: (paper) => set({ currentPaper: paper, jobStatus: 'complete' }),

      assignments: [],
      setAssignments: (assignments) => set({ assignments }),
      addAssignment: (assignment) =>
        set((state) => ({ assignments: [assignment, ...state.assignments] })),
    }),
    {
      name: 'vedaai-store',
      partialize: (state) => ({
        assignments: state.assignments,
        currentAssignmentId: state.currentAssignmentId,
      }),
    }
  )
);
