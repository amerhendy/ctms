import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../QuestionPdfStyles';

export const MatchingPdf = ({ question }) => {
  const { pairs } = question.question_data || {};

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableColHeader]}>
        <Text style={styles.tableCol}>القائمة (أ)</Text>
        <Text style={styles.tableCol}>المطابق الصحيح في القائمة (ب)</Text>
      </View>
      {pairs?.map((pair, idx) => (
        <View key={idx} style={styles.tableRow}>
          <Text style={styles.tableCol}>{pair.left}</Text>
          <Text style={[styles.tableCol, styles.textGreen]}>← {pair.right}</Text>
        </View>
      ))}
    </View>
  );
};