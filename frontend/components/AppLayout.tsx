'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNavBar from './BottomNavBar';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function AppLayout({ children, title, showBack = false, backHref }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-main">
        <div className="app-content">
          <TopBar
            title={title}
            showBack={showBack}
            backHref={backHref}
            onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          />
          {children}
        </div>
      </main>
      <div className="mobile-bottom-nav">
        <BottomNavBar />
      </div>
    </div>
  );
}
