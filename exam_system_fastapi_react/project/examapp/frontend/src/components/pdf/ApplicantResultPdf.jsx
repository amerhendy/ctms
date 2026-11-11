import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { resultStyles as s } from './ApplicantResultPdfStyles';

const VIOLATION_LABELS = {
  tab_switch: 'تبديل النافذة / التبويب',
  window_blur: 'فقد التركيز عن النافذة',
  copy_paste: 'محاولة نسخ / لصق',
  fullscreen_exit: 'الخروج من وضع ملء الشاشة',
  right_click: 'النقر بالزر الأيمن',
  devtools: 'فتح أدوات المطور',
  unknown: 'مخالفة غير محددة',
};

function summarizeViolations(violations = []) {
  const map = new Map();

  violations.forEach((v) => {
    const key = v.violation_type || 'unknown';
    const time = v.occurred_at ? new Date(v.occurred_at).getTime() : 0;

    if (!map.has(key)) {
      map.set(key, {
        type: key,
        label: VIOLATION_LABELS[key] || key,
        count: 0,
        firstAt: v.occurred_at,
        lastAt: v.occurred_at,
        _firstTs: time,
        _lastTs: time,
        details: v.details || '',
      });
    }

    const item = map.get(key);
    item.count += 1;
    if (time && time < item._firstTs) {
      item._firstTs = time;
      item.firstAt = v.occurred_at;
    }
    if (time && time > item._lastTs) {
      item._lastTs = time;
      item.lastAt = v.occurred_at;
    }
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
const Q_TYPE_LABELS = {
  single_choice: 'اختيار عنصر واحد',
  multiple_choice: 'اختيار متعدد',
  select_all: 'تحديد الكل',
  inline_dropdown: 'قائمة منسدلة',
  proofreading: 'تصحيح لغوي',
  ordering: 'ترتيب',
  matching: 'مطابقة',
  sjt: 'موقف إداري',
  true_false_justify: 'صواب/خطأ مع تعليل',
  excel_grid: 'جدول إكسل',
  image_to_excel: 'صورة إلى إكسل',
  image_to_word: 'صورة إلى وورد',
  summarize_word: 'تلخيص',
  math_formula: 'معادلة',
  file_upload: 'رفع ملف',
  word_editor: 'محرر نصوص',
};

const STATUS_LABELS = {
  pending: 'لم يبدأ',
  in_progress: 'جاري الاختبار',
  finished: 'منتهي',
};

/* ── Helpers ──────────────────────────────────────── */
function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const d = new Date(value.endsWith?.('Z') ? value : value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${window.location.origin}${path}`;
}

/* ══════════════════════════════════════════════════
   Renderers per question type
   ══════════════════════════════════════════════════ */
const SJT_RATING_LABELS = {
  very_effective:     { label: 'فعّال جداً',   color: '#15803d', bg: '#dcfce7' },
  effective:          { label: 'فعّال',         color: '#0369a1', bg: '#dbeafe' },
  slightly_effective: { label: 'فعّال بحدود',  color: '#a16207', bg: '#fef3c7' },
  ineffective:        { label: 'غير فعّال',    color: '#b91c1c', bg: '#fee2e2' },
  counterproductive:  { label: 'نتيجة عكسية',  color: '#7f1d1d', bg: '#fecaca' },
};

function SJTAnswerView({ q }) {
  const { options = [], sjt_ratings = {} } = q.question_data || {};
  const ans = q.answer || {};
  const bestIdx = ans.best;
  const worstIdx = ans.worst;

  // تحديد التصرف الأمثل والأسوأ من إعدادات الأدمن (للمقارنة)
  const idealBestIdx = Object.entries(sjt_ratings)
    .find(([, r]) => r === 'very_effective')?.[0];

  const idealWorstIdx = Object.entries(sjt_ratings)
    .find(([, r]) => r === 'counterproductive' || r === 'ineffective')?.[0];

  const hasAnswer = bestIdx !== undefined || worstIdx !== undefined;

  return (
    <View>
      {/* شريط توضيحي */}

      {/* قائمة الخيارات مع تقييمها */}
      {options.map((opt, idx) => {
        const rating = sjt_ratings[String(idx)];
        const ratingInfo = SJT_RATING_LABELS[rating] || {
          label: rating || '—',
          color: '#64748b',
          bg: '#f1f5f9',
        };
        const isUserBest = bestIdx === idx;
        const isUserWorst = worstIdx === idx;
        const isIdealBest = String(idx) === String(idealBestIdx);
        const isIdealWorst = String(idx) === String(idealWorstIdx);

        return (
          <View
            key={idx}
            style={[
                s.optRow,
                {
                flexDirection: 'column',
                alignItems: 'stretch',
                paddingVertical: 6,
                paddingHorizontal: 6,
                },
                isUserBest && s.optCorrectSelected,
                isUserWorst && s.optWrong,
            ]}
            >
            {/* ── السطر الأول: نص التصرف (عرض كامل) ── */}
            <Text
                style={{
                fontSize: 9,
                fontWeight: 'bold',
                textAlign: 'right',
                lineHeight: 1.5,
                marginBottom: 5,
                color: '#0f172a',
                }}
            >
                {idx + 1}. {opt}
            </Text>

            {/* ── السطر الثاني: شارات التقييم + اختيار المتقدم ── */}
            <View
                style={{
                flexDirection: 'row-reverse',
                width: '100%',
                alignItems: 'center',
                }}
            >
                {/* العمود الأيمن: شارات التقييم (50%) */}
                <View
                style={{
                    width: '50%',
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
                >
                {/* شارة التقييم */}
                <Text
                    style={{
                    fontSize: 7,
                    color: ratingInfo.color,
                    backgroundColor: ratingInfo.bg,
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 3,
                    fontWeight: 'bold',
                    marginLeft: 4,
                    }}
                >
                    التقييم: {ratingInfo.label}
                </Text>

                {/* شارة الأمثل */}
                {isIdealBest && (
                    <Text
                    style={{
                        fontSize: 7,
                        color: '#15803d',
                        backgroundColor: '#dcfce7',
                        paddingHorizontal: 5,
                        paddingVertical: 2,
                        borderRadius: 3,
                        fontWeight: 'bold',
                        marginLeft: 4,
                    }}
                    >
                    ⭐ الأمثل
                    </Text>
                )}

                {/* شارة الأسوأ */}
                {isIdealWorst && !isIdealBest && (
                    <Text
                    style={{
                        fontSize: 7,
                        color: '#b91c1c',
                        backgroundColor: '#fee2e2',
                        paddingHorizontal: 5,
                        paddingVertical: 2,
                        borderRadius: 3,
                        fontWeight: 'bold',
                        marginLeft: 4,
                    }}
                    >
                    ⚠️ الأسوأ
                    </Text>
                )}
                </View>

                {/* العمود الأيسر: اختيار المتقدم (50%) */}
                <View
                style={{
                    width: '50%',
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                }}
                >
                {isUserBest && (
                    <Text
                    style={{
                        fontSize: 7,
                        color: '#fff',
                        backgroundColor: '#16a34a',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 3,
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}
                    >
                    ✓ اختار: أفضل تصرف
                    </Text>
                )}

                {isUserWorst && (
                    <Text
                    style={{
                        fontSize: 7,
                        color: '#fff',
                        backgroundColor: '#dc2626',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 3,
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}
                    >
                    ✗ اختار: أسوأ تصرف
                    </Text>
                )}

                {!isUserBest && !isUserWorst && (
                    <Text style={{ fontSize: 7, color: '#94a3b8' }}>— لم يختر —</Text>
                )}
                </View>
            </View>
            </View>
        );
      })}

      {/* ملخص اختيار المتقدم */}
      <View style={s.boxBlue}>
        <Text style={s.textBold}>ملخص إجابة المتقدم:</Text>
        <Text>
          أفضل تصرف: {bestIdx !== undefined && options[bestIdx]
            ? `«${options[bestIdx]}» (رقم ${bestIdx + 1})`
            : 'لم يحدد'}
        </Text>
        <Text>
          أسوأ تصرف: {worstIdx !== undefined && options[worstIdx]
            ? `«${options[worstIdx]}» (رقم ${worstIdx + 1})`
            : 'لم يحدد'}
        </Text>
      </View>

      {!hasAnswer && (
        <View style={s.boxBlue}>
          <Text style={s.textRed}>⚠️ لم يقم المتقدم بالإجابة على هذا السؤال</Text>
        </View>
      )}
    </View>
  );
}
function ChoiceAnswerView({ q }) {
  const { options = [], correct_indices = [], sjt_ratings } = q.question_data || {};
  const selected = q.answer?.selected_index;
  const selectedArr = Array.isArray(selected) ? selected : selected != null ? [selected] : [];
  const correctArr = correct_indices || [];

  return (
    <View>
      {options.map((opt, idx) => {
        const isCorrect = correctArr.includes(idx);
        const isSelected = selectedArr.includes(idx);
        return (
          <View
            key={idx}
            style={[
              s.optRow,
              isCorrect && s.optCorrect,
              isSelected && !isCorrect && s.optWrong,
              isSelected && isCorrect && s.optCorrectSelected,
            ]}
          >
            <Text style={s.optText}>{idx + 1}. {opt}</Text>
            <View style={s.optBadges}>
              {isCorrect && <Text style={s.badgeGreen}>✓ الصحيح</Text>}
              {isSelected && <Text style={s.badgeBlue}>اختيارك</Text>}
            </View>
          </View>
        );
      })}
      {sjt_ratings && (
        <View style={s.infoBox}>
          <Text style={s.textBold}>تقييمات SJT:</Text>
          {Object.entries(sjt_ratings).map(([k, v]) => (
            <Text key={k}>• الخيار {Number(k) + 1}: {v}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

function InlineDropdownAnswerView({ q }) {
  const { template_text = '', dropdowns = [] } = q.question_data || {};
  const ans = q.answer || {};
  const parts = template_text.split('[drop]');

  return (
    <View>
      <View style={s.infoBox}>
        {parts.map((part, idx) => (
          <Text key={idx}>
            {part}
            {idx < parts.length - 1 && (
              <Text style={s.inlineHighlight}>
                {' '}[{ans[idx] ?? 'لم يُجب'}] {dropdowns[idx]?.correct === ans[idx] ? ' ✓' : ` ✗ (الصحيح: ${dropdowns[idx]?.correct ?? '—'})`}{' '}
              </Text>
            )}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ProofreadingAnswerView({ q }) {
  const { raw_text = '', corrected_text = '' } = q.question_data || {};
  const userText = typeof q.answer === 'object' ? q.answer?.text : q.answer;

  return (
    <View>
      <View style={s.infoBox}>
        <Text style={s.textBold}>النص الأصلي:</Text>
        <Text>{raw_text}</Text>
      </View>
      {corrected_text && (
        <View style={s.boxGreen}>
          <Text style={s.textBold}>الإجابة النموذجية:</Text>
          <Text>{corrected_text}</Text>
        </View>
      )}
      <View style={s.boxBlue}>
        <Text style={s.textBold}>إجابة المتقدم:</Text>
        <Text>{userText || 'لم يجب'}</Text>
      </View>
    </View>
  );
}

function OrderingAnswerView({ q }) {
  const items = q.question_data?.items || [];
  const userItems =
    q.answer?.ordered_items || q.answer?.items || q.answer?.order || (Array.isArray(q.answer) ? q.answer : []);

  return (
    <View>
      <View style={s.boxGreen}>
        <Text style={s.textBold}>الترتيب الصحيح:</Text>
        {items.map((it, idx) => (
          <Text key={idx}>{idx + 1}. {it}</Text>
        ))}
      </View>
      <View style={s.boxBlue}>
        <Text style={s.textBold}>ترتيب المتقدم:</Text>
        {Array.isArray(userItems) && userItems.length > 0
          ? userItems.map((it, idx) => <Text key={idx}>{idx + 1}. {it}</Text>)
          : <Text>لم يجب</Text>}
      </View>
    </View>
  );
}

function MatchingAnswerView({ q }) {
  const pairs = q.question_data?.pairs || [];
  const userAns = q.answer || {};

  return (
    <View style={s.table}>
      <View style={[s.tableRow, s.tableHeader]}>
        <Text style={s.tableCol}>العنصر (أ)</Text>
        <Text style={s.tableCol}>المطابق الصحيح (ب)</Text>
        <Text style={s.tableCol}>اختيار المتقدم</Text>
      </View>
      {pairs.map((p, idx) => (
        <View key={idx} style={s.tableRow}>
          <Text style={s.tableCol}>{p.left}</Text>
          <Text style={[s.tableCol, s.textGreen]}>{p.right}</Text>
          <Text style={[s.tableCol, userAns[p.left] === p.right ? s.textGreen : s.textRed]}>
            {userAns[p.left] || '—'}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TrueFalseAnswerView({ q }) {
  const { correct_choice, model_justification } = q.question_data || {};
  const ans = q.answer || {};
  const userChoice = ans.choice === true ? 'صواب ✓' : ans.choice === false ? 'خطأ ✗' : 'لم يجب';

  return (
    <View>
      <View style={s.infoBox}>
        <Text>الإجابة الصحيحة: <Text style={s.textBold}>{correct_choice ? 'صواب ✓' : 'خطأ ✗'}</Text></Text>
        <Text>إجابة المتقدم: <Text style={s.textBold}>{userChoice}</Text></Text>
      </View>
      {model_justification && (
        <View style={s.boxGreen}>
          <Text style={s.textBold}>التعليل النموذجي:</Text>
          <Text>{model_justification}</Text>
        </View>
      )}
      {ans.justification && (
        <View style={s.boxBlue}>
          <Text style={s.textBold}>تعليل المتقدم:</Text>
          <Text>{ans.justification}</Text>
        </View>
      )}
    </View>
  );
}

function ExcelGridAnswerView({ q }) {
  const { instructions } = q.question_data || {};
  const grid = q.answer?.gridData;
  const instrText = stripHtml(instructions);
  const imgUrl = resolveImageUrl(q.image_path);

  return (
    <View>
      {instrText && (
        <View style={s.infoBox}>
          <Text style={s.textBold}>التعليمات:</Text>
          <Text>{instrText}</Text>
        </View>
      )}
      {imgUrl && <Image src={imgUrl} style={s.image} />}
      {grid && Array.isArray(grid) && grid.length > 0 ? (
        <View style={s.table}>
          {grid.map((row, ri) => (
            <View key={ri} style={[s.tableRow, ri === 0 && s.tableHeader]}>
              {row.map((cell, ci) => (
                <Text key={ci} style={[s.tableCol, ri === 0 && s.textBold]}>
                  {String(cell ?? '')}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View style={s.boxBlue}>
          <Text>لم يقم المتقدم بإدخال بيانات الجدول</Text>
        </View>
      )}
    </View>
  );
}

function SummarizeAnswerView({ q }) {
  const { reference_text, min_words, max_words } = q.question_data || {};
  const ans = q.answer || {};
  const userText = ans.text || stripHtml(ans.html) || '';

  return (
    <View>
      <View style={s.infoBox}>
        <Text style={s.textBold}>النص الأصلي للتلخيص:</Text>
        <Text>{stripHtml(reference_text)}</Text>
        {(min_words || max_words) && (
          <Text style={s.textMuted}>المطلوب: من {min_words || 0} إلى {max_words || '∞'} كلمة</Text>
        )}
      </View>
      <View style={s.boxBlue}>
        <Text style={s.textBold}>تلخيص المتقدم:</Text>
        <Text>{userText || 'لم يجب'}</Text>
        {ans.wordCount ? <Text style={s.textMuted}>عدد الكلمات: {ans.wordCount}</Text> : null}
      </View>
    </View>
  );
}

function MathFormulaAnswerView({ q }) {
  const { equation_prompt, expected_answer } = q.question_data || {};
  const ans = q.answer?.text || q.answer || '';

  return (
    <View>
      {equation_prompt && (
        <View style={s.infoBox}>
          <Text style={s.textBold}>السؤال:</Text>
          <Text>{equation_prompt}</Text>
          {expected_answer && <Text style={s.textMuted}>الإجابة النموذجية: {expected_answer}</Text>}
        </View>
      )}
      <View style={s.boxBlue}>
        <Text style={s.textBold}>إجابة المتقدم:</Text>
        <Text>{ans || 'لم يجب'}</Text>
      </View>
    </View>
  );
}

function GenericAnswerView({ q }) {
  const ans = q.answer;
  let display = 'لم يجب';
  if (ans !== null && ans !== undefined) {
    display = typeof ans === 'object' ? JSON.stringify(ans) : String(ans);
  }
  return (
    <View style={s.boxBlue}>
      <Text style={s.textBold}>إجابة المتقدم:</Text>
      <Text>{display}</Text>
    </View>
  );
}

function renderAnswer(q) {
  switch (q.q_type) {
    case 'single_choice':
    case 'multiple_choice':
    case 'select_all':  
      return <ChoiceAnswerView q={q} />;
    case 'sjt':
      return <SJTAnswerView q={q} />;
    case 'inline_dropdown':
      return <InlineDropdownAnswerView q={q} />;
    case 'proofreading':
      return <ProofreadingAnswerView q={q} />;
    case 'ordering':
      return <OrderingAnswerView q={q} />;
    case 'matching':
      return <MatchingAnswerView q={q} />;
    case 'true_false_justify':
      return <TrueFalseAnswerView q={q} />;
    case 'excel_grid':
    case 'image_to_excel':
    case 'image_to_word':
      return <ExcelGridAnswerView q={q} />;
    case 'summarize_word':
    case 'word_editor':
      return <SummarizeAnswerView q={q} />;
    case 'math_formula':
      return <MathFormulaAnswerView q={q} />;
    default:
      return <GenericAnswerView q={q} />;
  }
}

/* ══════════════════════════════════════════════════
   Main Document
   ══════════════════════════════════════════════════ */

export const ApplicantResultPdf = ({ data }) => {
  if (!data) return null;
  const { applicant = {}, job_model_name, details = [], violations = [] } = data;
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header ثابت */}
        <View style={s.header} fixed>
          <View>
            <Text style={s.headerTitle}>تقرير نتيجة الاختبار</Text>
            <Text style={s.headerSub}>المسمى الوظيفي: {job_model_name || '—'}</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#64748b', textAlign: 'right' }}>
            تاريخ التصدير: {new Date().toLocaleDateString('ar-EG')}
          </Text>
        </View>

        {/* بيانات المتقدم */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📋 بيانات المتقدم</Text>
          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>الاسم:</Text>
              <Text style={s.infoValue}>{applicant.full_name || '—'}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>الرقم القومي:</Text>
              <Text style={s.infoValue}>{applicant.national_id || '—'}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>كود الدخول:</Text>
              <Text style={s.infoValue}>{applicant.access_code || '—'}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>الهاتف:</Text>
              <Text style={s.infoValue}>{applicant.phone || '—'}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>الحالة:</Text>
              <Text style={s.infoValue}>{STATUS_LABELS[applicant.status] || applicant.status || '—'}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>الدرجة النهائية:</Text>
              <Text style={[s.infoValue, s.scoreText]}>
                {applicant.total_score ?? 0} / {applicant.max_score ?? 0}
              </Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>بدأ في:</Text>
              <Text style={s.infoValue}>{formatDate(applicant.exam_started_at)}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>انتهى في:</Text>
              <Text style={s.infoValue}>{formatDate(applicant.exam_finished_at)}</Text>
            </View>
          </View>
        </View>

        {/* المخالفات */}
        {violations.length > 0 && (() => {
            const summary = summarizeViolations(violations);
            const total = violations.length;

            return (
                <View style={s.card}>
                <Text style={s.cardTitle}>
                    ⚠️ سجل المخالفات — إجمالي {total} مخالفة ({summary.length} نوع)
                </Text>

                <View style={s.table}>
                    {/* رأس الجدول */}
                    <View style={[s.tableRow, s.tableHeader]}>
                    <Text style={[s.tableCol, { flex: 0.5 }]}>#</Text>
                    <Text style={[s.tableCol, { flex: 3 }]}>نوع المخالفة</Text>
                    <Text style={[s.tableCol, { flex: 0.8, textAlign: 'center' }]}>العدد</Text>
                    <Text style={[s.tableCol, { flex: 2 }]}>أول مرة</Text>
                    <Text style={[s.tableCol, { flex: 2 }]}>آخر مرة</Text>
                    </View>

                    {/* صفوف الأنواع المجمّعة */}
                    {summary.map((item, i) => (
                    <View key={item.type} style={s.tableRow}>
                        <Text style={[s.tableCol, { flex: 0.5 }]}>{i + 1}</Text>
                        <Text style={[s.tableCol, { flex: 3, fontWeight: 'bold' }]}>
                        {item.label}
                        </Text>
                        <Text
                        style={[
                            s.tableCol,
                            {
                            flex: 0.8,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: item.count >= 5 ? '#dc2626' : '#1e40af',
                            },
                        ]}
                        >
                        {item.count}
                        </Text>
                        <Text style={[s.tableCol, { flex: 2, fontSize: 7 }]}>
                        {formatDate(item.firstAt)}
                        </Text>
                        <Text style={[s.tableCol, { flex: 2, fontSize: 7 }]}>
                        {formatDate(item.lastAt)}
                        </Text>
                    </View>
                    ))}
                </View>

                {/* تنبيه لو عدد المخالفات كبير */}
                {total >= 10 && (
                    <View style={{ marginTop: 6, padding: 5, backgroundColor: '#fef2f2', borderRadius: 3 }}>
                    <Text style={{ fontSize: 8, color: '#b91c1c', fontWeight: 'bold', textAlign: 'right' }}>
                        ⚠️ عدد المخالفات مرتفع ({total}) — يُنصح بمراجعة سلوك المتقدم يدويًا.
                    </Text>
                    </View>
                )}
                </View>
            );
            })()}

        {/* تفاصيل الأسئلة */}
        <Text style={s.sectionTitle}>📝 تفاصيل الأسئلة والإجابات ({details.length})</Text>

        {details.map((q, idx) => {
          const hasAnswer = q.answer !== null && q.answer !== undefined;
          const isCorrect = q.is_correct === true;
          const typeLabel = Q_TYPE_LABELS[q.q_type] || q.q_type;

          return (
            <View key={q.question_id || idx} style={s.questionCard} wrap={false}>
              {/* رأس السؤال */}
              <View style={s.qHeader}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', flex: 1 }}>
                  <Text style={s.qNum}>{idx + 1}</Text>
                  <Text style={s.qType}>[{typeLabel}]</Text>
                  <Text style={s.qPoints}>{q.points} درجات</Text>
                </View>
                <View
                  style={[
                    s.statusBadge,s.statusEmpty
                  ]}
                >
                </View>
              </View>

              {/* نص السؤال */}
              <Text style={s.qText}>{q.question_text}</Text>

              {/* الصورة إن وجدت */}
              {q.image_path && q.q_type !== 'excel_grid' && q.q_type !== 'image_to_excel' && (
                <Image src={resolveImageUrl(q.image_path)} style={s.image} />
              )}

              {/* جسم الإجابة */}
              <View style={{ marginTop: 4 }}>{renderAnswer(q)}</View>

              {/* الدرجة */}
              <View style={s.qFooter}>
                <Text style={s.qScore}>
                  الدرجة: {q.score ?? 0} / {q.points ?? 0}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>مستند سري — نظام اختبارات التوظيف الإلكترونية</Text>
          <Text render={({ pageNumber, totalPages }) => `صفحة ${pageNumber} من ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};