'use client';

import { useRouter } from 'next/navigation';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  onMenuToggle?: () => void;
}

export default function TopBar({ title = 'Assignment', showBack = true, backHref, onMenuToggle }: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="topbar" role="banner">
      {/* Mobile Logo */}
      <div className="topbar-mobile-logo" aria-hidden="true" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--btn-dark)', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>V</div>
        <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-primary)' }}>VedaAI</span>
      </div>

      {/* Back button */}
      {showBack && (
        <button
          className="topbar-back-btn"
          onClick={handleBack}
          aria-label="Go back"
          id="topbar-back-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      )}

      {/* Title */}
      <span className="topbar-title" aria-label={`Current page: ${title}`}>{title}</span>

      <div className="topbar-spacer" aria-hidden="true" />

      {/* Bell */}
      <button className="topbar-bell" aria-label="Notifications (1 new)" id="notifications-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="topbar-bell-dot" aria-hidden="true" />
      </button>

      {/* User */}
      <button className="topbar-user" aria-label="User menu: John Doe" id="topbar-user-btn">
        <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
        <span className="topbar-username">John Doe</span>
        <svg className="topbar-user-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Hamburger for mobile (moved to right) */}
      <button
        className="topbar-hamburger-btn"
        onClick={onMenuToggle}
        aria-label="Toggle navigation menu"
        id="menu-toggle-btn"
        style={{ display: 'none', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </header>
  );
}
