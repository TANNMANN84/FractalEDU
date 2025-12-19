
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, 
  confirmLabel = "Confirm", isDanger = true 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">{message}</p>
            <div className="flex justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg text-sm transition-colors">Cancel</button>
                <button 
                    onClick={onConfirm} 
                    className={`px-4 py-2 text-white font-bold rounded-lg text-sm shadow-sm transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
  );
};

interface PromptProps {
  isOpen: boolean;
  title: string;
  defaultValue?: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export const PromptDialog: React.FC<PromptProps> = ({ 
  isOpen, title, defaultValue = '', placeholder, onConfirm, onCancel,
  confirmLabel = "Save"
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setValue(defaultValue || '');
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <button onClick={onCancel}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <input 
                autoFocus
                className="w-full border border-slate-300 rounded-lg p-2.5 mb-6 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={placeholder}
                onKeyDown={e => e.key === 'Enter' && value.trim() && onConfirm(value)}
            />
            <div className="flex justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg text-sm transition-colors">Cancel</button>
                <button 
                    onClick={() => onConfirm(value)} 
                    disabled={!value.trim()} 
                    className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm shadow-sm transition-colors"
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
  );
};
