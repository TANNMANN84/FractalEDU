import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/store';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, CloudOff, Save, CheckCircle } from 'lucide-react';
import { useAutoSync } from '@/hooks/useAutoSync';

export const RootLayout: React.FC = () => {
  const { teacherProfile } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { isConnected, hasUnsavedChanges, saveNow, reconnect } = useAutoSync();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';

  // Simple Title Logic
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/monitoring')) return 'Junior Monitoring';
    if (path.includes('/analytics')) return 'Exam Analytics';
    if (path.includes('/classes')) return 'Class Manager';
    if (path.includes('/management')) return 'Settings & Admin';
    if (path.includes('/diagnostics')) return 'Rapid Diagnostics';
    return 'Dashboard';
  };

  const displayName = teacherProfile?.name || 'John Doe';
  const displayRole = teacherProfile?.role || 'Head of Science';
  const displayInitials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shadow-sm shrink-0 z-10 transition-colors duration-200 gap-6">
          
          {/* LEFT: Dynamic Page Title */}
          <div className="flex items-center min-w-fit">
            <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {getPageTitle()}
            </h1>
          </div>

          {/* CENTER: Spacer (Pushes search to right) */}
          <div className="flex-1"></div>

          {/* RIGHT: Global Search & Actions */}
          <div className="flex items-center gap-3 min-w-fit">
            
            {/* Sync Controls */}
            {!isConnected ? (
              <button 
                onClick={reconnect}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/30"
                title="Click to reconnect to local folder"
              >
                <CloudOff className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnected</span>
              </button>
            ) : (
              <button 
                onClick={saveNow}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-full transition-all duration-200 ${
                  hasUnsavedChanges 
                    ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800' 
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800'
                }`}
                title={hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
              >
                {hasUnsavedChanges ? <Save className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                <span className="hidden sm:inline">{hasUnsavedChanges ? 'Save' : 'Synced'}</span>
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(isDark ? 'light' : 'dark')} 
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Button */}
            <button 
              onClick={() => navigate('/management')}
              className="flex items-center gap-3 p-1 pl-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="hidden md:block text-right mr-1">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                  {displayRole}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm border-2 border-transparent group-hover:border-brand-200 dark:group-hover:border-brand-700 transition-all shadow-sm">
                {displayInitials}
              </div>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};