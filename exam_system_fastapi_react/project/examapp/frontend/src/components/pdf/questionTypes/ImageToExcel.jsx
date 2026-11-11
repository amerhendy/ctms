import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer'; // 1. استيراد Image من المكتبة
import { styles } from '../QuestionPdfStyles';

export const ImageToExcel = ({ question }) => {
  const { instructions } = question.question_data || {};
  const question_text = question.question_text || 'لا يوجد نص للسؤال';
  const image_path = question.image_path || null;

  return (
    <View style={{ gap: 4 }}>
      {Boolean(instructions) && (
        <View style={styles.boxGreen}>
          <Text style={{ textAlign: 'right' }}>
            <Text style={styles.textGreen}>تعليمات: </Text>
            {instructions}
          </Text>
        </View>
      )}

      {/* 2. استبدال img بـ Image وتطبيق تنسيقات العرض والأبعاد مباشرة */}
      {image_path && (
        <View style={styles.boxGray}>
          <Image 
            src={image_path} 
            style={{
              width: '100%',
              maxHeight: 200,
              objectFit: 'contain',
              borderRadius: 4
            }} 
          />
        </View>
      )}
    </View>
  );
};