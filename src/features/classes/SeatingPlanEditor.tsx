
import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { useAppStore } from '@/store';
import { ClassGroup, Student, SeatingPlan, EvidenceLogEntry } from '@/types';
import { DraggableStudent, DeskCell } from './components/SeatingComponents';
import { PublishPlanModal } from './PublishPlanModal';
import { Save, Plus, Trash2, Monitor, Shuffle, Palette, Edit2, Share, Grid as GridIcon, RotateCcw } from 'lucide-react';
import { ConfirmDialog, PromptDialog } from '@/shared/components/Dialogs';

interface Props { classGroup: ClassGroup; }

export const SeatingPlanEditor: React.FC<Props> = ({ classGroup }) => { 
    const { students, updateClass, addEvidence, addToast } = useAppStore(); 
    const [activePlanId, setActivePlanId] = useState(classGroup.activeSeatingPlanId || (classGroup.seatingPlans?.[0]?.id) || 'new');

    // Ensure plan exists
    const currentPlan = useMemo(() => {
        return classGroup.seatingPlans?.find(p => p.id === activePlanId) || { id: 'new', name: 'Default Plan', rows: 4, columns: 6, layout: [] };
    }, [classGroup.seatingPlans, activePlanId]);

    const [rows, setRows] = useState(currentPlan.rows);
    const [cols, setCols] = useState(currentPlan.columns);
    const [seatMap, setSeatMap] = useState<Record<string, string>>({}); 
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [showGenderColor, setShowGenderColor] = useState(false);
    const [frontOfRoom, setFrontOfRoom] = useState<'top' | 'bottom'>('top');
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

    // Dialog State
    const [dialog, setDialog] = useState<{ type: 'create'|'rename'|'delete'|'random'|null }>({ type: null });

    // Sync local state when plan changes
    useEffect(() => {
        const map: Record<string, string> = {};
        (currentPlan.layout || []).forEach(s => map[`${s.y}-${s.x}`] = s.studentId);
        setSeatMap(map);
        setRows(currentPlan.rows);
        setCols(currentPlan.columns);
    }, [currentPlan]);

    const classStudents = useMemo(() => students.filter(s => classGroup.studentIds.includes(s.id)), [students, classGroup]);
    const seatedIds = Object.values(seatMap);
    const unseatedStudents = classStudents.filter(s => !seatedIds.includes(s.id));
    const activeStudent = activeDragId ? students.find(s => s.id === activeDragId.split('::')[1]) : null;
    
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveDragId(null);
        if (!over) return;
        const sId = active.data.current?.studentId as string;
        const oldSeat = Object.keys(seatMap).find(k => seatMap[k] === sId);
        
        if (String(over.id).startsWith('seat-')) {
            const newSeat = String(over.id).replace('seat-', '');
            setSeatMap(prev => {
                const next = { ...prev };
                if (oldSeat) delete next[oldSeat];
                const existing = next[newSeat];
                if (existing && oldSeat) next[oldSeat] = existing; // Swap
                next[newSeat] = sId;
                return next;
            });
        } else if (over.id === 'unseated-zone' && oldSeat) {
            setSeatMap(prev => { const n = {...prev}; delete n[oldSeat]; return n; });
        }
    };

    const handleSave = () => {
        const layout = Object.entries(seatMap).map(([key, sId]) => {
            const [r, c] = key.split('-').map(Number);
            return { studentId: sId as string, x: c, y: r };
        });
        let newPlans = [...(classGroup.seatingPlans || [])];
        const planIndex = newPlans.findIndex(p => p.id === activePlanId);
        const planData: SeatingPlan = { 
            id: (activePlanId === 'new') ? crypto.randomUUID() : activePlanId, 
            name: currentPlan.name, 
            rows, 
            columns: cols, 
            layout 
        };
        
        if (planIndex >= 0) newPlans[planIndex] = planData; else newPlans.push(planData);
        
        updateClass(classGroup.id, { seatingPlans: newPlans, activeSeatingPlanId: planData.id });
        if(activePlanId === 'new') setActivePlanId(planData.id);
        addToast("Seating plan saved successfully.", "success");
    };

    // Actions executed by Dialogs
    const performCreatePlan = (name: string) => {
        const newPlan: SeatingPlan = { id: crypto.randomUUID(), name, rows: 4, columns: 6, layout: [] };
        updateClass(classGroup.id, { seatingPlans: [...(classGroup.seatingPlans || []), newPlan], activeSeatingPlanId: newPlan.id });
        setActivePlanId(newPlan.id);
        setDialog({ type: null });
        addToast("New plan created.", "success");
    };

    const performRenamePlan = (name: string) => {
        const newPlans = (classGroup.seatingPlans || []).map(p => p.id === activePlanId ? { ...p, name } : p);
        updateClass(classGroup.id, { seatingPlans: newPlans });
        setDialog({ type: null });
        addToast("Plan renamed.", "success");
    };

    const performDeletePlan = () => {
        const newPlans = classGroup.seatingPlans.filter(p => p.id !== activePlanId);
        updateClass(classGroup.id, {
            seatingPlans: newPlans,
            activeSeatingPlanId: newPlans.length > 0 ? newPlans[0].id : undefined
        });
        setActivePlanId(newPlans.length > 0 ? newPlans[0].id : 'new');
        setDialog({ type: null });
        addToast("Plan deleted.", "success");
    };

    const performRandomAssign = () => {
        const shuffled = [...classStudents].sort(() => 0.5 - Math.random());
        const newMap: Record<string, string> = {};
        let sIdx = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (sIdx < shuffled.length) {
                    newMap[`${r}-${c}`] = shuffled[sIdx].id;
                    sIdx++;
                }
            }
        }
        setSeatMap(newMap);
        setDialog({ type: null });
        addToast("Seating randomized.", "success");
    };

    // Trigger Handlers (Open Dialogs)
    const handleCreateTrigger = () => setDialog({ type: 'create' });
    
    const handleRenameTrigger = () => {
        if(activePlanId === 'new') return;
        setDialog({ type: 'rename' });
    };

    const handleDeleteTrigger = () => {
        if ((classGroup.seatingPlans || []).length <= 1 && activePlanId !== 'new') {
            addToast("Cannot delete the only plan.", "error");
            return;
        }
        if(activePlanId === 'new') return;
        setDialog({ type: 'delete' });
    };

    const handleRandomTrigger = () => setDialog({ type: 'random' });

    const handlePublish = (generalNote: string, studentNotes: Record<string, string>) => {
        Object.entries(seatMap).forEach(([seatKey, studentId]) => {
            const note = studentNotes[studentId as string] || generalNote;
            if (!note) return;
  
            const log: EvidenceLogEntry = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                type: 'SeatingPlan',
                content: `Seating Plan Update (${currentPlan.name}): ${note}`,
                author: 'Current Teacher'
            };
            addEvidence(studentId as string, log);
        });
        setIsPublishModalOpen(false);
        addToast("Seating plan published and evidence logged.", "success");
    };

    return (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveDragId(e.active.id as string)} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-full bg-slate-50">
                <div className="bg-white p-3 border-b border-slate-200 flex flex-wrap justify-between items-center shrink-0 gap-3">
                    
                    {/* Left: Plan Management */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <select 
                                value={activePlanId} 
                                onChange={(e) => setActivePlanId(e.target.value)} 
                                className="font-bold text-sm bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-3 outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                {(classGroup.seatingPlans || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                {(!classGroup.seatingPlans || classGroup.seatingPlans.length === 0) && <option value="new">Default Plan</option>}
                            </select>
                            <button onClick={handleRenameTrigger} disabled={activePlanId === 'new'} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-50" title="Rename"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={handleCreateTrigger} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="New Plan"><Plus className="w-4 h-4"/></button>
                            <button onClick={handleDeleteTrigger} disabled={activePlanId === 'new'} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 disabled:opacity-50" title="Delete Plan"><Trash2 className="w-4 h-4"/></button>
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-1"></div>

                        <div className="flex items-center gap-2">
                            <GridIcon className="w-4 h-4 text-slate-400" />
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                <input type="number" value={rows} onChange={e => setRows(Number(e.target.value))} className="w-8 bg-transparent text-center font-bold outline-none text-sm" />
                                <span className="text-slate-300 text-xs">x</span>
                                <input type="number" value={cols} onChange={e => setCols(Number(e.target.value))} className="w-8 bg-transparent text-center font-bold outline-none text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Visuals & Actions */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <button 
                                onClick={() => setShowGenderColor(!showGenderColor)}
                                className={`p-1.5 rounded ${showGenderColor ? 'bg-white shadow text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Toggle Gender Colors"
                            >
                                <Palette className="w-4 h-4"/> 
                            </button>
                            <button 
                                onClick={() => setFrontOfRoom(p => p === 'top' ? 'bottom' : 'top')} 
                                className={`p-1.5 rounded flex items-center gap-1 text-xs font-bold ${frontOfRoom === 'top' ? 'bg-white shadow text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Toggle Front of Room"
                            >
                                <Monitor className="w-4 h-4"/> {frontOfRoom==='top'?'Top':'Bot'}
                            </button>
                            <button 
                                onClick={handleRandomTrigger} 
                                className="p-1.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-white transition-all"
                                title="Randomly Assign"
                            >
                                <Shuffle className="w-4 h-4"/>
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                                <Save className="w-4 h-4"/> Save
                            </button>
                            <button onClick={() => setIsPublishModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-bold shadow-sm transition-colors">
                                <Share className="w-4 h-4" /> Publish
                            </button>
                        </div>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex overflow-hidden">
                    <UnseatedSidebar students={unseatedStudents} showGender={showGenderColor} />
                    
                    <div className="flex-1 overflow-auto bg-slate-100/50 p-8 flex flex-col items-center">
                        {frontOfRoom === 'top' && (
                            <div className="w-2/3 h-3 bg-slate-300 rounded-b-xl mb-8 shrink-0 relative shadow-inner">
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Front of Room (Board)</span>
                            </div>
                        )}
                        
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                            {Array.from({ length: rows }).map((_, r) => Array.from({ length: cols }).map((_, c) => {
                                const sId = seatMap[`${r}-${c}`];
                                const student = students.find(s => s.id === sId);
                                return <DeskCell key={`${r}-${c}`} row={r} col={c} student={student} showGender={showGenderColor} />;
                            }))}
                        </div>
                        
                        {frontOfRoom === 'bottom' && (
                            <div className="w-2/3 h-3 bg-slate-300 rounded-t-xl mt-8 shrink-0 relative shadow-inner">
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Front of Room (Board)</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <DragOverlay>
                    {activeStudent ? (
                        <div className="w-28 opacity-90 rotate-2">
                            <DraggableStudent 
                                student={activeStudent} 
                                id="overlay" 
                                isOverlay 
                                showGender={showGenderColor} 
                            />
                        </div>
                    ) : null}
                </DragOverlay>

                <PublishPlanModal 
                    isOpen={isPublishModalOpen}
                    onClose={() => setIsPublishModalOpen(false)}
                    onConfirm={handlePublish}
                    seatedStudents={classStudents.filter(s => seatedIds.includes(s.id))}
                    planName={currentPlan.name}
                />

                {/* Dialogs */}
                <PromptDialog 
                    isOpen={dialog.type === 'create'} 
                    title="Create New Plan" 
                    placeholder="Plan Name (e.g. Lab Seating)"
                    onConfirm={performCreatePlan} 
                    onCancel={() => setDialog({ type: null })} 
                />
                <PromptDialog 
                    isOpen={dialog.type === 'rename'} 
                    title="Rename Plan" 
                    defaultValue={currentPlan.name} 
                    onConfirm={performRenamePlan} 
                    onCancel={() => setDialog({ type: null })} 
                />
                <ConfirmDialog 
                    isOpen={dialog.type === 'delete'} 
                    title="Delete Plan" 
                    message={`Are you sure you want to delete "${currentPlan.name}"?`} 
                    onConfirm={performDeletePlan} 
                    onCancel={() => setDialog({ type: null })} 
                />
                <ConfirmDialog 
                    isOpen={dialog.type === 'random'} 
                    title="Randomize Seating" 
                    message="This will reshuffle all students in the class. Current arrangement will be lost unless saved." 
                    onConfirm={performRandomAssign} 
                    onCancel={() => setDialog({ type: null })} 
                />
            </div>
        </DndContext>
    );
};

const UnseatedSidebar: React.FC<{ students: Student[], showGender?: boolean }> = ({ students, showGender }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: 'unseated-zone',
    });

    return (
        <div 
            ref={setNodeRef}
            className={`w-56 bg-white border-r border-slate-200 flex flex-col transition-colors ${isOver ? 'bg-slate-50' : ''} shrink-0`}
        >
            <div className="p-4 border-b border-slate-100 bg-white">
                <h4 className="font-bold text-slate-700 text-sm flex items-center justify-between">
                    Unseated 
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{students.length}</span>
                </h4>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {students.map(student => (
                    <div key={student.id} className="h-16">
                        <DraggableStudent 
                            student={student} 
                            id={`list-${student.id}`} 
                            showGender={showGender} 
                        />
                    </div>
                ))}
                {students.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                        All students seated.
                    </div>
                )}
            </div>
        </div>
    );
};
