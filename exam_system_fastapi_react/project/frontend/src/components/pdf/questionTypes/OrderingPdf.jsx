import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../QuestionPdfStyles';

export const OrderingPdf = ({ question }) => {
  const { items } = question.question_data || {};

  return (
    <View style={styles.boxGreen}>
      <Text style={[styles.textBold, { marginBottom: 4, textAlign: 'right' }]}>الترتيب التسلسلي الصحيح:</Text>
      {items?.map((item, idx) => (
        <Text key={idx} style={{ textAlign: 'right', marginTop: 2 }}>
          {item}. {idx + 1}
        </Text>
      ))}
    </View>
  );
};