import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../QuestionPdfStyles';

export const InlineDropdownPdf = ({ question }) => {
  const { template_text, dropdowns } = question.question_data || {};

  return (
    <View>
      <View style={styles.boxGray}>
        <Text style={{ textAlign: 'right', lineHeight: 1.4 }}>
          <Text style={styles.textBold}>النص الكامل: </Text>
          {template_text}
        </Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableColHeader]}>
          <Text style={[styles.tableCol, { flex: 0.5 }]}>القائمة</Text>
          <Text style={[styles.tableCol, { flex: 2 }]}>الخيارات المتاحة</Text>
          <Text style={[styles.tableCol, { flex: 1 }]}>الإجابة الصحيحة</Text>
        </View>
        {dropdowns?.map((drop, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCol, { flex: 0.5 }]}>[{idx + 1}]</Text>
            <Text style={[styles.tableCol, { flex: 2 }]}>{drop.options?.join(' / ')}</Text>
            <Text style={[styles.tableCol, styles.textGreen, { flex: 1 }]}>{drop.correct}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};