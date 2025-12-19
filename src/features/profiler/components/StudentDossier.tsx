
import React, { useState, useEffect } from 'react';
import { X, User, FileText, Brain, GraduationCap, ArrowRight, Plus, Edit2 } from 'lucide-react';
import { Student, EvidenceLogEntry } from '@/types';
import { useAppStore } from '@/store';
import { ProfileSnapshot } from './dossier/ProfileSnapshot';
import { NeedsAdjustments } from './dossier/NeedsAdjustments';
import { EvidenceFeed } from './dossier/EvidenceFeed';
import { AcademicProfile } from './dossier/AcademicProfile';
import { AddEvidenceModal } from '../AddEvidenceModal';
import { EditProfileModal } from './EditProfileModal';

interface Props {
    student: Student;
    onClose: () => void;
}

export const StudentDossier: React.FC<Props> = ({ student, onClose }) => {
    const { addEvidence, students } = useAppStore();
    const [activeTab, setActiveTab] = useState<'snapshot' | 'needs' | 'evidence' | 'academic'>('snapshot');
    const [isVisible, setIsVisible] = useState(false);
    const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    
    const [evidenceInitialStrategy, setEvidenceInitialStrategy] = useState<string | undefined>(undefined);

    // Sync from store to ensure updates reflect immediately
    const currentStudent = students.find(s => s.id === student?.id) || student;

    useEffect(() => {
        setIsVisible(true);
        const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && handleClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const handleSaveEvidence = (log: EvidenceLogEntry) => {
        if (!currentStudent) return;
        addEvidence(currentStudent.id, log);
    };

    const handleOpenEvidenceWithStrategy = (strategy: string) => {
        setEvidenceInitialStrategy(strategy);
        setIsAddEvidenceOpen(true);
    };

    const handleOpenEvidenceGeneral = () => {
        setEvidenceInitialStrategy(undefined);
        setIsAddEvidenceOpen(true);
    };

    if (!currentStudent) return null;

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            <div 
                className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
                onClick={handleClose} 
            />
            
            <div 
                className={`
                    relative w-full md:w-[90%] lg:w-[1100px] bg-slate-50 h-full shadow-2xl flex flex-col border-l border-slate-200
                    transition-transform duration-300 ease-out transform
                    ${isVisible ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-start shrink-0 z-10">
                    <div className="flex gap-6 items-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center text-3xl font-bold text-indigo-600 border-4 border-white shadow-md ring-1 ring-slate-100 overflow-hidden">
                            {currentStudent.profile?.photoUrl ? (
                                <img src={currentStudent.profile.photoUrl} alt={currentStudent.name} className="w-full h-full object-cover" />
                            ) : (
                                getInitials(currentStudent.name)
                            )}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{currentStudent.name}</h2>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded uppercase tracking-wide border border-slate-200">
                                    {currentStudent.cohort}
                                </span>
                                {(currentStudent.isAtsi || currentStudent.profile?.isAtsi) && (
                                    <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded uppercase tracking-wide border border-red-200">
                                        ATSI
                                    </span>
                                )}
                                {currentStudent.nccd?.active && (
                                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded uppercase tracking-wide border border-blue-200 flex items-center gap-1">
                                        NCCD: {currentStudent.nccd.level}
                                    </span>
                                )}
                                {currentStudent.profile?.eald && (
                                    <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded uppercase tracking-wide border border-yellow-200">
                                        EALD
                                    </span>
                                )}
                                {currentStudent.profile?.hasSpecificLearningNeeds && (
                                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded uppercase tracking-wide border border-indigo-200">
                                        Learning Needs
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsEditProfileOpen(true)} 
                            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            <Edit2 className="w-4 h-4" /> Edit Profile
                        </button>

                        <button 
                            onClick={handleOpenEvidenceGeneral}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Evidence
                        </button>
                        
                        <button 
                            onClick={handleClose} 
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors group"
                        >
                            <X className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Body Layout */}
                <div className="flex-1 flex overflow-hidden">
                    <nav className="w-64 bg-white border-r border-slate-200 flex flex-col py-6 shrink-0">
                        {[
                            { id: 'snapshot', label: 'Snapshot', icon: User, desc: 'Overview & Strategies' },
                            { id: 'needs', label: 'Needs & Adjustments', icon: Brain, desc: 'NCCD & Flags' },
                            { id: 'academic', label: 'Academic Data', icon: GraduationCap, desc: 'Reports & Growth' },
                            { id: 'evidence', label: 'Evidence Log', icon: FileText, desc: 'Observations & Files' },
                        ].map(tab => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                        flex items-center gap-4 px-6 py-4 text-left transition-all relative group
                                        ${isActive ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}
                                    `}
                                >
                                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />}
                                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 group-hover:bg-white group-hover:text-slate-600 shadow-sm'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold ${isActive ? 'text-indigo-900' : 'text-slate-600'}`}>
                                            {tab.label}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">{tab.desc}</div>
                                    </div>
                                    {isActive && <ArrowRight className="w-4 h-4 text-indigo-400 ml-auto" />}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8 md:p-12 relative">
                        <button 
                            onClick={handleOpenEvidenceGeneral}
                            className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center z-20"
                        >
                            <Plus className="w-6 h-6" />
                        </button>

                        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {activeTab === 'snapshot' && <ProfileSnapshot student={currentStudent} onEdit={() => setIsEditProfileOpen(true)} />}
                            {activeTab === 'needs' && <NeedsAdjustments student={currentStudent} onAddEvidence={handleOpenEvidenceWithStrategy} />}
                            {activeTab === 'evidence' && <EvidenceFeed student={currentStudent} />}
                            {activeTab === 'academic' && <AcademicProfile student={currentStudent} />}
                        </div>
                    </div>
                </div>
            </div>

            {isAddEvidenceOpen && (
                <AddEvidenceModal 
                    student={currentStudent}
                    onClose={() => setIsAddEvidenceOpen(false)}
                    onSave={handleSaveEvidence}
                    initialStrategy={evidenceInitialStrategy}
                />
            )}

            {isEditProfileOpen && (
                <EditProfileModal 
                    student={currentStudent}
                    onClose={() => setIsEditProfileOpen(false)}
                />
            )}
        </div>
    );
};
