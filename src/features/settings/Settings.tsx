
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { useTheme } from '../../context/ThemeContext';
import { UserPlus, Layout, Trash2, Database, Save, Upload, User, Users, Server, RotateCw, Mail, School, BookOpen, Briefcase, Cloud, RefreshCw, Link as LinkIcon, Download, Sun, Moon, Monitor, FileText, PenTool, Edit3, Image as ImageIcon, Eraser, Clock, CalendarRange, Plus, Minus, Edit2, X, ArrowDown, ArrowUp } from 'lucide-react';
import { AddStudentModal } from '../admin/AddStudentModal';
import { CreateClassModal } from '../admin/CreateClassModal';
import { ManageStudentsModal } from '../admin/ManageStudentsModal';
import { ClassAdminModal } from '../admin/ClassAdminModal';
import { RolloverModal } from '../admin/RolloverModal';
import { ImportChoiceModal } from './components/ImportChoiceModal';
import { ReviewModal } from './components/ReviewModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { storageService } from '@/services/storageService';
import { fileSystemSync } from '@/services/fileSystemSync';
import { ReviewPackage, Student, ClassGroup, MonitoringDoc, BackupFile, WellbeingStatus, SupportLevel, SchoolStructure, DaySchedule, TimeSlot, PeriodType } from '@/types';
import { useAutoSync } from '@/hooks/useAutoSync';

type Tab = 'Profile' | 'Structure' | 'Students' | 'Classes' | 'System';

