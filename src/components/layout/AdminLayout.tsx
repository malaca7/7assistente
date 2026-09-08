import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ThemeSettingsModal } from '../theme/ThemeSettingsModal';

export interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  fullWidth?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  currentPath,
  onNavigate,
  fullWidth = false,
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pitoco_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const [widthMode, setWidthMode] = useState<'compact' | 'normal' | 'wide'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pitoco_sidebar_width') as any) || 'normal';
    }
    return 'normal';
  });

  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const handleToggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('pitoco_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const handleCycleWidth = () => {
    setWidthMode(prev => {
      const next = prev === 'wide' ? 'normal' : 'wide';
      if (typeof window !== 'undefined') {
        localStorage.setItem('pitoco_sidebar_width', next);
      }
      return next;
    });
  };

  const getMainPaddingClass = () => {
    if (collapsed) return 'lg:pl-[72px]';
    if (widthMode === 'wide') return 'lg:pl-80';
    return 'lg:pl-64';
  };

  return (
    <div className="min-h-screen bg-black flex flex-col text-zinc-100 selection:bg-white selection:text-black">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        widthMode={widthMode}
        onCycleWidth={handleCycleWidth}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${getMainPaddingClass()}`}
      >
        {/* Topbar (Minimalist, sem o menu horizontal) */}
        <Topbar
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onNavigate={onNavigate}
        />

        {/* Page Content Viewport */}
        <main className={`flex-1 ${fullWidth ? 'p-0' : 'p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto'}`}>
          {children}
        </main>
      </div>

      {/* Modal de Personalização de Tema */}
      <ThemeSettingsModal />
    </div>
  );
};
