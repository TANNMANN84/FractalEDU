
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ClassGroup, Student } from '@/types';

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#ffffff', padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  subTitle: { fontSize: 10, color: '#64748b' },
  
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', marginTop: 20 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableHeader: { backgroundColor: '#f1f5f9', fontWeight: 'bold' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0 },
  tableColName: { width: '40%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 5, fontSize: 9 },
  
  chartContainer: { marginTop: 30, height: 150, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#000', flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 5 },
  bar: { width: 30, marginHorizontal: 10, backgroundColor: '#0ea5e9' },
  barLabel: { fontSize: 8, textAlign: 'center', marginTop: 4 },
  
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center', color: '#94a3b8' }
});

interface Props {
  classGroup: ClassGroup;
  students: Student[];
}

export const ClassSummaryDocument: React.FC<Props> = ({ classGroup, students }) => {
    // Calculate simple stats for "chart"
    const learningPlans = students.filter(s => s.hasLearningPlan).length;
    const nccd = students.filter(s => s.nccd?.active).length;
    const atsi = students.filter(s => s.isAtsi).length;
    
    const maxVal = Math.max(learningPlans, nccd, atsi, 1);
    const getHeight = (val: number) => (val / maxVal) * 100;

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Class Performance Summary</Text>
            <Text style={styles.subTitle}>{classGroup.name} • {classGroup.subject} • {students.length} Students</Text>
          </View>

          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>Student Cohort List</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableColName}><Text style={styles.tableCell}>Name</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Cohort</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Support Level</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Wellbeing</Text></View>
            </View>
            {students.map(s => (
                <View style={styles.tableRow} key={s.id}>
                    <View style={styles.tableColName}><Text style={styles.tableCell}>{s.name}</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{s.cohort}</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{s.support.level}</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{s.wellbeing.status}</Text></View>
                </View>
            ))}
          </View>

          <Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 30 }}>Composition Overview</Text>
          <View style={styles.chartContainer}>
             <View style={{ alignItems: 'center' }}>
                <View style={[styles.bar, { height: getHeight(learningPlans), backgroundColor: '#8b5cf6' }]} />
                <Text style={styles.barLabel}>L. Plans ({learningPlans})</Text>
             </View>
             <View style={{ alignItems: 'center' }}>
                <View style={[styles.bar, { height: getHeight(nccd), backgroundColor: '#ec4899' }]} />
                <Text style={styles.barLabel}>NCCD ({nccd})</Text>
             </View>
             <View style={{ alignItems: 'center' }}>
                <View style={[styles.bar, { height: getHeight(atsi), backgroundColor: '#f97316' }]} />
                <Text style={styles.barLabel}>ATSI ({atsi})</Text>
             </View>
          </View>

          <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages} • Generated via Fractal EDU`} fixed />
        </Page>
      </Document>
    );
};
