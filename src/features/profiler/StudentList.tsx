
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Student } from '@/types';
import { Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, Settings2 } from 'lucide-react';

interface StudentListProps {
  onSelectStudent: (student: Student) => void;
  lockedClassId?: string;
}

type SortKey = 'name' | 'cohort' | 'isAtsi' | 'hasLearningPlan';

export const StudentList: React.FC<StudentListProps> = ({ onSelectStudent, lockedClassId }) => {
  const { students, classes } = useAppStore();
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ 
    key: 'name', 
    direction: 'asc' 
  });

  // Column Visibility State
  const [columns, setColumns] = useState({ 
      cohort: true, 
      atsi: true, 
      plan: true, 
      flags: true
  });
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  // Force filter if lockedClassId is provided
  useEffect(() => {
      if (lockedClassId) setFilterClassId(lockedClassId);
  }, [lockedClassId]);

  const filteredStudents = useMemo(() => {
    let result = students;

    // Class Filter - use locked ID if present, otherwise user selection
    const activeFilter = lockedClassId || filterClassId;

    if (activeFilter !== 'all') {
      const selectedClass = classes.find(c => c.id === activeFilter);
      if (selectedClass) {
        result = result.filter(s => selectedClass.studentIds.includes(s.id));
      } else {
        result = [];
      }
    }

    // Search Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(lower));
    }

    return result;
  }, [students, classes, filterClassId, lockedClassId, searchTerm]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Student];
      let bVal: any = b[sortConfig.key as keyof Student];
      
      // Handle missing booleans
      if (typeof aVal === 'undefined') aVal = false;
      if (typeof bVal === 'undefined') bVal = false;

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredStudents, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleColumn = (key: keyof typeof columns) => {
      setColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortConfig.key !== colKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-brand-600 ml-1" />
      : <ChevronDown className="w-3 h-3 text-brand-600 ml-1" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          
          {/* Only show filter if NOT locked */}
          {!lockedClassId && (
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="py-2 pl-2 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
                >
                <option value="all">All Classes</option>
                {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                </select>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative">
                <button 
                    onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                    className={`p-2 rounded-lg border transition-colors ${isColumnMenuOpen ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`}
                    title="Customize Columns"
                >
                    <Settings2 className="w-4 h-4" />
                </button>
                
                {isColumnMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsColumnMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in duration-200">
                            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Toggle Columns</div>
                            {Object.keys(columns).map(col => (
                                <button 
                                    key={col}
                                    onClick={() => toggleColumn(col as keyof typeof columns)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between group"
                                >
                                    <span className="capitalize text-slate-700">{col}</span>
                                    {(columns as any)[col] && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
            <div className="text-sm text-slate-500">
                Showing {sortedStudents.length} students
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th onClick={() => handleSort('name')} className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors">
                  <div className="flex items-center">Name <SortIcon colKey="name" /></div>
                </th>
                {columns.cohort && <th onClick={() => handleSort('cohort')} className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors">
                  <div className="flex items-center">Cohort <SortIcon colKey="cohort" /></div>
                </th>}
                {columns.flags && <th className="px-6 py-4">Flags</th>}
                {columns.atsi && <th onClick={() => handleSort('isAtsi')} className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors text-center w-32">
                  <div className="flex items-center justify-center">ATSI <SortIcon colKey="isAtsi" /></div>
                </th>}
                {columns.plan && <th onClick={() => handleSort('hasLearningPlan')} className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors text-center w-40">
                  <div className="flex items-center justify-center">Learning Plan <SortIcon colKey="hasLearningPlan" /></div>
                </th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStudents.length > 0 ? (
                sortedStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    onClick={() => onSelectStudent(student)}
                    className="hover:bg-brand-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800 group-hover:text-brand-700">{student.name}</td>
                    {columns.cohort && <td className="px-6 py-4 text-slate-500">{student.cohort}</td>}
                    {columns.flags && (
                        <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                                {student.nccd?.isNCCD && <span className="w-2.5 h-2.5 rounded-full bg-pink-500" title="NCCD" />}
                                {student.profile?.customFlags?.map(f => (
                                    <span key={f.id} className={`w-2.5 h-2.5 rounded-full ${f.color.split(' ')[0].replace('100','500')}`} title={f.label} />
                                ))}
                            </div>
                        </td>
                    )}
                    {columns.atsi && <td className="px-6 py-4 text-center">
                      {student.isAtsi || student.profile?.isAtsi ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>}
                    {columns.plan && <td className="px-6 py-4 text-center">
                      {student.hasLearningPlan || student.plans?.learning?.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No students found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
