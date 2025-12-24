
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { MonitoringDoc, ClassGroup } from '@/types';

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#ffffff', padding: 40, fontFamily: 'Helvetica' },
  title: { fontSize: 20, textAlign: 'center', fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  subTitle: { fontSize: 12, textAlign: 'center', color: '#475569', marginBottom: 20 },
  
  box: { border: '1px solid #e2e8f0', padding: 15, marginBottom: 10, borderRadius: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, backgroundColor: '#f1f5f9', padding: 4 },
  
  checkRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'center' },
  checkbox: { width: 10, height: 10, border: '1px solid #000', marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  checkMark: { fontSize: 8 },
  checkText: { fontSize: 10 },
  
  signatureBox: { marginTop: 30, borderTop: '1px solid #000', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  sigBlock: { width: '45%', alignItems: 'center' },
  sigImage: { height: 40, marginBottom: 5 },
  sigLine: { borderTop: '1px solid #94a3b8', width: '100%', marginTop: 20 },
  sigText: { fontSize: 10, color: '#475569', marginTop: 4 }
});

interface Props {
  doc: MonitoringDoc;
  classGroup: ClassGroup;
  term: '1' | '2' | '3' | '4';
  teacherName: string;
}

export const ComplianceDocument: React.FC<Props> = ({ doc, classGroup, term, teacherName }) => {
    const teacherSign = doc.teacherSignOff[term];
    const headTeacherSign = doc.headTeacherSignOff[term];

    const hasTeacherSig = !!(teacherSign.date && 'signatureImage' in teacherSign && teacherSign.signatureImage);
    const hasHeadSig = !!(headTeacherSign.date && 'signatureImage' in headTeacherSign && headTeacherSign.signatureImage);

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Junior Monitoring Report</Text>
          <Text style={styles.subTitle}>{classGroup.name} • {classGroup.subject} • Term {term} {doc.year}</Text>

          <View style={styles.box}>
            <Text style={styles.sectionTitle}>1. Syllabus Implementation</Text>
            <View style={styles.checkRow}>
                <View style={styles.checkbox}><Text style={styles.checkMark}>{doc.scopeAndSequence ? 'X' : ''}</Text></View>
                <Text style={styles.checkText}>Scope and Sequence Sighted</Text>
            </View>
            <View style={styles.checkRow}>
                <View style={styles.checkbox}><Text style={styles.checkMark}>{doc.certifySyllabus ? 'X' : ''}</Text></View>
                <Text style={styles.checkText}>Certification: All required outcomes have been taught and assessed.</Text>
            </View>
            <View style={styles.checkRow}>
                <View style={styles.checkbox}><Text style={styles.checkMark}>{(doc.teachingPrograms[term] && doc.teachingPrograms[term].length > 0) ? 'X' : ''}</Text></View>
                <Text style={styles.checkText}>Teaching Program ({(doc.teachingPrograms[term] && doc.teachingPrograms[term].length) || 0} files attached)</Text>
            </View>
          </View>

          <View style={styles.box}>
            <Text style={styles.sectionTitle}>2. Assessment & Reporting</Text>
            <View style={styles.checkRow}>
                <View style={styles.checkbox}><Text style={styles.checkMark}>{doc.assessmentSchedule ? 'X' : ''}</Text></View>
                <Text style={styles.checkText}>Assessment Schedule</Text>
            </View>
            <View style={styles.checkRow}>
                <View style={styles.checkbox}><Text style={styles.checkMark}>{doc.marksAndRanks[term] ? 'X' : ''}</Text></View>
                <Text style={styles.checkText}>Marks and Ranks</Text>
            </View>
            <View style={styles.checkRow}>
                <View style={styles.checkbox}><Text style={styles.checkMark}>{doc.semesterReports[term] ? 'X' : ''}</Text></View>
                <Text style={styles.checkText}>Semester Reports</Text>
            </View>
          </View>

          <View style={styles.box}>
            <Text style={styles.sectionTitle}>3. Student Support</Text>
            <View style={styles.checkRow}>
                <View style={styles.checkbox}><Text style={styles.checkMark}>{doc.specificLearningNeeds[term] ? 'X' : ''}</Text></View>
                <Text style={styles.checkText}>Specific learning needs addressed (NCCD/PLPs)</Text>
            </View>
            <View style={styles.checkRow}>
                <View style={styles.checkbox}><Text style={styles.checkMark}>{(doc.studentsCausingConcern[term] && doc.studentsCausingConcern[term].length > 0) ? 'X' : ''}</Text></View>
                <Text style={styles.checkText}>Students Causing Concern ({(doc.studentsCausingConcern[term] && doc.studentsCausingConcern[term].length) || 0} logged)</Text>
            </View>
          </View>

          <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' }}>
             <View style={styles.sigBlock}>
                {hasTeacherSig ? (
                    <Image src={teacherSign.signatureImage!} style={styles.sigImage} />
                ) : (
                    teacherSign.date ? <Text style={{ fontFamily: 'Helvetica-Oblique', fontSize: 14 }}>{teacherSign.teacherName}</Text> : null
                )}
                <View style={styles.sigLine} />
                <Text style={styles.sigText}>Teacher: {teacherSign.teacherName || teacherName}</Text>
                <Text style={styles.sigText}>Date: {teacherSign.date ? new Date(teacherSign.date).toLocaleDateString() : 'Not Signed'}</Text>
             </View>

             <View style={styles.sigBlock}>
                {hasHeadSig ? (
                    <Image src={headTeacherSign.signatureImage!} style={styles.sigImage} />
                ) : (
                    headTeacherSign.date ? <Text style={{ fontFamily: 'Helvetica-Oblique', fontSize: 14 }}>{headTeacherSign.teacherName}</Text> : null
                )}
                <View style={styles.sigLine} />
                <Text style={styles.sigText}>Head Teacher</Text>
                <Text style={styles.sigText}>Date: {headTeacherSign.date ? new Date(headTeacherSign.date).toLocaleDateString() : 'Not Signed'}</Text>
             </View>
          </View>

        </Page>
      </Document>
    );
};
