import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Settings, MapPin, Shield, MousePointer2, X, Lock, Unlock, Printer, Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { useAppStore } from '@/store';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '@/shared/components/ConfirmModal';

export const TimetableEditor: React.FC = () => {
  const { schoolStructure, classes, setSchoolStructure, addToast } = useAppStore();
  
  // Timetable State
  const [selectedWeek, setSelectedWeek] = useState<'A' | 'B'>('A');
  const [activeMode, setActiveMode] = useState<'assign' | 'duty' | 'room'>('assign');
  const [assigningClassId, setAssigningClassId] = useState<string | null>(null);
  const [targetCount, setTargetCount] = useState(6);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [pendingClassId, setPendingClassId] = useState<string | null>(null);
  
  // Input Modal State (for Duty/Room)
  const [inputModal, setInputModal] = useState<{
      isOpen: boolean; type: 'duty' | 'room'; dayId: string; slotId: string; value: string; classId?: string;
  } | null>(null);
  const [applyToAll, setApplyToAll] = useState(false);
  
  // Overwrite Confirmation State
  const [overwriteTarget, setOverwriteTarget] = useState<{ dayId: string; slotId: string; existingClassName: string } | null>(null);

  // Helper: Get Class Color
  const getClassColor = (id: string) => {
    const colors = [
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
      'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // Helper: Count assignments for a class (Across entire cycle)
  const getAssignmentCount = (classId: string) => {
    if (!schoolStructure) return 0;
    let count = 0;
    schoolStructure.days.forEach(day => {
      day.slots.forEach(slot => {
        if (slot.classId === classId) count++;
      });
    });
    return count;
  };

  // Handler: Start Assignment Flow
  const handleClassClick = (classId: string) => {
    if (activeMode !== 'assign') {
        setActiveMode('assign');
        addToast('Switched to Assignment Mode', 'info');
    }

    if (assigningClassId === classId) {
      setAssigningClassId(null);
    } else {
      setPendingClassId(classId);
      // Default to existing count or 6 if 0
      const current = getAssignmentCount(classId);
      setTargetCount(current > 0 ? current : 6); 
      setIsTargetModalOpen(true);
    }
  };

  const confirmAssignmentStart = () => {
    if (pendingClassId) {
      setAssigningClassId(pendingClassId);
      setPendingClassId(null);
      setIsTargetModalOpen(false);
    }
  };

  // Handler: Apply Assignment
  const applyAssignment = (dayId: string, slotId: string) => {
    if (!assigningClassId || !schoolStructure) return;

    const newDays = schoolStructure.days.map(day => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        slots: day.slots.map(slot => {
          if (slot.id !== slotId) return slot;
          return { ...slot, classId: assigningClassId };
        })
      };
    });

    setSchoolStructure({ ...schoolStructure, days: newDays });
  };

  // Handler: Click Slot
  const handleSlotClick = (dayId: string, slotId: string, existingClassId?: string, slotType?: string) => {
    if (!schoolStructure) return;

    // --- DUTY MODE ---
    if (activeMode === 'duty') {
        const day = schoolStructure.days.find(d => d.id === dayId);
        const slot = day?.slots.find(s => s.id === slotId);
        if (slot) {
            setInputModal({
                isOpen: true,
                type: 'duty',
                dayId,
                slotId,
                value: slot.label || ''
            });
        }
        return;
    }

    // --- ROOM MODE ---
    if (activeMode === 'room') {
        const day = schoolStructure.days.find(d => d.id === dayId);
        const slot = day?.slots.find(s => s.id === slotId);
        // Allow rooming on any slot, but typically for classes
        if (slot && slot.classId) {
            setApplyToAll(false);
            setInputModal({
                isOpen: true,
                type: 'room',
                dayId,
                slotId,
                value: slot.room || '',
                classId: slot.classId
            });
        } else {
            addToast('Please select a class to assign a room.', 'info');
        }
        return;
    }

    // --- ASSIGN MODE ---
    if (!assigningClassId) return;

    // 1. If clicking same class -> Remove (Toggle off)
    if (existingClassId === assigningClassId) {
        const newDays = schoolStructure.days.map(day => {
            if (day.id !== dayId) return day;
            return {
                ...day,
                slots: day.slots.map(slot => (slot.id === slotId ? { ...slot, classId: undefined } : slot))
            };
        });
        setSchoolStructure({ ...schoolStructure, days: newDays });
        return;
    }

    // 2. If clicking different class -> Warn Overwrite
    if (existingClassId) {
        const existingClass = classes.find(c => c.id === existingClassId);
        setOverwriteTarget({ 
            dayId, 
            slotId, 
            existingClassName: existingClass?.name || 'Unknown Class' 
        });
        return;
    }

    // 3. If empty slot -> Check Limits
    const currentCount = getAssignmentCount(assigningClassId);
    if (currentCount >= targetCount) {
        addToast(`Target of ${targetCount} periods reached for this class. Increase target to add more.`, 'error');
        return;
    }

    // 4. Apply
    applyAssignment(dayId, slotId);
  };

  // Handler: Save Input (Duty/Room)
  const handleSaveInput = () => {
      if (!inputModal || !schoolStructure) return;
      
      const newDays = schoolStructure.days.map(day => {
          if (!applyToAll && day.id !== inputModal.dayId) return day;

          return {
              ...day,
              slots: day.slots.map(slot => {
                  if (applyToAll && inputModal.type === 'room' && inputModal.classId) {
                      if (slot.classId === inputModal.classId) return { ...slot, room: inputModal.value };
                      return slot;
                  }
                  if (slot.id !== inputModal.slotId) return slot;
                  return { ...slot, [inputModal.type === 'duty' ? 'label' : 'room']: inputModal.value };
              })
          };
      });

      setSchoolStructure({ ...schoolStructure, days: newDays });
      setInputModal(null);
  };

  // Handler: Toggle Lock
  const toggleLock = () => {
      if (!schoolStructure) return;
      setSchoolStructure({
          ...schoolStructure,
          isTimetableLocked: !schoolStructure.isTimetableLocked
      });
      // Reset modes when locking
      if (!schoolStructure.isTimetableLocked) {
          setActiveMode('assign');
          setAssigningClassId(null);
      }
  };

  // Helper: Normalize any date to the Monday of that week
  // This fixes the issue where selecting a Sunday causes Monday's schedule to appear on Sunday
  const getMondayOfTerm = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d); // Local midnight
      const day = date.getDay(); // 0=Sun, 1=Mon...
      const diff = day === 0 ? 1 : 1 - day; // If Sun(0)->+1, Mon(1)->0, Tue(2)->-1
      date.setDate(date.getDate() + diff);
      return date;
  };

  // Handler: Export CSV
  const handleExportCSV = () => {
      if (!schoolStructure?.termStartDate) {
          addToast("Please set a Term Start Date in Settings first.", 'error');
          return;
      }
      
      const startDate = getMondayOfTerm(schoolStructure.termStartDate);
      const duration = schoolStructure.termDurationWeeks || 10;
      const csvRows = [['Date', 'Day', 'Week', 'Start Time', 'End Time', 'Period', 'Activity', 'Room']];
      
      // Helper to format date YYYY-MM-DD
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      for (let w = 0; w < duration; w++) {
          const weekStart = new Date(startDate);
          weekStart.setDate(startDate.getDate() + (w * 7));
          
          // Determine Cycle Week (A or B)
          const isWeekB = w % 2 === 1;
          const currentCycleWeek = schoolStructure.cycle === 'Fortnightly' ? (isWeekB ? 'B' : 'A') : null;

          // Get days for this week type
          const weekDays = schoolStructure.days.filter(d => schoolStructure.cycle === 'Weekly' || d.week === currentCycleWeek);
          
          // Sort days to ensure Mon-Fri order
          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          weekDays.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

          weekDays.forEach(daySchedule => {
              const dayIndex = dayOrder.indexOf(daySchedule.day);
              if (dayIndex === -1) return;

              const currentDate = new Date(weekStart);
              // Adjust date based on day of week (assuming start date is Monday)
              currentDate.setDate(weekStart.getDate() + dayIndex);

              daySchedule.slots.forEach(slot => {
                  const assignedClass = classes.find(c => c.id === slot.classId);
                  
                  // Filter: Only include if it has a class assigned OR has a duty label
                  if (!assignedClass && !slot.label) return;

                  const activity = assignedClass ? assignedClass.name : slot.label;
                  
                  csvRows.push([
                      formatDate(currentDate),
                      daySchedule.day,
                      currentCycleWeek ? `Week ${currentCycleWeek}` : `Week ${w + 1}`,
                      slot.startTime,
                      slot.endTime,
                      slot.name,
                      `"${activity}"`, // Quote to handle commas
                      slot.room || ''
                  ]);
              });
          });
      }

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "timetable_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Handler: Export iCal
  const handleExportiCal = () => {
      if (!schoolStructure?.termStartDate) {
          addToast("Please set a Term Start Date in Settings first.", 'error');
          return;
      }
      
      const startDate = getMondayOfTerm(schoolStructure.termStartDate);
      const duration = schoolStructure.termDurationWeeks || 10;
      
      let icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//FractalEDU//Timetable//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH'
      ].join('\r\n');

      // Helper to format date for iCal: YYYYMMDDTHHMMSS (Floating time)
      const formatICalDate = (date: Date, timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const d = new Date(date);
          d.setHours(hours, minutes, 0, 0);
          
          const pad = (n: number) => n < 10 ? '0' + n : n;
          return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
      };

      for (let w = 0; w < duration; w++) {
          const weekStart = new Date(startDate);
          weekStart.setDate(startDate.getDate() + (w * 7));
          
          const isWeekB = w % 2 === 1;
          const currentCycleWeek = schoolStructure.cycle === 'Fortnightly' ? (isWeekB ? 'B' : 'A') : null;

          const weekDays = schoolStructure.days.filter(d => schoolStructure.cycle === 'Weekly' || d.week === currentCycleWeek);
          
          // Sort days to ensure Mon-Fri order
          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          weekDays.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

          weekDays.forEach(daySchedule => {
              const dayIndex = dayOrder.indexOf(daySchedule.day);
              if (dayIndex === -1) return;

              const currentDate = new Date(weekStart);
              currentDate.setDate(weekStart.getDate() + dayIndex);

              daySchedule.slots.forEach(slot => {
                  const assignedClass = classes.find(c => c.id === slot.classId);
                  if (!assignedClass && !slot.label) return;

                  const summary = assignedClass ? assignedClass.name : slot.label || 'Event';
                  const location = slot.room || '';
                  const description = assignedClass ? `${assignedClass.subject} - ${slot.name}` : slot.name;
                  
                  const dtStart = formatICalDate(currentDate, slot.startTime);
                  const dtEnd = formatICalDate(currentDate, slot.endTime);
                  const uid = `${slot.id}-${currentDate.toISOString().replace(/[^a-zA-Z0-9]/g, '')}@fractaledu.com`;

                  icsContent += '\r\n' + [
                      'BEGIN:VEVENT',
                      `UID:${uid}`,
                      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                      `DTSTART:${dtStart}`,
                      `DTEND:${dtEnd}`,
                      `SUMMARY:${summary}`,
                      `DESCRIPTION:${description}`,
                      `LOCATION:${location}`,
                      'END:VEVENT'
                  ].join('\r\n');
              });
          });
      }

      icsContent += '\r\nEND:VCALENDAR';

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "timetable.ics");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Filter days for view
  const visibleDays = useMemo(() => {
    if (!schoolStructure) return [];
    if (schoolStructure.cycle === 'Weekly') return schoolStructure.days;
    return schoolStructure.days.filter(d => d.week === selectedWeek);
  }, [schoolStructure, selectedWeek]);

  if (!schoolStructure || schoolStructure.days.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Timetable Not Configured</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Please set up your school structure (bell times) first.</p>
            <Link to="/management" className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Go to Settings
            </Link>
        </div>
      );
  }

  const isLocked = schoolStructure.isTimetableLocked;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        {/* LEFT: Class List */}
        {!isLocked && (
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4 animate-in slide-in-from-left duration-300">
            
            {/* Tools Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-xs uppercase tracking-wider">Editor Tools</h3>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => { setActiveMode('assign'); setAssigningClassId(null); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeMode === 'assign' ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        <MousePointer2 className="w-4 h-4" /> Assign Classes
                    </button>
                    <button 
                        onClick={() => { setActiveMode('duty'); setAssigningClassId(null); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeMode === 'duty' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        <Shield className="w-4 h-4" /> Add Duties
                    </button>
                    <button 
                        onClick={() => { setActiveMode('room'); setAssigningClassId(null); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeMode === 'room' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        <MapPin className="w-4 h-4" /> Set Rooms
                    </button>
                </div>
            </div>

            {/* Class List (Only visible/active in Assign mode, but kept visible for reference) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex-1 overflow-y-auto">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 text-sm uppercase tracking-wider">Your Classes</h3>
            <div className="space-y-2">
                {classes.map(cls => {
                const count = getAssignmentCount(cls.id);
                const isAssigning = assigningClassId === cls.id;
                
                return (
                    <button
                    key={cls.id}
                    onClick={() => activeMode === 'assign' ? handleClassClick(cls.id) : handleClassClick(cls.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isAssigning 
                        ? 'ring-2 ring-brand-500 border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 bg-slate-50 dark:bg-slate-800'
                    }`}
                    >
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{cls.name}</span>
                        {isAssigning && <span className="text-[10px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded">EDITING</span>}
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                        <span>{cls.subject}</span>
                        <span className={count > 0 ? 'text-brand-600 dark:text-brand-400 font-bold' : ''}>{count} slots</span>
                    </div>
                    </button>
                );
                })}
                {classes.length === 0 && <p className="text-sm text-slate-400 italic">No classes found.</p>}
            </div>
            </div>

            {assigningClassId && (
            <div className="bg-brand-600 text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold opacity-80 uppercase">Currently Assigning</p>
                    <p className="text-xs font-mono bg-white/20 px-1.5 rounded">
                        {getAssignmentCount(assigningClassId)} / {targetCount}
                    </p>
                </div>
                <p className="font-bold text-lg mb-2">{classes.find(c => c.id === assigningClassId)?.name}</p>
                <p className="text-sm opacity-90 mb-4">Click any period (including breaks) to assign.</p>
                <button 
                onClick={() => setAssigningClassId(null)}
                className="w-full py-2 bg-white text-brand-600 rounded-lg font-bold text-sm hover:bg-brand-50"
                >
                Done
                </button>
            </div>
            )}
        </div>
        )}

        {/* RIGHT: Timetable Grid */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Grid Header / Controls */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {schoolStructure.cycle === 'Fortnightly' ? `Week ${selectedWeek} Timetable` : 'Weekly Timetable'}
            </h3>
            
            {schoolStructure.cycle === 'Fortnightly' && (
                <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                <button 
                    onClick={() => setSelectedWeek('A')}
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${selectedWeek === 'A' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Week A
                </button>
                <button 
                    onClick={() => setSelectedWeek('B')}
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${selectedWeek === 'B' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Week B
                </button>
                </div>
            )}

            <div className="flex items-center gap-2">
                {isLocked && (
                    <>
                        <button onClick={() => window.print()} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Print Timetable">
                            <Printer className="w-5 h-5" />
                        </button>
                        <button onClick={handleExportCSV} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Export to CSV">
                            <FileSpreadsheet className="w-5 h-5" />
                        </button>
                        <button onClick={handleExportiCal} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Export to iCal">
                            <Calendar className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    </>
                )}
                
                <button 
                    onClick={toggleLock}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                        isLocked ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                    }`}
                >
                    {isLocked ? <><Unlock className="w-4 h-4" /> Unlock to Edit</> : <><Lock className="w-4 h-4" /> Save & Lock</>}
                </button>
            </div>
            </div>

            {/* The Grid */}
            <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-5 gap-4 min-w-[800px]">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(dayName => {
                const daySchedule = visibleDays.find(d => d.day === dayName);
                return (
                    <div key={dayName} className="flex flex-col gap-2">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950 text-center font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                        {dayName}
                    </div>
                    
                    {daySchedule?.slots.map((slot, idx) => {
                        const assignedClass = classes.find(c => c.id === slot.classId);
                        // Allow assignment to ANY slot type if in assignment mode
                        const isInteractive = !isLocked && (assigningClassId !== null || activeMode === 'duty' || activeMode === 'room'); 
                        
                        return (
                        <div 
                            key={idx}
                            onClick={() => isInteractive && handleSlotClick(daySchedule.id, slot.id, slot.classId, slot.type)}
                            className={`
                            relative p-2 rounded-lg border text-xs flex flex-col gap-1 min-h-[60px] transition-all
                            ${!isInteractive ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:scale-[1.02]'}
                            ${assignedClass 
                                ? getClassColor(assignedClass.id) 
                                : slot.type === 'Break' || slot.type === 'Admin' 
                                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                            }
                            ${assigningClassId && (slot.type === 'Teaching' || slot.type === 'Sport') ? 'ring-1 ring-brand-100 dark:ring-brand-900' : ''}
                            ${activeMode === 'duty' && (slot.type === 'Break' || slot.type === 'Admin') ? 'ring-1 ring-amber-300 dark:ring-amber-700 bg-amber-50/50' : ''}
                            ${activeMode === 'room' && assignedClass ? 'ring-1 ring-indigo-300 dark:ring-indigo-700' : ''}
                            `}
                        >
                            {slot.room && (
                                <div className="absolute top-1 right-1 text-[9px] font-bold bg-white/80 dark:bg-black/30 px-1 rounded text-slate-600 dark:text-slate-300 flex items-center gap-0.5 shadow-sm backdrop-blur-sm z-10">
                                    <MapPin className="w-2 h-2" /> {slot.room}
                                </div>
                            )}

                            <div className="flex items-center gap-2 opacity-70 text-[10px] font-mono">
                                <span>{slot.startTime}</span>
                                <span className="opacity-50">|</span>
                                <span>{slot.name}</span>
                            </div>
                            <div className="font-bold text-sm truncate">
                            {assignedClass ? assignedClass.name : slot.name}
                            </div>

                            {slot.label && (
                                <div className="mt-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/50 flex items-center gap-1 w-fit">
                                    <Shield className="w-2 h-2" /> {slot.label}
                                </div>
                            )}
                        </div>
                        );
                    })}
                    </div>
                );
                })}
            </div>
            </div>
        </div>

        {/* Target Count Modal */}
        {isTargetModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Assign Class</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                How many periods per cycle for <span className="font-bold text-brand-600">{classes.find(c => c.id === pendingClassId)?.name}</span>?
                </p>
                
                <div className="flex items-center justify-center gap-4 mb-6">
                <button onClick={() => setTargetCount(Math.max(1, targetCount - 1))} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 w-12 text-center">{targetCount}</span>
                <button onClick={() => setTargetCount(targetCount + 1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-5 h-5" /></button>
                </div>

                <div className="flex gap-3">
                <button 
                    onClick={() => setIsTargetModalOpen(false)}
                    className="flex-1 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                    Cancel
                </button>
                <button 
                    onClick={confirmAssignmentStart}
                    className="flex-1 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
                >
                    Start Assigning
                </button>
                </div>
            </div>
            </div>
        )}

        {/* Input Modal (Duty / Room) */}
        {inputModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            {inputModal.type === 'duty' ? <Shield className="w-5 h-5 text-amber-500" /> : <MapPin className="w-5 h-5 text-indigo-500" />}
                            {inputModal.type === 'duty' ? 'Add Duty' : 'Set Room'}
                        </h3>
                        <button onClick={() => setInputModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    
                    <input 
                        autoFocus
                        value={inputModal.value}
                        onChange={e => setInputModal({ ...inputModal, value: e.target.value })}
                        placeholder={inputModal.type === 'duty' ? "e.g. Playground A" : "e.g. Room 101"}
                        className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 mb-6 focus:ring-2 focus:ring-brand-500 outline-none"
                        onKeyDown={e => e.key === 'Enter' && handleSaveInput()}
                    />

                    {inputModal.type === 'room' && inputModal.classId && (
                        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                checked={applyToAll}
                                onChange={e => setApplyToAll(e.target.checked)}
                                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                Apply to all <strong>{classes.find(c => c.id === inputModal.classId)?.name}</strong> classes
                            </span>
                        </label>
                    )}

                    <button 
                        onClick={handleSaveInput}
                        className="w-full py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
                    >
                        Save
                    </button>
                </div>
            </div>
        )}

        {/* Overwrite Confirm Modal */}
        {overwriteTarget && (
            <ConfirmModal
                isOpen={!!overwriteTarget}
                title="Overwrite Class?"
                message={`This period is already assigned to ${overwriteTarget.existingClassName}. Do you want to replace it?`}
                confirmLabel="Overwrite"
                onClose={() => setOverwriteTarget(null)}
                onConfirm={() => {
                    applyAssignment(overwriteTarget.dayId, overwriteTarget.slotId);
                    setOverwriteTarget(null);
                }}
            />
        )}
    </div>
  );
};