'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { useAssignmentStore } from '@/lib/store';
import { listAssignments } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { assignments, setAssignments } = useAssignmentStore();

  useEffect(() => {
    listAssignments()
      .then((data) => setAssignments(data.assignments || []))
      .catch(() => {/* backend not running */});
  }, [setAssignments]);

  return (
    <AppLayout title="Home">
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>

        {/* Welcome Hero */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Background blob */}
          <div aria-hidden="true" style={{
            position: 'absolute', right: -60, top: -60,
            width: 300, height: 300, borderRadius: '50%',
            background: 'rgba(76,76,76,0.08)', filter: 'blur(60px)',
            pointerEvents: 'none',
          }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: 'var(--accent-green)',
                boxShadow: '0 0 0 4px var(--accent-green-ring)',
              }} aria-hidden="true" />
              <span className="text-p3" style={{ color: 'var(--text-secondary)' }}>Active · Teacher Dashboard</span>
            </div>

            <h1 className="text-h1" style={{ marginBottom: 8 }}>
              Good morning, <span style={{ color: 'var(--btn-dark)' }}>John</span> 👋
            </h1>
            <p className="text-p2" style={{ color: 'var(--text-secondary)', maxWidth: 480 }}>
              Create AI-powered question papers for your students in seconds. Upload material, set parameters, and let VedaAI do the rest.
            </p>
          </div>

          <div className="hero-actions" style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <Link href="/create" className="btn btn-dark" id="hero-create-btn" aria-label="Create new assignment">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Assignment
            </Link>
            <Link href="/assignments" className="btn btn-white" id="hero-view-all-btn" aria-label="View all assignments">
              View All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-grid">
          {[
            { label: 'Total Assignments', value: assignments.length.toString(), icon: '📋', color: 'var(--btn-dark)' },
            { label: 'Completed', value: assignments.filter(a => a.status === 'complete').length.toString(), icon: '✅', color: '#2d7a4f' },
            { label: 'In Progress', value: assignments.filter(a => a.status === 'processing' || a.status === 'pending').length.toString(), icon: '⏳', color: '#b76e00' },
          ].map((stat) => (
            <div key={stat.label} className="card-white" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden="true">{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, letterSpacing: '-0.06em' }}>{stat.value}</div>
              <div className="text-p4" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Assignments */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="text-h2">Recent Assignments</h2>
            <Link href="/assignments" className="btn btn-ghost btn-sm" aria-label="View all assignments">View all</Link>
          </div>

          {assignments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <div className="empty-state-title" style={{ fontSize: 24, marginBottom: 8, textAlign: 'center' }}>
                Created Assignments will appear here
              </div>
              <p className="text-p4" style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                Start by creating your first AI-powered assignment
              </p>
              <Link href="/create" className="btn btn-dark" style={{ margin: '0 auto' }} id="empty-create-btn">
                Create Assignment
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {assignments.slice(0, 6).map((assignment) => (
                <div
                  key={assignment._id}
                  className="assignment-card"
                  onClick={() => router.push(`/output/${assignment._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/output/${assignment._id}`)}
                  aria-label={`Assignment: ${assignment.title}, Status: ${assignment.status}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="assignment-card-title">{assignment.title}</div>
                    <span className={`status-chip ${assignment.status}`} aria-label={`Status: ${assignment.status}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <div className="assignment-card-meta">
                    <span>{assignment.subject}</span> · <span>Class {assignment.class}</span>
                  </div>
                  <div className="assignment-card-footer">
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
