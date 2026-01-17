import React, { Component, ErrorInfo, ReactNode, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from './shared/components/RootLayout';
import { Profiler } from './features/profiler/Profiler';
import { Classes } from './features/classes/Classes';
import { Analytics } from './features/analytics/Analytics';
import { Diagnostics } from './features/diagnostics/Diagnostics';
import { Settings } from './features/settings/Settings';
import { MonitoringDashboard } from './features/monitoring/MonitoringDashboard';
import { ToastContainer } from './shared/components/ToastContainer';
import { ThemeProvider } from './context/ThemeContext';
import { useAutoSync } from '@/hooks/useAutoSync';
import { Day2Day } from './features/day2day/Day2Day';

// Lazy load the named export 'Reporting' to isolate PDF libraries
const Reporting = lazy(() => import('./features/reporting/Reporting').then(module => ({ default: module.Reporting })));

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-8 text-center transition-colors">
          <div className="max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-2">Something went wrong</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">The application encountered an unexpected error.</p>
            <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-lg text-xs font-mono text-left mb-6 overflow-auto max-h-32 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {this.state.error?.message || 'Unknown Error'}
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('fractal-edu-storage'); // Optional: Clear bad state
                window.location.reload();
              }}
              className="px-6 py-2 bg-slate-900 dark:bg-brand-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-brand-700 font-bold transition-colors shadow-lg"
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// Internal Component to run hooks inside the Provider
const FractalApp: React.FC = () => {
  // 1. Initialize Auto-Sync
  useAutoSync();

  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Default Redirect */}
        <Route index element={<Day2Day />} />

        {/* CRITICAL FIX: Added "/*" to these paths.
            This tells the Router: "Allow sub-paths like /classes/seating to pass through 
            to the component instead of getting blocked or redirected."
        */}
        <Route path="profiler/*" element={<Profiler />} />
        <Route path="day2day/*" element={<Day2Day />} />
        <Route path="classes/*" element={<Classes />} />
        <Route path="analytics/*" element={<Analytics />} />
        <Route path="diagnostics/*" element={<Diagnostics />} />
        <Route path="monitoring/*" element={<MonitoringDashboard />} />
        <Route path="management/*" element={<Settings />} />
        
        <Route path="reporting" element={
          <Suspense fallback={<div className="p-8 text-slate-500 font-medium">Loading Reporting Module...</div>}>
            <Reporting />
          </Suspense>
        } />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FractalApp />
        <ToastContainer />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;