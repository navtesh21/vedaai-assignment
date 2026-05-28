'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useAssignmentStore, QuestionType } from '@/lib/store';
import { createAssignment } from '@/lib/api';

const QUESTION_TYPES: { id: QuestionType; label: string; icon: string }[] = [
  { id: 'mcq', label: 'Multiple Choice', icon: '○' },
  { id: 'short', label: 'Short Answer', icon: '✎' },
  { id: 'long', label: 'Long Answer', icon: '≡' },
  { id: 'truefalse', label: 'True / False', icon: '±' },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: '#2d7a4f' },
  { id: 'medium', label: 'Medium', color: '#b76e00' },
  { id: 'hard', label: 'Hard', color: '#c53030' },
] as const;

interface FormErrors {
  title?: string;
  subject?: string;
  className?: string;
  dueDate?: string;
  questionConfigs?: string;
}

export default function CreatePage() {
  const router = useRouter();
  const { form, currentStep, setFormField, setStep, setCurrentAssignment, resetForm } = useAssignmentStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Validation ──────────────────────────────────────────────
  function validateStep1(): boolean {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = 'Assignment title is required';
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.className.trim()) newErrors.className = 'Class is required';
    if (!form.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (new Date(form.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date must be in the future';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep2(): boolean {
    const newErrors: FormErrors = {};
    if (form.questionConfigs.length === 0) newErrors.questionConfigs = 'Add at least one question type';
    const totalQ = form.questionConfigs.reduce((acc, c) => acc + c.count, 0);
    if (totalQ === 0) newErrors.questionConfigs = 'Total questions must be greater than 0';
    if (totalQ > 50) newErrors.questionConfigs = 'Maximum 50 total questions allowed';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Step Navigation ─────────────────────────────────────────
  function handleNext() {
    if (currentStep === 1 && validateStep1()) setStep(2);
  }

  function handlePrev() {
    setErrors({});
    setStep(1);
  }

  // ── File Handling ───────────────────────────────────────────
  function handleFile(file: File | null) {
    if (file && file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: 'File size must be under 10MB' } as FormErrors));
      return;
    }
    setFormField('file', file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null);
  }

  // ── Submit ──────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validateStep2()) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('subject', form.subject);
      data.append('className', form.className);
      data.append('school', form.school || 'VedaAI School');
      data.append('dueDate', form.dueDate);
      if ((form as any).timeDuration) {
        data.append('timeDuration', (form as any).timeDuration);
      }
      data.append('questionConfigs', JSON.stringify(form.questionConfigs));
      data.append('difficulty', form.difficulty);
      data.append('instructions', form.instructions);
      if (form.file) data.append('file', form.file);

      const result = await createAssignment(data);
      setCurrentAssignment(result.assignmentId);
      router.push(`/output/${result.assignmentId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout title="Assignment" showBack backHref="/">
      <div className="animate-fade-in" style={{ flex: 1 }}>

        {/* Main content card */}
        <div className="create-container">

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: currentStep === 1 ? 'var(--accent-green)' : 'var(--btn-dark)',
                boxShadow: `0 0 0 4px ${currentStep === 1 ? 'var(--accent-green-ring)' : 'rgba(48,48,48,0.15)'}`,
                flexShrink: 0,
              }} aria-hidden="true" />
              <div>
                <h1 className="text-h2">Create Assignment</h1>
                <p className="text-p4" style={{ color: 'var(--text-muted)' }}>
                  {currentStep === 1 ? 'Set up a new assignment for your students' : 'Configure question parameters'}
                </p>
              </div>
            </div>
          </div>

          {/* Step Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={2} aria-label={`Step ${currentStep} of 2`}>
            <div className={`step-pill ${currentStep >= 1 ? 'active' : 'inactive'}`} style={{ flex: 1 }} />
            <div className={`step-pill ${currentStep >= 2 ? 'active' : 'inactive'}`} style={{ flex: 1 }} />
          </div>

          {/* ── STEP 1 ── */}
          {currentStep === 1 && (
            <div className="card" style={{ background: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Section header */}
              <div>
                <h2 className="text-h2">Assignment Details</h2>
                <p className="text-p4" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Basic information about your assignment</p>
              </div>

              {/* File Upload */}
              <div>
                <div
                  className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  aria-label="Upload assignment material. Accepts PDF, image files up to 10MB"
                  id="file-upload-zone"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.png,.jpg,.jpeg"
                    onChange={onFileChange}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                    id="file-input"
                  />
                  <div className="upload-zone-icon" aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 16 12 12 8 16" />
                      <line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                  </div>
                  {form.file ? (
                    <div>
                      <div className="text-p3" style={{ color: 'var(--text-primary)' }}>📎 {form.file.name}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                        {(form.file.size / 1024).toFixed(1)} KB — Click to replace
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="upload-zone-text">Upload images of your preferred document/image</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)', marginTop: 4 }}>PDF, PNG, JPG up to 10MB — optional</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="form-grid">
                {/* Title */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="title-input">
                    Assignment Title <span style={{ color: '#e53e3e' }} aria-hidden="true">*</span>
                  </label>
                  <input
                    id="title-input"
                    type="text"
                    className={`form-input ${errors.title ? 'error' : ''}`}
                    placeholder="e.g., Chapter 5 — Chemical Effects of Electric Current"
                    value={form.title}
                    onChange={(e) => setFormField('title', e.target.value)}
                    aria-required="true"
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? 'title-error' : undefined}
                  />
                  {errors.title && <span id="title-error" className="form-error" role="alert">{errors.title}</span>}
                </div>

                {/* Subject */}
                <div className="form-group">
                  <label className="form-label" htmlFor="subject-input">
                    Subject <span style={{ color: '#e53e3e' }} aria-hidden="true">*</span>
                  </label>
                  <input
                    id="subject-input"
                    type="text"
                    className={`form-input ${errors.subject ? 'error' : ''}`}
                    placeholder="e.g., Science"
                    value={form.subject}
                    onChange={(e) => setFormField('subject', e.target.value)}
                    aria-required="true"
                    aria-invalid={!!errors.subject}
                  />
                  {errors.subject && <span className="form-error" role="alert">{errors.subject}</span>}
                </div>

                {/* Class */}
                <div className="form-group">
                  <label className="form-label" htmlFor="class-input">
                    Class / Grade <span style={{ color: '#e53e3e' }} aria-hidden="true">*</span>
                  </label>
                  <input
                    id="class-input"
                    type="text"
                    className={`form-input ${errors.className ? 'error' : ''}`}
                    placeholder="e.g., 8th"
                    value={form.className}
                    onChange={(e) => setFormField('className', e.target.value)}
                    aria-required="true"
                    aria-invalid={!!errors.className}
                  />
                  {errors.className && <span className="form-error" role="alert">{errors.className}</span>}
                </div>

                {/* School */}
                <div className="form-group">
                  <label className="form-label" htmlFor="school-input">School Name</label>
                  <input
                    id="school-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Delhi Public School"
                    value={form.school}
                    onChange={(e) => setFormField('school', e.target.value)}
                  />
                </div>

                {/* Due Date & Time Duration */}
                <div className="form-group">
                  <label className="form-label" htmlFor="due-date-input">
                    Due Date <span style={{ color: '#e53e3e' }} aria-hidden="true">*</span>
                  </label>
                  <input
                    id="due-date-input"
                    type="date"
                    className={`form-input ${errors.dueDate ? 'error' : ''}`}
                    value={form.dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormField('dueDate', e.target.value)}
                    aria-required="true"
                    aria-invalid={!!errors.dueDate}
                  />
                  {errors.dueDate && <span className="form-error" role="alert">{errors.dueDate}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="time-duration-input">
                    Time Duration <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <input
                    id="time-duration-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g., 2 Hours"
                    value={(form as any).timeDuration || ''}
                    onChange={(e) => setFormField('timeDuration' as any, e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {currentStep === 2 && (
            <div className="card" style={{ background: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h2 className="text-h2">Question Configuration</h2>
                <p className="text-p4" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Configure question types and parameters</p>
              </div>

              {/* Question Configuration Rows */}
              <div className="form-group">
                <div className="question-config-grid" style={{ marginBottom: 4, padding: '0 16px', display: window.innerWidth <= 768 ? 'none' : 'grid' }}>
                  <label className="form-label" style={{ margin: 0 }}>Question Type</label>
                  <div></div>
                  <label className="form-label" style={{ textAlign: 'center', margin: 0 }}>No. of Questions</label>
                  <label className="form-label" style={{ textAlign: 'center', margin: 0 }}>Marks</label>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {form.questionConfigs.map((config, index) => (
                    <div key={config.id} className="question-config-row question-config-grid">
                      <select 
                        className="form-select" 
                        style={{ padding: '16px 20px', borderRadius: 'var(--radius-full)' }}
                        value={config.type}
                        onChange={(e) => {
                          const updated = [...form.questionConfigs];
                          updated[index].type = e.target.value as any;
                          setFormField('questionConfigs', updated);
                        }}
                      >
                        {QUESTION_TYPES.map(qt => (
                          <option key={qt.id} value={qt.id}>{qt.label}</option>
                        ))}
                      </select>

                      <button 
                        type="button" 
                        onClick={() => {
                          setFormField('questionConfigs', form.questionConfigs.filter(c => c.id !== config.id));
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 24, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        aria-label="Remove Question Type"
                      >×</button>

                      <div className="counter-btn-group">
                        <button type="button" className="counter-btn" onClick={() => {
                           const updated = [...form.questionConfigs];
                           updated[index].count = Math.max(1, updated[index].count - 1);
                           setFormField('questionConfigs', updated);
                        }}>−</button>
                        <span className="counter-value">{config.count}</span>
                        <button type="button" className="counter-btn" onClick={() => {
                           const updated = [...form.questionConfigs];
                           updated[index].count++;
                           setFormField('questionConfigs', updated);
                        }}>+</button>
                      </div>

                      <div className="counter-btn-group">
                        <button type="button" className="counter-btn" onClick={() => {
                           const updated = [...form.questionConfigs];
                           updated[index].marks = Math.max(1, updated[index].marks - 1);
                           setFormField('questionConfigs', updated);
                        }}>−</button>
                        <span className="counter-value">{config.marks}</span>
                        <button type="button" className="counter-btn" onClick={() => {
                           const updated = [...form.questionConfigs];
                           updated[index].marks++;
                           setFormField('questionConfigs', updated);
                        }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  className="add-qt-btn"
                  onClick={() => {
                    setFormField('questionConfigs', [...form.questionConfigs, { id: Math.random().toString(), type: 'mcq', count: 1, marks: 1 }]);
                  }}
                  style={{ alignSelf: 'flex-start', marginTop: 16 }}
                >
                  <div className="add-qt-icon">+</div> Add Question Type
                </button>
                {errors.questionConfigs && <span className="form-error">{errors.questionConfigs}</span>}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginTop: 16, marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Total Questions : {form.questionConfigs.reduce((acc, c) => acc + c.count, 0)}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Total Marks : {form.questionConfigs.reduce((acc, c) => acc + c.count * c.marks, 0)}
                </div>
              </div>

              {/* Difficulty */}
              <div className="form-group">
                <label className="form-label" htmlFor="difficulty-select">Overall Difficulty</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} role="radiogroup" aria-label="Difficulty level">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setFormField('difficulty', d.id)}
                      style={{
                        flex: '1 1 120px',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${form.difficulty === d.id ? d.color : 'var(--bg-off-white-40)'}`,
                        background: form.difficulty === d.id ? `${d.color}15` : 'var(--bg-white)',
                        color: form.difficulty === d.id ? d.color : 'var(--text-secondary)',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '-0.04em',
                      }}
                      role="radio"
                      aria-checked={form.difficulty === d.id}
                      aria-label={`Difficulty: ${d.label}`}
                      id={`difficulty-${d.id}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="form-group">
                <label className="form-label" htmlFor="instructions-input">
                  Additional Information <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(For better output)</span>
                </label>
                <textarea
                  id="instructions-input"
                  className="form-textarea"
                  placeholder="e.g., Focus on electrolysis, electroplating, and chemical effects. Include formulas where applicable..."
                  value={form.instructions}
                  onChange={(e) => setFormField('instructions', e.target.value)}
                  rows={4}
                  aria-describedby="instructions-hint"
                />
                <span id="instructions-hint" className="form-label-sub">
                  Total marks: {form.questionConfigs.reduce((acc, c) => acc + c.count * c.marks, 0)} · Questions: {form.questionConfigs.reduce((acc, c) => acc + c.count, 0)}
                </span>
              </div>

              {/* Submit error */}
              {submitError && (
                <div role="alert" style={{
                  padding: '12px 16px',
                  background: '#fde8e8',
                  color: '#c53030',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                  ⚠️ {submitError}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-white"
              onClick={currentStep === 1 ? () => { resetForm(); router.push('/'); } : handlePrev}
              disabled={isSubmitting}
              aria-label={currentStep === 1 ? 'Cancel and go back to home' : 'Go to previous step'}
              id="prev-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </button>

            {currentStep === 1 ? (
              <button
                type="button"
                className="btn btn-dark"
                onClick={handleNext}
                aria-label="Go to next step"
                id="next-btn"
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-dark"
                onClick={handleSubmit}
                disabled={isSubmitting}
                aria-label={isSubmitting ? 'Generating assignment, please wait' : 'Generate assignment with AI'}
                id="generate-btn"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} aria-hidden="true" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate with AI
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
