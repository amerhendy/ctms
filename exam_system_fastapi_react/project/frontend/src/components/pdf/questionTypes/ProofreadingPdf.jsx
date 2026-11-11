import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../QuestionPdfStyles';

export const ProofreadingPdf = ({ question }) => {
  const { raw_text, corrected_text } = question.question_data || {};

  return (
    <View style={{ gap: 4 }}>
      <View style={styles.boxGray}>
        <Text style={{ textAlign: 'right' }}>
          <Text style={styles.textRed}>النص الأصلي (الخاطئ): </Text>
          {raw_text}
        </Text>
      </View>
      <View style={styles.boxGreen}>
        <Text style={{ textAlign: 'right' }}>
          <Text style={styles.textGreen}>التصحيح النموذجى: </Text>
          {corrected_text}
        </Text>
      </View>
    </View>
  );
};