export const Settings: React.FC = () => {
  const { 
      reset, 
      replaceAllData, 
      students, 
      classes, 
      exams, 
      results,
      rapidTests,
      rapidResults,
      monitoringDocs,
      teacherProfile,
      setTeacherProfile,
      addStudent,
      updateMonitoringDoc,
      addToast,
      schoolStructure: savedStructure, setSchoolStructure: saveStructure
  } = useAppStore();

  const { theme, setTheme } = useTheme();
  const { isConnected } = useAutoSync();

  const [activeTab, setActiveTab] = useState<Tab>(() => teacherProfile?.name ? 'Structure' : 'Profile');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modal States
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isClassAdminOpen, setIsClassAdminOpen] = useState(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);
  
  const [importChoicePackage, setImportChoicePackage] = useState<{ type: 'review' | 'students' | 'backup'; data: any } | null>(null);
  const [reviewPackage, setReviewPackage] = useState<ReviewPackage | null>(null);
  
  // Custom Confirm State
  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean } | null>(null);

  // Sync State
  const [syncHandle, setSyncHandle] = useState<any>(null);

  // Local Profile State
  const [profileData, setProfileData] = useState({
      title: teacherProfile?.title || '',
      name: teacherProfile?.name || '',
      email: teacherProfile?.email || '',
      role: teacherProfile?.role || '',
      faculty: teacherProfile?.faculty || 'Science',
      schoolName: teacherProfile?.schoolName || '',
      signature: teacherProfile?.signature || ''
  });

  // Signature Canvas State
  const [signatureMode, setSignatureMode] = useState<'upload' | 'draw'>('upload');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // --- School Structure State ---
  // Initialize from store if available, otherwise default
  const [schoolStructure, setSchoolStructure] = useState<SchoolStructure>(savedStructure || {
      cycle: 'Fortnightly',
      days: []
  });

  // Keep local state in sync if store updates (e.g. after a cloud pull)
  useEffect(() => {
      if (savedStructure) setSchoolStructure(savedStructure);
  }, [savedStructure]);

  // Wizard State
  const [wizPeriods, setWizPeriods] = useState(5);
  const [wizDuration, setWizDuration] = useState(60);
  const [wizStartTime, setWizStartTime] = useState("08:55");
  const [wizRollCallDuration, setWizRollCallDuration] = useState(10);
  const [editingDay, setEditingDay] = useState<DaySchedule | null>(null);
  const [wizBreaks, setWizBreaks] = useState<{name: string, duration: number, afterPeriod: number}[]>([
      { name: 'Recess', duration: 25, afterPeriod: 2 },
      { name: 'Lunch 1', duration: 25, afterPeriod: 4 },
      { name: 'Lunch 2', duration: 25, afterPeriod: 4 }
  ]);

  // Sync state if store updates externally
  useEffect(() => {
      if (teacherProfile) {
          setProfileData(prev => ({
              ...prev,
              title: teacherProfile.title || '',
              name: teacherProfile.name || '',
              email: teacherProfile.email || '',
              role: teacherProfile.role || '',
              faculty: teacherProfile.faculty || 'Science',
              schoolName: teacherProfile.schoolName || '',
              signature: teacherProfile.signature || ''
          }));
      }
  }, [teacherProfile]);

  // Sync local handle state with global service state
  useEffect(() => {
      if (isConnected && !syncHandle) {
          // @ts-ignore
          const globalHandle = fileSystemSync.getHandle ? fileSystemSync.getHandle() : null;
          if (globalHandle) setSyncHandle(globalHandle);
      }
  }, [isConnected, syncHandle]);

  // --- Handlers ---

  const handleSaveProfile = () => {
      setTeacherProfile(profileData);
      addToast('Teacher profile updated successfully.', 'success');
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 500000) {
          addToast('File too large. Please use a smaller image (< 500KB).', 'error');
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setProfileData(prev => ({ ...prev, signature: base64 }));
      };
      reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
      setProfileData(prev => ({ ...prev, signature: '' }));
  };

  // --- Canvas Drawing Logic ---
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    // Check for touch vs mouse event
    if ('touches' in e.nativeEvent) {
        // Touch event
        const touch = e.nativeEvent.touches[0] || e.nativeEvent.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
    } else {
        // Mouse event
        const mouse = e.nativeEvent as MouseEvent;
        clientX = mouse.clientX;
        clientY = mouse.clientY;
    }

    return { 
        x: (clientX - rect.left) * scaleX, 
        y: (clientY - rect.top) * scaleY 
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    // Prevent scrolling on touch devices
    if (e.type === 'touchmove') {
        e.preventDefault(); 
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if(canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveDrawing = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const base64 = canvas.toDataURL('image/png');
          setProfileData(prev => ({ ...prev, signature: base64 }));
          addToast('Signature drawing captured.', 'success');
      }
  };

  // Set up canvas context on mount/mode change
  useEffect(() => {
    if (signatureMode === 'draw' && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
        }
    }
  }, [signatureMode]);

  const handleExport = async () => {
    setIsProcessing(true);
    try {
        console.log("Starting export...");
        const files = await storageService.getAllFileContents();
        
        // Explicitly include ALL store data to prevent data loss
        const appData = { 
            teacherProfile, 
            students, 
            classes, 
            exams, 
            results, 
            rapidTests, 
            rapidResults, 
            monitoringDocs,
            schoolStructure: savedStructure // Include in Backup
        };
        
        const backup: BackupFile = { dataType: 'fullBackup', appData, files };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fractal_edu_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast('Full system backup exported successfully.', 'success');
    } catch (e) {
        console.error("Export failed:", e);
        addToast('Failed to export data. Check console for details.', 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  // --- MASTER IMPORT HANDLER ---
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
          if (file.name.endsWith('.csv')) {
              console.log("Parsing CSV...");
              const rows = text.split(/\r\n|\n/).filter(r => r.trim());
              const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
              
              const parsedStudents = rows.slice(1).map(row => {
                  const cols = row.split(',').map(c => c.trim());
                  const obj: any = {};
                  headers.forEach((h, i) => obj[h] = cols[i]);
                  
                  return {
                      name: `${obj.firstname || ''} ${obj.surname || obj.lastname || ''}`.trim() || obj.name,
                      cohort: obj.year || obj.cohort || obj.yeargroup || 'Year 7',
                      gender: obj.gender || obj.sex,
                      atsistatus: obj.atsistatus || obj.isatsi || obj.atsi || obj.indigenous,
                      email: obj.email
                  };
              });
              
              setImportChoicePackage({ type: 'students', data: parsedStudents });

          } else {
              console.log("Parsing JSON...");
              const json = JSON.parse(text);
              
              if (json.dataType === 'fullBackup') {
                  setImportChoicePackage({ type: 'backup', data: json });
              } else if (json.dataType === 'reviewPackage') {
                  setImportChoicePackage({ type: 'review', data: json });
              } else {
                  alert("Unknown file format. Please upload a valid Fractal EDU backup or CSV.");
              }
          }
      } catch (err) {
          console.error("Import Error:", err);
          addToast('Failed to parse file. It may be corrupt.', 'error');
      } finally {
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreBackup = async (json: any) => {
      setIsProcessing(true);
      setImportChoicePackage(null);
      try {
          console.log("Restoring files...");
          await storageService.clearFileContent();
          if (json.files) {
              for (const [id, content] of Object.entries(json.files)) {
                  await storageService.saveFileContent(id, content as string);
              }
          }
          
          console.log("Restoring application state...");
          const safeAppData = {
              ...json.appData,
              rapidTests: json.appData.rapidTests || [],
              rapidResults: json.appData.rapidResults || []
          };
          
          replaceAllData(safeAppData);
          addToast('System restored from backup successfully.', 'success');
      } catch (e) {
          console.error("Restore failed:", e);
          addToast('Failed to restore backup.', 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  const handleMergeStudents = (studentsToImport: any[]) => {
      let count = 0;
      studentsToImport.forEach(s => {
          const atsiRaw = String(s.atsistatus || '').toLowerCase().trim();
          const isAtsi = ['yes', 'y', 'true', '1'].includes(atsiRaw);

          let gender = String(s.gender || '').trim();
          if (gender.toLowerCase() === 'm') gender = 'Male';
          else if (gender.toLowerCase() === 'f') gender = 'Female';

          const newStudent: Student = {
              id: crypto.randomUUID(),
              name: s.name,
              cohort: s.cohort.includes('Year') ? s.cohort : `Year ${s.cohort.replace(/\D/g, '')}`,
              wellbeing: { status: WellbeingStatus.GREEN, notes: '', lastUpdated: new Date().toISOString() },
              support: { level: SupportLevel.NONE, needs: [], strategies: [] },
              isAtsi: isAtsi, 
              evidenceLog: [],
              profile: {
                  gender: gender,
                  isAtsi: isAtsi,
                  email: s.email
              }
          };
          addStudent(newStudent);
          count++;
      });
      addToast(`Successfully imported ${count} students.`, 'success');
  };

  const handleReviewPackage = (pkg: ReviewPackage) => {
      setReviewPackage(pkg);
      setImportChoicePackage(null);
  };

  const handleMergePackage = (pkg: ReviewPackage) => {
      const existing = monitoringDocs.find(d => d.classId === pkg.classGroup.id);
      if (existing) {
          updateMonitoringDoc(existing.id, pkg.monitoringDoc);
          addToast('Monitoring document updated from package.', 'success');
      } else {
          addToast('No matching class found for this review package.', 'error');
      }
      setImportChoicePackage(null);
  };

  const handleReset = () => {
      setConfirmAction({
          isOpen: true,
          title: "Factory Reset",
          message: "Are you sure? This will delete ALL data locally. This cannot be undone.",
          isDanger: true,
          onConfirm: () => {
              reset();
              storageService.clearFileContent();
              window.location.reload();
          }
      });
  };

  const handleConnectSync = async () => {
      try {
          const handle = await fileSystemSync.connectFolder();
          setSyncHandle(handle);
          addToast(`Connected to folder: ${handle.name}`, 'success');
      } catch (err: any) {
          console.error(err);
          addToast(err.message || 'Failed to connect folder.', 'error');
      }
  };

  const handleSyncUp = async () => {
      if (!syncHandle && !isConnected) return;
      setIsProcessing(true);
      try {
          const appData = { teacherProfile, students, classes, exams, results, rapidTests, rapidResults, monitoringDocs, schoolStructure: savedStructure };
          await fileSystemSync.syncUp(syncHandle || undefined, appData);
          addToast('Synced UP to local folder successfully.', 'success');
      } catch (err: any) {
          console.error(err);
          addToast('Sync Up failed.', 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  const handleSyncDown = async () => {
      if (!syncHandle && !isConnected) return;
      
      setConfirmAction({
          isOpen: true,
          title: "Confirm Cloud Pull",
          message: "This will OVERWRITE your current app data with data from the folder. Continue?",
          isDanger: true,
          onConfirm: async () => {
              setIsProcessing(true);
              try {
                  const { appData, files } = await fileSystemSync.syncDown(syncHandle || undefined);
                  
                  await storageService.clearFileContent();
                  if (files) {
                      for (const [name, content] of Object.entries(files)) {
                          await storageService.saveFileContent(name, content); 
                      }
                  }

                  replaceAllData(appData);
                  addToast('Synced DOWN from local folder successfully.', 'success');
              } catch (err: any) {
                  console.error(err);
                  addToast(err.message || 'Sync Down failed.', 'error');
              } finally {
                  setIsProcessing(false);
              }
          }
      });
  };

  // --- Helper: Sort Breaks ---
  const handleUpdateBreak = (index: number, field: string, value: any) => {
      const newBreaks = [...wizBreaks];
      newBreaks[index] = { ...newBreaks[index], [field]: value };
      setWizBreaks(newBreaks.sort((a, b) => a.afterPeriod - b.afterPeriod));
  };

  // --- Structure Generator Logic ---
  const addMinutes = (time: string, mins: number): string => {
      const [h, m] = time.split(':').map(Number);
      const totalMins = h * 60 + m + mins;
      const newH = Math.floor(totalMins / 60) % 24;
      const newM = totalMins % 60;
      return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  const generateStructure = () => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const weeks = schoolStructure.cycle === 'Fortnightly' ? ['A', 'B'] : ['A'];
      
      // Ensure breaks are sorted for correct insertion
      const sortedBreaks = [...wizBreaks].sort((a, b) => a.afterPeriod - b.afterPeriod);
      
      const newDays: DaySchedule[] = [];

      weeks.forEach(week => {
          days.forEach(day => {
              const slots: TimeSlot[] = [];
              let currentTime = wizStartTime;

              // Add Before School Buffer
              const beforeSchoolStart = addMinutes(currentTime, -30);
              slots.push({
                  id: crypto.randomUUID(),
                  name: 'Before School',
                  type: 'Admin',
                  startTime: beforeSchoolStart,
                  endTime: currentTime,
                  duration: 30
              });

              // Add Roll Call
              if (wizRollCallDuration > 0) {
                  slots.push({
                      id: crypto.randomUUID(),
                      name: 'Roll Call',
                      type: 'RollCall',
                      startTime: currentTime,
                      endTime: addMinutes(currentTime, wizRollCallDuration),
                      duration: wizRollCallDuration
                  });
                  currentTime = addMinutes(currentTime, wizRollCallDuration);
              }

              for (let i = 1; i <= wizPeriods; i++) {
                  // Add Period
                  const endTime = addMinutes(currentTime, wizDuration);
                  slots.push({
                      id: crypto.randomUUID(),
                      name: `Period ${i}`,
                      type: 'Teaching',
                      startTime: currentTime,
                      endTime: endTime,
                      duration: wizDuration
                  });
                  currentTime = endTime;

                  // Check for Break
                  // Use filter to allow multiple breaks after same period (e.g. split lunch)
                  const breaksHere = sortedBreaks.filter(b => b.afterPeriod === i);
                  breaksHere.forEach(breakRule => {
                      const breakEnd = addMinutes(currentTime, breakRule.duration);
                      slots.push({
                          id: crypto.randomUUID(),
                          name: breakRule.name,
                          type: 'Break',
                          startTime: currentTime,
                          endTime: breakEnd,
                          duration: breakRule.duration
                      });
                      currentTime = breakEnd;
                  });
              }

              // Add After School Buffer
              const afterSchoolEnd = addMinutes(currentTime, 30);
              slots.push({
                  id: crypto.randomUUID(),
                  name: 'After School',
                  type: 'Admin',
                  startTime: currentTime,
                  endTime: afterSchoolEnd,
                  duration: 30
              });

              newDays.push({
                  id: crypto.randomUUID(),
                  day,
                  week: schoolStructure.cycle === 'Fortnightly' ? (week as 'A' | 'B') : null,
                  slots
              });
          });
      });

      setSchoolStructure(prev => ({ ...prev, days: newDays }));
      addToast('Timetable structure generated successfully.', 'success');
  };

  const handleSaveStructure = () => {
      if (saveStructure) {
          saveStructure(schoolStructure);
      } else {
          console.warn("Store action 'setSchoolStructure' not found. Please update store.ts");
      }
      addToast('School structure saved to system.', 'success');
  };

  // --- Day Editor Logic ---
  const handleDayEditSave = () => {
      if (!editingDay) return;
      setSchoolStructure(prev => ({
          ...prev,
          days: prev.days.map(d => d.id === editingDay.id ? editingDay : d)
      }));
      setEditingDay(null);
      addToast('Day schedule updated.', 'success');
  };

  const updateDaySlot = (index: number, field: keyof TimeSlot, value: any) => {
      if (!editingDay) return;
      const newSlots = [...editingDay.slots];
      
      // Update the specific field
      newSlots[index] = { ...newSlots[index], [field]: value };
      
      // Recalculate all subsequent times based on durations
      // We assume the day starts at the same time as the first slot originally did
      let currentTime = newSlots[0].startTime;
      
      for (let i = 0; i < newSlots.length; i++) {
          newSlots[i].startTime = currentTime;
          newSlots[i].endTime = addMinutes(currentTime, newSlots[i].duration);
          currentTime = newSlots[i].endTime;
      }
      
      setEditingDay({ ...editingDay, slots: newSlots });
  };

  const TabButton = ({ id, icon: Icon, label }: any) => (
      <button 
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === id ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
      >
          <Icon className="w-4 h-4" /> {label}
      </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Management Console</h2>
            <p className="text-slate-500 dark:text-slate-400">Configure your profile, manage cohorts, and system data.</p>
          </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <TabButton id="Profile" icon={User} label="My Profile" />
              <TabButton id="Structure" icon={CalendarRange} label="School Structure" />
              <TabButton id="Students" icon={Users} label="Students" />
              <TabButton id="Classes" icon={Layout} label="Classes" />
              <TabButton id="System" icon={Server} label="System" />
          </div>

          <div className="p-8 flex-1 overflow-y-auto">
              
              {/* PROFILE TAB */}
              {activeTab === 'Profile' && (
                  <div className="max-w-2xl space-y-6 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                              <div className="relative">
                                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                  <select 
                                      value={profileData.title}
                                      onChange={e => setProfileData({...profileData, title: e.target.value})}
                                      className="w-full pl-10 p-2 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                  >
                                      <option value="">Select...</option>
                                      <option value="Mr">Mr</option>
                                      <option value="Ms">Ms</option>
                                      <option value="Mrs">Mrs</option>
                                      <option value="Dr">Dr</option>
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                              <input 
                                  value={profileData.name}
                                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                                  className="w-full p-2 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                              <input 
                                  value={profileData.email}
                                  onChange={e => setProfileData({...profileData, email: e.target.value})}
                                  className="w-full pl-10 p-2 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                              <div className="relative">
                                  <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                  <input 
                                      value={profileData.role}
                                      onChange={e => setProfileData({...profileData, role: e.target.value})}
                                      className="w-full pl-10 p-2 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                      placeholder="e.g. Teacher"
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Faculty</label>
                              <div className="relative">
                                  <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                  <select 
                                      value={profileData.faculty}
                                      onChange={e => setProfileData({...profileData, faculty: e.target.value})}
                                      className="w-full pl-10 p-2 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                  >
                                      <option value="Science">Science</option>
                                      <option value="Mathematics">Mathematics</option>
                                      <option value="English">English</option>
                                      <option value="HSIE">HSIE</option>
                                      <option value="PDHPE">PDHPE</option>
                                      <option value="TAS">TAS</option>
                                      <option value="CAPA">CAPA</option>
                                  </select>
                              </div>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">School Name</label>
                          <div className="relative">
                              <School className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                              <input 
                                  value={profileData.schoolName}
                                  onChange={e => setProfileData({...profileData, schoolName: e.target.value})}
                                  className="w-full pl-10 p-2 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                              />
                          </div>
                      </div>

                      {/* Signature Section */}
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                              <PenTool className="w-4 h-4" /> Digital Signature
                          </label>
                          
                          {/* Toggle Controls */}
                          <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-fit">
                              <button 
                                  onClick={() => setSignatureMode('upload')}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                      signatureMode === 'upload' 
                                      ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                  }`}
                              >
                                  <Upload className="w-3 h-3" /> Upload File
                              </button>
                              <button 
                                  onClick={() => setSignatureMode('draw')}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                      signatureMode === 'draw' 
                                      ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                  }`}
                              >
                                  <Edit3 className="w-3 h-3" /> Draw on Screen
                              </button>
                          </div>

                          {/* Preview Area */}
                          {profileData.signature && (
                              <div className="mb-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <ImageIcon className="w-4 h-4 text-slate-400" />
                                      <span className="text-xs font-medium text-slate-500">Current Signature Preview</span>
                                  </div>
                                  <div className="relative group bg-white p-1 border rounded">
                                      <img src={profileData.signature} alt="Signature Preview" className="h-10 w-auto mix-blend-multiply" />
                                      <button 
                                          onClick={handleRemoveSignature}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                          <Trash2 className="w-3 h-3" />
                                      </button>
                                  </div>
                              </div>
                          )}

                          {/* Content Area */}
                          {signatureMode === 'upload' ? (
                              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-center">
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Upload a scan of your signature (PNG/JPG, transparent recommended).</p>
                                  <button 
                                      onClick={() => signatureInputRef.current?.click()}
                                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                                  >
                                      Select Image File
                                  </button>
                                  <input 
                                      type="file" 
                                      ref={signatureInputRef}
                                      onChange={handleSignatureUpload}
                                      accept="image/png, image/jpeg" 
                                      className="hidden" 
                                  />
                              </div>
                          ) : (
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-300 dark:border-slate-600">
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                      <PenTool className="w-3 h-3" /> Draw clearly in the box below.
                                  </p>
                                  <canvas
                                      ref={canvasRef}
                                      width="400"
                                      height="150"
                                      className="border border-slate-200 rounded-lg bg-white w-full cursor-crosshair touch-none shadow-inner"
                                      onMouseDown={startDrawing}
                                      onMouseMove={draw}
                                      onMouseUp={stopDrawing}
                                      onMouseLeave={stopDrawing}
                                      onTouchStart={startDrawing}
                                      onTouchMove={draw}
                                      onTouchEnd={stopDrawing}
                                  />
                                  <div className="flex justify-end gap-2 mt-2">
                                      <button 
                                          onClick={clearCanvas}
                                          className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-1"
                                      >
                                          <Eraser className="w-3 h-3" /> Clear
                                      </button>
                                      <button 
                                          onClick={saveDrawing}
                                          className="px-3 py-1.5 bg-brand-600 text-white rounded text-xs font-bold hover:bg-brand-700 flex items-center gap-1"
                                      >
                                          <Save className="w-3 h-3" /> Save Drawing
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="pt-4">
                          <button onClick={handleSaveProfile} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold shadow-sm flex items-center gap-2">
                              <Save className="w-4 h-4" /> Save Profile
                          </button>
                      </div>
                  </div>
              )}

              {/* SCHOOL STRUCTURE TAB */}
              {activeTab === 'Structure' && (
                  <div className="space-y-8 animate-in fade-in max-w-5xl">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          
                          {/* Configuration Wizard */}
                          <div className="lg:col-span-1 space-y-6">
                              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                      <Clock className="w-5 h-5 text-brand-600" /> Setup Wizard
                                  </h3>
                                  
                                  <div className="space-y-4">
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Timetable Cycle</label>
                                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                              <button 
                                                  onClick={() => setSchoolStructure(s => ({ ...s, cycle: 'Weekly' }))}
                                                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${schoolStructure.cycle === 'Weekly' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}
                                              >
                                                  Weekly
                                              </button>
                                              <button 
                                                  onClick={() => setSchoolStructure(s => ({ ...s, cycle: 'Fortnightly' }))}
                                                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${schoolStructure.cycle === 'Fortnightly' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}
                                              >
                                                  Fortnightly
                                              </button>
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Term Start Date (Week A)</label>
                                              <input 
                                                  type="date" 
                                                  value={schoolStructure.termStartDate || ''}
                                                  onChange={e => setSchoolStructure(s => ({ ...s, termStartDate: e.target.value }))}
                                                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                              />
                                              <p className="text-[10px] text-slate-400 mt-1">Select the Monday of the first Week A.</p>
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Term Duration (Weeks)</label>
                                              <input 
                                                  type="number" 
                                                  value={schoolStructure.termDurationWeeks || 10}
                                                  onChange={e => setSchoolStructure(s => ({ ...s, termDurationWeeks: Number(e.target.value) }))}
                                                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                              />
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time</label>
                                              <input 
                                                  type="time" 
                                                  value={wizStartTime}
                                                  onChange={e => setWizStartTime(e.target.value)}
                                                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Roll Call (mins)</label>
                                              <input 
                                                  type="number" 
                                                  value={wizRollCallDuration}
                                                  onChange={e => setWizRollCallDuration(Number(e.target.value))}
                                                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Periods / Day</label>
                                              <input 
                                                  type="number" 
                                                  value={wizPeriods}
                                                  onChange={e => setWizPeriods(Number(e.target.value))}
                                                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                              />
                                          </div>
                                      </div>

                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Period Duration (mins)</label>
                                          <input 
                                              type="number" 
                                              value={wizDuration}
                                              onChange={e => setWizDuration(Number(e.target.value))}
                                              className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                          />
                                      </div>

                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Breaks</label>
                                          <div className="space-y-2">
                                              {wizBreaks.map((b, idx) => (
                                                  <div key={idx} className="grid grid-cols-12 gap-2 items-center text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 group">
                                                      <div className="col-span-4">
                                                          <input 
                                                              value={b.name}
                                                              onChange={e => handleUpdateBreak(idx, 'name', e.target.value)}
                                                              className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none w-full font-medium text-slate-700 dark:text-slate-200"
                                                              placeholder="Name"
                                                          />
                                                      </div>
                                                      <div className="col-span-3 flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                                          <input 
                                                              type="number"
                                                              value={b.duration}
                                                              onChange={e => handleUpdateBreak(idx, 'duration', Number(e.target.value))}
                                                              className="w-full text-center bg-transparent outline-none text-slate-500"
                                                          />
                                                          <span className="text-xs text-slate-400">m</span>
                                                      </div>
                                                      <div className="col-span-4">
                                                          <select 
                                                              value={b.afterPeriod} 
                                                              onChange={e => handleUpdateBreak(idx, 'afterPeriod', Number(e.target.value))}
                                                              className="w-full p-1 rounded border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 outline-none"
                                                          >
                                                              {Array.from({ length: wizPeriods }, (_, i) => i + 1).map(p => (
                                                                  <option key={p} value={p}>After Period {p}</option>
                                                              ))}
                                                          </select>
                                                      </div>
                                                      
                                                      <div className="col-span-1 flex justify-end">
                                                          <button 
                                                              onClick={() => setWizBreaks(wizBreaks.filter((_, i) => i !== idx))}
                                                              className="text-red-500 hover:bg-red-50 rounded p-1"
                                                          >
                                                              <Minus className="w-3 h-3" />
                                                          </button>
                                                      </div>
                                                  </div>
                                              ))}
                                              <div className="flex gap-2">
                                                  <button 
                                                      onClick={() => {
                                                          setWizBreaks([...wizBreaks, { name: 'New Break', duration: 25, afterPeriod: 1 }]);
                                                      }}
                                                      className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
                                                  >
                                                      <Plus className="w-3 h-3" /> Add Break
                                                  </button>
                                              </div>
                                          </div>
                                      </div>

                                      <button 
                                          onClick={generateStructure}
                                          className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                                      >
                                          <RefreshCw className="w-4 h-4" /> Generate Timetable
                                      </button>
                                  </div>
                              </div>
                          </div>

                          {/* Visualization */}
                          <div className="lg:col-span-2 space-y-6">
                              <div className="flex justify-between items-center">
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Structure Preview</h3>
                                  <button onClick={handleSaveStructure} className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-bold text-sm hover:bg-slate-800 flex items-center gap-2">
                                      <Save className="w-4 h-4" /> Save Configuration
                                  </button>
                              </div>

                              {schoolStructure.days.length === 0 ? (
                                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400">
                                      <CalendarRange className="w-12 h-12 mb-2 opacity-50" />
                                      <p>No structure generated yet.</p>
                                      <p className="text-sm">Use the wizard to create your bell times.</p>
                                  </div>
                              ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                      {schoolStructure.days.map(day => (
                                          <div key={day.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm">
                                              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                                  {day.week ? <span className="text-brand-600 dark:text-brand-400 mr-1">{day.week}</span> : ''}
                                                  <div className="flex justify-between items-center">
                                                      <span>{day.day.substring(0, 3)}</span>
                                                      <button onClick={() => setEditingDay(day)} className="text-slate-400 hover:text-brand-600"><Edit2 className="w-3 h-3" /></button>
                                                  </div>
                                              </div>
                                              <div className="space-y-1">
                                                  {day.slots.map((slot, i) => (
                                                      <div key={i} className={`text-xs p-1.5 rounded flex justify-between ${slot.type === 'Break' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : slot.type === 'RollCall' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' : slot.type === 'Sport' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                                          <span className="font-medium truncate">{slot.name}</span>
                                                          <span className="opacity-75">{slot.startTime}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}

              {/* STUDENTS TAB - CLASSIC RESTORATION */}
              {activeTab === 'Students' && (
                  <div className="space-y-6 animate-in fade-in max-w-4xl">
                      <div className="flex gap-4">
                          <button 
                              onClick={() => setIsAddStudentOpen(true)}
                              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm font-medium transition-colors"
                          >
                              <UserPlus className="w-5 h-5" /> Enrol New Student
                          </button>
                          <button 
                              onClick={() => setIsManageStudentsOpen(true)}
                              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
                          >
                              <Users className="w-5 h-5" /> Manage All Students
                          </button>
                      </div>

                      {/* Bulk Import Card */}
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                              <FileText className="w-5 h-5 text-slate-500" /> Bulk Import via CSV
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                              Import students from a spreadsheet. Required columns: Name, Cohort (e.g. "Year 7"), Email. Optional: Gender, ATSI.
                          </p>
                          <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 font-medium cursor-pointer transition-colors shadow-sm">
                              <Upload className="w-4 h-4" />
                              <span>Select CSV File</span>
                              <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  onChange={handleFileImport} 
                                  accept=".csv" 
                                  className="hidden"
                                  disabled={isProcessing}
                              />
                          </label>
                      </div>
                  </div>
              )}

              {/* CLASSES TAB - CLASSIC RESTORATION */}
              {activeTab === 'Classes' && (
                  <div className="space-y-6 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button 
                              onClick={() => setIsCreateClassOpen(true)}
                              className="p-6 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700/50 transition-all group"
                          >
                              <Layout className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                              <span className="font-bold">Create New Class</span>
                          </button>
                          <button 
                              onClick={() => setIsClassAdminOpen(true)}
                              className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                          >
                              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">{classes.length}</div>
                              <span className="text-sm">Active Classes</span>
                              <span className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-2">Manage & Archive &rarr;</span>
                          </button>
                      </div>
                      
                      {/* Simple List */}
                      {classes.length > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 max-w-2xl">
                              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Class List</h3>
                              <div className="space-y-2">
                                  {classes.map(c => (
                                      <div key={c.id} className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-sm flex justify-between">
                                          <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                                          <span className="text-slate-500 dark:text-slate-400">{c.studentIds.length} Students</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* SYSTEM TAB - RESTORED LAYOUT */}
              {activeTab === 'System' && (
                  <div className="space-y-8 animate-in fade-in max-w-3xl">
                      
                      {/* 1. Cloud Sync (Top) */}
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                  <Cloud className="w-6 h-6" />
                              </div>
                              <div>
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Local Cloud Sync</h3>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">Sync data to a local folder (e.g. OneDrive, Google Drive) or simulate in preview.</p>
                              </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-full ${isConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                          <LinkIcon className="w-5 h-5" />
                                      </div>
                                      <div>
                                          <div className={`font-bold ${isConnected ? 'text-green-700 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                              {isConnected ? 'Sync Active' : 'Not Connected'}
                                          </div>
                                          {isConnected && syncHandle?.name && (
                                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                  Location: <span className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{syncHandle.name}</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                                  <button 
                                      onClick={handleConnectSync}
                                      className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-colors"
                                  >
                                      {isConnected ? 'Change Folder' : 'Connect Folder'}
                                  </button>
                              </div>
                          </div>

                          <div className="flex gap-4">
                              <button 
                                  onClick={handleSyncUp}
                                  disabled={(!syncHandle && !isConnected) || isProcessing}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                              >
                                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                  Push to Cloud (Save)
                              </button>
                              <button 
                                  onClick={handleSyncDown}
                                  disabled={(!syncHandle && !isConnected) || isProcessing}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                              >
                                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                  Pull from Cloud (Load)
                              </button>
                          </div>
                      </div>

                      {/* 2. Annual Rollover (Middle) */}
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                  <RotateCw className="w-6 h-6" />
                              </div>
                              <div>
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Annual Rollover</h3>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">Promote cohorts and archive leaving students.</p>
                              </div>
                          </div>
                          <button 
                              onClick={() => setIsRolloverOpen(true)}
                              className="w-full px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 font-bold text-sm transition-colors"
                          >
                              Start Rollover Wizard
                          </button>
                      </div>

                      {/* 3. Manual Import/Export (Bottom) */}
                      <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                              <Database className="w-5 h-5 text-slate-500 dark:text-slate-400" /> Manual Import/Export
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                              <button 
                                  onClick={handleExport} 
                                  disabled={isProcessing}
                                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 font-medium transition-colors shadow-sm disabled:opacity-50"
                              >
                                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                                  Download JSON Backup
                              </button>
                              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 font-medium transition-colors shadow-sm cursor-pointer relative overflow-hidden">
                                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                  <span>Import File (CSV/JSON)</span>
                                  <input 
                                      type="file" 
                                      ref={fileInputRef} 
                                      // IMPORTANT: Single handler for all file types
                                      onChange={handleFileImport} 
                                      accept=".json,.csv" 
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                      disabled={isProcessing}
                                  />
                              </label>
                          </div>
                      </div>

                      {/* 4. Danger Zone */}
                      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                          <h3 className="font-bold text-red-800 dark:text-red-400 mb-2">Danger Zone</h3>
                          <p className="text-red-600 dark:text-red-300 text-sm mb-4">Resetting the application will delete all locally stored data. Ensure you have a backup.</p>
                          <button onClick={handleReset} className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 font-bold text-sm flex items-center gap-2">
                              <Trash2 className="w-4 h-4" /> Factory Reset
                          </button>
                      </div>
                      
                      {/* Appearance Section (Footer) */}
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-4">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                  <Monitor className="w-6 h-6" />
                              </div>
                              <div>
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Appearance</h3>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">Customize how Fractal EDU looks on your device.</p>
                              </div>
                          </div>

                          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg inline-flex">
                              <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                  <Sun className="w-4 h-4" /> Light
                              </button>
                              <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                  <Moon className="w-4 h-4" /> Dark
                              </button>
                              <button onClick={() => setTheme('system')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                  <Monitor className="w-4 h-4" /> System
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* MODALS */}
      {isAddStudentOpen && <AddStudentModal onClose={() => setIsAddStudentOpen(false)} />}
      {isManageStudentsOpen && <ManageStudentsModal isOpen={isManageStudentsOpen} onClose={() => setIsManageStudentsOpen(false)} />}
      {isCreateClassOpen && <CreateClassModal onClose={() => setIsCreateClassOpen(false)} />}
      {isClassAdminOpen && <ClassAdminModal isOpen={isClassAdminOpen} onClose={() => setIsClassAdminOpen(false)} />}
      {isRolloverOpen && <RolloverModal isOpen={isRolloverOpen} onClose={() => setIsRolloverOpen(false)} />}
      
      {importChoicePackage && (
          <ImportChoiceModal 
              packageData={importChoicePackage.data}
              importType={importChoicePackage.type}
              onClose={() => setImportChoicePackage(null)}
              onMergeStudents={handleMergeStudents}
              onReview={handleReviewPackage}
              onMerge={handleMergePackage}
              onRestoreBackup={handleRestoreBackup}
          />
      )}

      {reviewPackage && (
          <ReviewModal 
              packageData={reviewPackage} 
              onClose={() => setReviewPackage(null)} 
          />
      )}

      {/* Universal Confirm Modal */}
      {confirmAction && (
          <ConfirmModal
              isOpen={confirmAction.isOpen}
              title={confirmAction.title}
              message={confirmAction.message}
              isDanger={confirmAction.isDanger}
              onConfirm={confirmAction.onConfirm}
              onClose={() => setConfirmAction(null)}
          />
      )}

      {/* Day Editor Modal */}
      {editingDay && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                          Edit Schedule: {editingDay.week ? `Week ${editingDay.week} ` : ''}{editingDay.day}
                      </h3>
                      <button onClick={() => setEditingDay(null)}><X className="w-5 h-5 text-slate-500" /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase px-2 mb-2">
                          <div className="col-span-2">Start</div>
                          <div className="col-span-2">End</div>
                          <div className="col-span-2">Duration</div>
                          <div className="col-span-3">Name</div>
                          <div className="col-span-3">Type</div>
                      </div>
                      
                      {editingDay.slots.map((slot, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                              <div className="col-span-2 text-sm font-mono text-slate-600 dark:text-slate-400">{slot.startTime}</div>
                              <div className="col-span-2 text-sm font-mono text-slate-600 dark:text-slate-400">{slot.endTime}</div>
                              <div className="col-span-2">
                                  <input 
                                      type="number" 
                                      value={slot.duration} 
                                      onChange={e => updateDaySlot(idx, 'duration', Number(e.target.value))}
                                      className="w-full p-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                  />
                              </div>
                              <div className="col-span-3">
                                  <input 
                                      value={slot.name} 
                                      onChange={e => updateDaySlot(idx, 'name', e.target.value)}
                                      className="w-full p-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                  />
                              </div>
                              <div className="col-span-3">
                                  <select 
                                      value={slot.type} 
                                      onChange={e => updateDaySlot(idx, 'type', e.target.value as PeriodType)}
                                      className="w-full p-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                  >
                                      <option value="Teaching">Teaching</option>
                                      <option value="Break">Break</option>
                                      <option value="RollCall">Roll Call</option>
                                      <option value="Sport">Sport</option>
                                      <option value="Admin">Admin</option>
                                  </select>
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                      <button onClick={() => setEditingDay(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium">Cancel</button>
                      <button onClick={handleDayEditSave} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold text-sm shadow-sm">Save Changes</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
