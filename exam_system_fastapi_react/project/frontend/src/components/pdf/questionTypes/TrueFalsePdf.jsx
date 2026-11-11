import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../QuestionPdfStyles';

export const TrueFalsePdf = ({ question }) => {
  const { correct_choice, model_justification } = question.question_data || {};

  return (
    <View>
      <View style={correct_choice ? styles.boxGreen : styles.boxGray}>
        <Text style={{ textAlign: 'right' }}>
          <Text style={styles.textBold}>الإجابة: </Text>
          <Text style={correct_choice ? styles.textGreen : styles.textRed}>
            {correct_choice ? 'صواب (True)' : 'خطأ (False)'}
          </Text>
        </Text>
      </View>
      
      {model_justification && (
        <View style={styles.boxGray}>
          <Text style={{ textAlign: 'right', lineHeight: 1.3 }}>
            <Text style={styles.textBold}>التبرير النموذجى: </Text>
            {model_justification}
          </Text>
        </View>
      )}
    </View>
  );
};