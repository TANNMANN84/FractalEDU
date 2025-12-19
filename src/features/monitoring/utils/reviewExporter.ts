import { ClassGroup, Student, MonitoringDoc, ReviewPackage, Term, StudentProfilerSnapshotEntry } from '@/types';
import { storageService } from '@/services/storageService';
import { BLANK_MONITORING_DOC_SKELETON } from '@/shared/constants';

/**
 * Bundles a Monitoring Document and all referenced evidence files into a 
 * single self-contained JSON package for offline review.
 */
export const exportReviewPackage = async (
    classGroup: ClassGroup,
    students: Student[],
    monitoringDoc: MonitoringDoc,
    selectedTerm: Term
) => {
    // 1. Create Lean Monitoring Document (Annual data + selected term)
    const leanDoc: MonitoringDoc = {
        ...BLANK_MONITORING_DOC_SKELETON,
        id: monitoringDoc.id,
        classId: monitoringDoc.classId,
        year: monitoringDoc.year,
        certifySyllabus: monitoringDoc.certifySyllabus,
        scopeAndSequence: monitoringDoc.scopeAndSequence,
        assessmentSchedule: monitoringDoc.assessmentSchedule,
        assessmentTask1: monitoringDoc.assessmentTask1,
        assessmentTask2: monitoringDoc.assessmentTask2,
        assessmentTask3: monitoringDoc.assessmentTask3,
        prePostDiagnostic: monitoringDoc.prePostDiagnostic,
        scannedWorkSamples: monitoringDoc.scannedWorkSamples
    };

    // Populate Term Specifics
    leanDoc.teachingPrograms[selectedTerm] = monitoringDoc.teachingPrograms[selectedTerm];
    leanDoc.semesterReports[selectedTerm] = monitoringDoc.semesterReports[selectedTerm];
    leanDoc.marksAndRanks[selectedTerm] = monitoringDoc.marksAndRanks[selectedTerm];
    leanDoc.specificLearningNeeds[selectedTerm] = monitoringDoc.specificLearningNeeds[selectedTerm];
    leanDoc.studentsCausingConcern[selectedTerm] = monitoringDoc.studentsCausingConcern[selectedTerm];
    leanDoc.illnessMisadventure[selectedTerm] = monitoringDoc.illnessMisadventure[selectedTerm];
    leanDoc.malpractice[selectedTerm] = monitoringDoc.malpractice[selectedTerm];
    leanDoc.teacherSignOff[selectedTerm] = monitoringDoc.teacherSignOff[selectedTerm];
    leanDoc.headTeacherSignOff[selectedTerm] = monitoringDoc.headTeacherSignOff[selectedTerm];

    // 2. Generate Student Profiler Snapshot
    const profilerSnapshot: StudentProfilerSnapshotEntry[] = students.map(s => ({
        studentId: s.id,
        name: s.name,
        hasWellbeingNotes: (s.wellbeing?.notes || '').length > 0,
        hasEvidenceLogs: (s.evidenceLog || []).length > 0,
        hasWorkSamples: false, // Placeholder logic
        hasDifferentiation: (s.adjustments || []).some(a => a.active),
        naplan: {
            year7: s.naplan?.year7 || { reading: '', writing: '', numeracy: '' } as any,
            year9: s.naplan?.year9 || { reading: '', writing: '', numeracy: '' } as any,
        }
    }));

    // 3. Scan for Evidence Files to Embed
    const files: Record<string, string> = {};
    const fileIds = new Set<string>();

    const trackFile = (f: any) => { if (f && f.id) fileIds.add(f.id); };
    const trackList = (list: any[]) => { if (list) list.forEach(trackFile); };

    // Common Docs
    trackFile(leanDoc.scopeAndSequence);
    trackFile(leanDoc.assessmentSchedule);
    
    // Term Specifics
    trackList(leanDoc.teachingPrograms[selectedTerm]);
    trackFile(leanDoc.semesterReports[selectedTerm]);
    trackFile(leanDoc.marksAndRanks[selectedTerm]);
    
    // Assessments
    trackList(leanDoc.assessmentTask1);
    trackList(leanDoc.assessmentTask2);
    trackList(leanDoc.assessmentTask3);
    trackList(leanDoc.prePostDiagnostic);
    
    // Work Samples
    Object.values(leanDoc.scannedWorkSamples).forEach(task => {
        trackFile(task.top);
        trackFile(task.middle);
        trackFile(task.low);
    });

    // Communication Logs
    leanDoc.studentsCausingConcern[selectedTerm].forEach(c => trackFile(c.file));
    trackList(leanDoc.illnessMisadventure[selectedTerm]);
    trackList(leanDoc.malpractice[selectedTerm]);

    // Fetch and store content from local IndexedDB
    for (const id of fileIds) {
        try {
            const content = await storageService.getFileContent(id);
            if (content) files[id] = content;
        } catch (e) {
            console.error(`Failed to bundle file ${id}`, e);
        }
    }

    // 4. Construct Final Package
    const pkg: ReviewPackage = {
        dataType: 'reviewPackage',
        classGroup,
        monitoringDoc: leanDoc,
        students,
        profilerSnapshot,
        files
    };

    // 5. Trigger Browser Download
    const jsonString = JSON.stringify(pkg, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const safeName = classGroup.name.replace(/[^a-z0-9]/gi, '_');
    a.download = `${safeName}_Term_${selectedTerm}_Review.profiler-review`;
    
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};