import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from './QuestionPdfStyles';

import { ChoiceQuestionPdf } from './questionTypes/ChoiceQuestionPdf';
import { InlineDropdownPdf } from './questionTypes/InlineDropdownPdf';
import { ProofreadingPdf } from './questionTypes/ProofreadingPdf';
import { OrderingPdf } from './questionTypes/OrderingPdf';
import { MatchingPdf } from './questionTypes/MatchingPdf';
import { TrueFalsePdf } from './questionTypes/TrueFalsePdf';
import { SummarizeWord } from './questionTypes/SummarizeWord';
import { ImageToExcel } from './questionTypes/ImageToExcel';
export const QuestionPdfDocument = ({ questions = [], jobTitle = 'نموذج التقييم' }) => {
  
  // دالة توجيه نوع السؤال للمكون المناسب
  const renderQuestionBody = (q) => {
    switch (q.q_type) {
      case 'single_choice':
      case 'multiple_choice':
      case 'select_all':
      case 'sjt':
        return <ChoiceQuestionPdf question={q} />;
      case 'inline_dropdown':
        return <InlineDropdownPdf question={q} />;
      case 'proofreading':
        return <ProofreadingPdf question={q} />;
      case 'ordering':
        return <OrderingPdf question={q} />;
      case 'matching':
        return <MatchingPdf question={q} />;
      case 'true_false_justify':
        return <TrueFalsePdf question={q} />;
      case 'summarize_word':
        return <SummarizeWord question={q} />;
      case 'image_to_excel':
        return <ImageToExcel question={q} />;
      default:
        alert(`نوع السؤال "${q.q_type}" غير مدعوم في التصدير إلى PDF.`)
        return null;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header ثابت يتكرر في كل صفحة */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.headerTitle}>دليل نموذج إجابات الاسئلة</Text>
            <Text style={styles.headerSubtitle}>المسمى الوظيفي: {jobTitle}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>
              تاريخ التصدير: {new Date().toLocaleDateString('ar-EG')}
            </Text>
            <Text style={{ fontSize: 8, color: '#1e40af', marginTop: 2 }}>
              عدد الأسئلة: {questions.length}
            </Text>
          </View>
        </View>

        {/* قائمة الأسئلة */}
        {questions.map((q, idx) => (
          <View key={q.id || idx} style={styles.questionCard} wrap={false}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionText}>
                س {idx + 1}: {q.question_text}
              </Text>
              <Text style={styles.badgePoints}>{q.points} درجات</Text>
            </View>

            {/* تفاصيل الإجابة حسب النوع */}
            {renderQuestionBody(q)}
          </View>
        ))}

        {/* Footer ثابت يتكرر في كل صفحة مع رقم الصفحة الديناميكي */}
        <View style={styles.footer} fixed>
          <Text>مستند خاص بـ لجنة التصحيح والتقييم - سري للغاية</Text>
          <Text render={({ pageNumber, totalPages }) => `صفحة ${pageNumber} من ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
};