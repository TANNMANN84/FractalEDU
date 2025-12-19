import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface TagInputProps {
  label: string;
  selected: string[];
  options: string[];
  onChange: (newTags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({ 
  label, 
  selected = [], 
  options = [], 
  onChange, 
  placeholder = "Select...", 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    if (!selected.includes(option)) {
      onChange([...selected, option]);
    }
    setIsOpen(false);
  };

  const handleRemove = (tagToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(tag => tag !== tagToRemove));
  };

  const availableOptions = options.filter(opt => !selected.includes(opt));

  return (
    <div className="w-full relative" ref={containerRef}>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
      
      <div 
        className={`min-h-[42px] bg-white border rounded-lg p-1.5 flex flex-wrap items-center gap-2 cursor-pointer transition-all ${
           disabled ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 
           isOpen ? 'border-brand-500 ring-1 ring-brand-200' : 'border-slate-300 hover:border-slate-400'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selected.length === 0 && (
          <span className="text-slate-400 text-sm px-2 select-none">{placeholder}</span>
        )}
        
        {selected.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-brand-50 text-brand-700 border border-brand-100 rounded text-xs font-medium animate-in fade-in zoom-in duration-200">
            {tag}
            <button 
              onClick={(e) => handleRemove(tag, e)}
              className="hover:bg-brand-100 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <div className="ml-auto pr-2 text-slate-400">
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {availableOptions.length > 0 ? (
            availableOptions.map(option => (
              <div 
                key={option}
                onClick={() => handleSelect(option)}
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
              >
                {option}
              </div>
            ))
          ) : (
             <div className="px-3 py-2 text-sm text-slate-400 italic">No more options available</div>
          )}
        </div>
      )}
    </div>
  );
};