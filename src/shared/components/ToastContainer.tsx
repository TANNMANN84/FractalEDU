
import React, { useEffect } from 'react';
import { useAppStore } from '@/store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useAppStore();

    return (
        <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: any, onDismiss: () => void }> = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const bg = toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
               toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
               'bg-blue-50 border-blue-200 text-blue-800';
    
    const Icon = toast.type === 'success' ? CheckCircle : 
                 toast.type === 'error' ? AlertCircle : Info;

    return (
        <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right-10 fade-in duration-300 ${bg}`}>
            <Icon className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{toast.message}</p>
            <button onClick={onDismiss} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
    );
};
