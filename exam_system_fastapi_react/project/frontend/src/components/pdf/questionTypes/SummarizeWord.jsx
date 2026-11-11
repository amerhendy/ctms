import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../QuestionPdfStyles';

export const SummarizeWord = ({ question }) => {
  const { max_words,min_words, reference_text } = question.question_data || {};

  return (
    <View style={{ gap: 4 }}>
      <View style={styles.boxGray}>
        <Text style={{ textAlign: 'right' }}>
          <Text style={styles.textRed}>النص الاصلى: </Text>
          {reference_text}
        </Text>
      </View>
      <View style={styles.boxGreen}>
        <Text style={{ textAlign: 'right' }}>
          <Text style={styles.textGreen}>اقل عدد كلمات: </Text>
          {min_words}
        </Text>
      </View>
      <View style={styles.boxGreen}>
        <Text style={{ textAlign: 'right' }}>
          <Text style={styles.textGreen}>اعلى عدد كلمات: </Text>
          {max_words}
        </Text>
      </View>
    </View>
  );
};