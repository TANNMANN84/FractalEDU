import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Minimal styles
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 20, marginBottom: 20, fontWeight: 'bold' },
  text: { fontSize: 12, marginBottom: 10 }
});

// We accept props but ignore them to prevent data-related crashes for this test
export const StudentDossierDocument = ({ student }: any) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.header}>Debug Report</Text>
          <Text style={styles.text}>If you are seeing this PDF, the React-PDF engine is working correctly.</Text>
          <Text style={styles.text}>Student Name: {student?.name || 'Test Student'}</Text>
        </View>
      </Page>
    </Document>
  );
};