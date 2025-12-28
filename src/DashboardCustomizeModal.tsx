import React from 'react';
import { X, LayoutGrid, Columns } from 'lucide-react';
import { WIDGETS_CONFIG } from '@/DashboardWidgets';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    widgets: string[];
    setWidgets: (widgets: string[]) => void;
    layout: 'grid' | 'featured';
    setLayout: (layout: 'grid' | 'featured') => void;
}

export const DashboardCustomizeModal: React.FC<Props> = ({ isOpen, onClose, widgets, setWidgets, layout, setLayout }) => {
    if (!isOpen) return null;

    const toggleWidget = (id: string) => {
        const newWidgets = widgets.includes(id)
            ? widgets.filter(wId => wId !== id)
            : [...widgets, id]; // Add new widgets to the end
        setWidgets(newWidgets);
        localStorage.setItem('fractal_dashboard_widgets', JSON.stringify(newWidgets));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Customize Dashboard</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Layout Selector */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Layout</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setLayout('grid')}
                                className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-colors ${layout === 'grid' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <LayoutGrid className={`w-10 h-10 mb-2 ${layout === 'grid' ? 'text-brand-600' : 'text-slate-400'}`} />
                                <span className="font-bold text-sm text-slate-700">Grid</span>
                            </button>
                            <button 
                                onClick={() => setLayout('featured')}
                                className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-colors ${layout === 'featured' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <Columns className={`w-10 h-10 mb-2 ${layout === 'featured' ? 'text-brand-600' : 'text-slate-400'}`} />
                                <span className="font-bold text-sm text-slate-700">Featured</span>
                            </button>
                        </div>
                    </div>

                    {/* Widget Selector */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Widgets</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.values(WIDGETS_CONFIG).map(config => (
                                <label key={config.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input 
                                        type="checkbox"
                                        checked={widgets.includes(config.id)}
                                        onChange={() => toggleWidget(config.id)}
                                        className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{config.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                    <button onClick={onClose} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold text-sm">Done</button>
                </div>
            </div>
        </div>
    );
};