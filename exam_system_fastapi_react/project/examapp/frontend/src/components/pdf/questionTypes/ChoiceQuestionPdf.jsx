import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../QuestionPdfStyles';

const sjtLabels = {
  very_effective: 'فعال جداً (ممتاز)',
  effective: 'فعال',
  slightly_effective: 'فعال بحدود',
  ineffective: 'غير فعال (ضعيف)',
};

export const ChoiceQuestionPdf = ({ question }) => {
  const { options, correct_indices, sjt_ratings } = question.question_data || {};
  const isSjt = question.q_type === 'sjt';

  return (
    <View style={{ marginTop: 4 }}>
      {options?.map((opt, idx) => {
        const isCorrect = correct_indices?.includes(idx);
        const ratingKey = sjt_ratings?.[String(idx)];

        return (
          <View key={idx} style={[styles.boxGray, isCorrect ? styles.boxGreen : {}]}>
            <Text style={{ textAlign: 'right' }}>
              {idx + 1}. {opt}
            </Text>
            
            {/* في حال أسئلة الاختيار المباشر */}
            {isCorrect && !isSjt && (
              <Text style={[styles.textGreen, { marginTop: 2 }]}>✓ [الإجابة الصحيحة]</Text>
            )}

            {/* في حال أسئلة المواقف السلوكية SJT */}
            {isSjt && ratingKey && (
              <Text style={[ratingKey === 'very_effective' ? styles.textGreen : styles.textRed, { marginTop: 2 }]}>
                التقييم المطلوب: {sjtLabels[ratingKey] || ratingKey}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};