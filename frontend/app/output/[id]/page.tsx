'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useAssignmentStore, QuestionPaper, Section, Question } from '@/lib/store';
import { useWebSocket } from '@/lib/websocket';
import { getAssignment, createAssignment } from '@/lib/api';

// ─── Difficulty Badge ──────────────────────────────────────────
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, { className: string; label: string }> = {
    easy: { className: 'badge-easy', label: 'Easy' },
    medium: { className: 'badge-medium', label: 'Moderate' },
    hard: { className: 'badge-hard', label: 'Challenging' },
  };
  const { className, label } = map[difficulty] || map['medium'];
  return (
    <span className={`difficulty-badge ${className}`} aria-label={`Difficulty: ${label}`}>
      <span aria-hidden="true">
        {difficulty === 'easy' ? '●' : difficulty === 'hard' ? '▲' : '◆'}
      </span>
      {label}
    </span>
  );
}

// ─── Question Component ────────────────────────────────────────
function QuestionItem({ question }: { question: Question }) {
  // Strip the [Easy]/[Moderate]/[Challenging] and [X Marks] prefix text from the display
  const cleanText = question.text
    .replace(/^\[(Easy|Moderate|Challenging|Hard|Medium)\]\s*/i, '')
    .replace(/\[\d+\s*Marks?\]$/i, '')
    .trim();

  return (
    <div className="paper-question">
      <div className="question-number" aria-hidden="true">{question.number}.</div>
      <div className="question-content">
        <p className="question-text">{cleanText}</p>

        {question.type === 'mcq' && question.options && (
          <div className="question-options" role="list" aria-label="Answer options">
            {question.options.map((opt, idx) => (
              <div key={idx} className="question-option" role="listitem">
                {opt}
              </div>
            ))}
          </div>
        )}

        {question.type === 'truefalse' && (
          <div className="question-options" role="group" aria-label="True or False options">
            <div className="question-option">○ True</div>
            <div className="question-option">○ False</div>
          </div>
        )}

        <div className="question-meta">
          <DifficultyBadge difficulty={question.difficulty} />
          <span className="question-marks" aria-label={`${question.marks} marks`}>
            [{question.marks} Mark{question.marks !== 1 ? 's' : ''}]
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Section Component ────────────────────────────────────────
function SectionBlock({ section }: { section: Section }) {
  return (
    <section aria-label={section.title}>
      <h2 className="paper-section-header">{section.title}</h2>
      <p className="paper-section-instruction">{section.instruction}</p>
      <div role="list" aria-label={`Questions in ${section.title}`}>
        {section.questions.map((q) => (
          <div key={q.number} role="listitem">
            <QuestionItem question={q} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Paper View ───────────────────────────────────────────────
function PaperView({ paper, assignmentId }: { paper: QuestionPaper; assignmentId: string }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { form, setCurrentAssignment, setJobStatus } = useAssignmentStore();

  async function handleDownloadPDF() {
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { QuestionPaperPDF } = await import('@/components/QuestionPaperPDF');
      
      const blob = await pdf(<QuestionPaperPDF paper={paper} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${paper.subject}-${paper.class}-question-paper.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Please try again.');
    }
  }

  async function handleRegenerate() {
    try {
      const data = new FormData();
      data.append('title', form.title || `${paper.subject} Assignment`);
      data.append('subject', paper.subject);
      data.append('className', paper.class);
      data.append('school', paper.school);
      data.append('dueDate', form.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
      if ((form as any).timeDuration) {
        data.append('timeDuration', (form as any).timeDuration);
      }
      data.append('questionConfigs', JSON.stringify(form.questionConfigs));
      data.append('difficulty', form.difficulty || 'medium');
      data.append('instructions', form.instructions || '');

      const result = await createAssignment(data);
      setCurrentAssignment(result.assignmentId);
      setJobStatus('pending');
      router.push(`/output/${result.assignmentId}`);
    } catch (err) {
      alert('Failed to regenerate. Please try again.');
    }
  }

  return (
    <div className="output-container">
      {/* Action bar — top */}
      <div className="action-bar" style={{ borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', background: 'rgba(255,255,255,0.1)' }}>
        <button
          className="btn btn-white btn-sm"
          onClick={handleRegenerate}
          id="regenerate-btn"
          aria-label="Regenerate question paper with same settings"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Regenerate
        </button>
        <button
          className="btn btn-dark btn-sm"
          onClick={handleDownloadPDF}
          id="download-pdf-btn"
          aria-label="Download question paper as PDF"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Paper */}
      <div ref={paperRef} className="paper-card animate-fade-in" id="question-paper" aria-label="Generated question paper">
        {/* School Header */}
        <div className="paper-header">
          <div style={{ textAlign: 'center' }}>
            <div className="paper-school-name">{paper.school}</div>
            <div className="paper-meta-text" style={{ marginTop: 4 }}>
              Subject: {paper.subject} &nbsp;|&nbsp; Class: {paper.class}
            </div>
          </div>

          <div className="paper-meta-row" style={{ marginTop: 12 }}>
            <div className="paper-meta-text" aria-label={`Time allowed: ${paper.timeAllowed}`}>
              Time Allowed: {paper.timeAllowed}
            </div>
            <div className="paper-meta-text" aria-label={`Maximum marks: ${paper.maxMarks}`}>
              Maximum Marks: {paper.maxMarks}
            </div>
          </div>

          <div style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'var(--bg-off-white-20)',
            borderRadius: 'var(--radius-xs)',
            fontSize: 13,
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
          }}>
            All questions are compulsory unless stated otherwise.
          </div>
        </div>

        {/* Student Info */}
        <div className="paper-student-section" role="group" aria-label="Student information fields">
          <div className="paper-student-field">
            Name: <span aria-hidden="true">_______________________</span>
          </div>
          <div className="paper-student-field">
            Roll Number: <span aria-hidden="true">___________________</span>
          </div>
          <div className="paper-student-field">
            Class: {paper.class} &nbsp; Section: <span aria-hidden="true">__________</span>
          </div>
        </div>

        {/* Sections */}
        <div style={{ marginTop: 24 }}>
          {paper.sections.map((section, idx) => (
            <SectionBlock key={idx} section={section} />
          ))}
        </div>

        {/* End of paper */}
        <div style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: '2px solid var(--bg-off-white-40)',
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          letterSpacing: '0.05em',
        }}>
          *** END OF QUESTION PAPER ***
        </div>
      </div>

      {/* Action bar — bottom */}
      <div className="action-bar">
        <button
          className="btn btn-white btn-sm"
          onClick={handleRegenerate}
          aria-label="Regenerate question paper"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Regenerate
        </button>
        <button
          className="btn btn-dark btn-sm"
          onClick={handleDownloadPDF}
          aria-label="Download question paper as PDF"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </button>
      </div>
    </div>
  );
}

// ─── Loading State ────────────────────────────────────────────
function LoadingState({ status, message }: { status: string; message: string }) {
  return (
    <div className="output-container animate-fade-in" style={{ minHeight: 400 }}>
      <div className="loading-container" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="loading-spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'white' }} aria-hidden="true" />
          <div className={`status-dot ${status}`} aria-hidden="true" />
        </div>
        <div>
          <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            {status === 'pending' ? 'Queuing your request...' : 'Generating question paper...'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' }}>
            {message || 'Our AI is crafting structured questions based on your settings'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Analyzing parameters', 'Structuring questions', 'Assigning difficulty', 'Formatting output'].map((step, i) => (
            <div
              key={step}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                color: 'rgba(255,255,255,0.8)',
                animation: `pulse-dot ${1.5 + i * 0.3}s ease-in-out infinite`,
              }}
              aria-label={step}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="output-container animate-fade-in" style={{ minHeight: 300 }}>
      <div className="loading-container" role="alert">
        <div style={{ fontSize: 48 }} aria-hidden="true">⚠️</div>
        <div>
          <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            Generation Failed
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' }}>
            {message}
          </p>
        </div>
        <button className="btn btn-white" onClick={onRetry} id="retry-btn" aria-label="Retry generation">
          Try Again
        </button>
      </div>
    </div>
  );
}

// ─── Main Output Page ─────────────────────────────────────────
export default function OutputPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params?.id;
  const router = useRouter();

  const {
    jobStatus,
    statusMessage,
    currentPaper,
    setCurrentAssignment,
    setJobStatus,
    setPaper,
  } = useAssignmentStore();

  // Connect to WebSocket
  useWebSocket(assignmentId ?? null);

  // Load initial state
  useEffect(() => {
    if (!assignmentId) return;

    setCurrentAssignment(assignmentId);

    getAssignment(assignmentId)
      .then((data) => {
        if (data.assignment?.status === 'complete' && data.result) {
          setPaper(data.result);
        } else if (data.assignment?.status === 'failed') {
          setJobStatus('failed', 'Generation failed. Please try again.');
        } else {
          setJobStatus(data.assignment?.status || 'pending');
        }
      })
      .catch(() => {
        setJobStatus('processing', 'Waiting for generation...');
      });
  }, [assignmentId, setCurrentAssignment, setPaper, setJobStatus]);

  return (
    <AppLayout title="Assignment Output" showBack backHref="/">
      <div className="animate-fade-in" style={{ flex: 1 }}>
        {/* Page heading */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="text-h2">Question Paper</h1>
            <p className="text-p4" style={{ color: 'var(--text-secondary)' }}>AI-generated assignment paper</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`status-dot ${jobStatus === 'idle' ? 'pending' : jobStatus}`} aria-hidden="true" />
            <span className={`status-chip ${jobStatus === 'idle' ? 'pending' : jobStatus}`} aria-live="polite">
              {jobStatus === 'idle' ? 'Starting...' : jobStatus}
            </span>
          </div>
        </div>

        {/* Content */}
        {(jobStatus === 'pending' || jobStatus === 'processing' || jobStatus === 'idle') && (
          <LoadingState status={jobStatus === 'idle' ? 'pending' : jobStatus} message={statusMessage} />
        )}

        {jobStatus === 'failed' && (
          <ErrorState
            message={statusMessage || 'The generation process encountered an error.'}
            onRetry={() => router.push('/create')}
          />
        )}

        {jobStatus === 'complete' && currentPaper && (
          <PaperView paper={currentPaper} assignmentId={assignmentId ?? ''} />
        )}
      </div>
    </AppLayout>
  );
}
