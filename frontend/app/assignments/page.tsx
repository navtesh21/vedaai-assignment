'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { useAssignmentStore } from '@/lib/store';
import { listAssignments, deleteAssignment } from '@/lib/api';

export default function AssignmentsPage() {
  const router = useRouter();
  const { assignments, setAssignments } = useAssignmentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Handle clicking outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    listAssignments()
      .then((data) => setAssignments(data.assignments || []))
      .catch(() => {});
  }, [setAssignments]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      setAssignments(assignments.filter((a) => a._id !== id));
    } catch {
      alert('Failed to delete assignment');
    }
  }

  const filteredAssignments = assignments.filter((a) =>
    a.title ? a.title.toLowerCase().includes(searchQuery.toLowerCase()) : false
  );

  return (
    <AppLayout title="Assignments" showBack backHref="/">
      <div className="animate-fade-in" style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 className="text-h2">Assignments</h1>
            <p className="text-p4" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Manage and create assignments for your classes.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-white)', borderRadius: 'var(--radius-full)', padding: '12px 24px', marginBottom: '32px' }}>
          <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter By
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--bg-off-white-40)' }}></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search Assignment" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '15px', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', padding: '0 24px' }}>
            <div style={{ width: '240px', height: '240px', background: 'var(--bg-white)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10%', left: '10%', color: '#2b4d5a' }}>
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div style={{ position: 'absolute', bottom: '15%', right: '15%', color: '#e53e3e' }}>
                 <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              </div>
              <div style={{ position: 'absolute', top: '30%', right: '-10%', color: '#3182ce' }}>
                 <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '16px' }}>
              No assignments yet
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5', maxWidth: '400px', marginBottom: '32px' }}>
              Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
            </p>
            <Link href="/create" style={{
              background: '#1a1a1a',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '100px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '600',
              fontFamily: 'var(--font-heading)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Your First Assignment
            </Link>
          </div>
        ) : (
          <div className="assignments-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
            paddingBottom: '120px'
          }}>
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment._id}
                style={{
                  background: 'var(--bg-white)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '48px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
                    {assignment.title}
                  </h3>
                  <div className="dropdown-container" style={{ position: 'relative' }}>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActiveDropdown(activeDropdown === assignment._id ? null : assignment._id);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                    
                    {activeDropdown === assignment._id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: 'var(--bg-white)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        border: '1.5px solid var(--bg-off-white-40)',
                        padding: '8px',
                        zIndex: 10,
                        minWidth: '180px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <button 
                          onClick={() => router.push(`/output/${assignment._id}`)}
                          style={{ background: 'none', border: 'none', padding: '10px 16px', textAlign: 'left', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', borderRadius: 'var(--radius-xs)', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-off-white-40)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          View Assignment
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(null);
                            handleDelete(assignment._id, e);
                          }}
                          style={{ background: 'none', border: 'none', padding: '10px 16px', textAlign: 'left', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#e53e3e', borderRadius: 'var(--radius-xs)', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="assignment-date-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>Assigned on : </span>
                    {new Date(assignment.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>Due : </span>
                    {new Date(assignment.dueDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Add Button for Mobile */}
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          zIndex: 50,
          display: 'flex'
        }} className="mobile-fab">
          <Link href="/create" style={{
            background: 'var(--bg-white)',
            color: '#e53e3e',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            textDecoration: 'none',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
