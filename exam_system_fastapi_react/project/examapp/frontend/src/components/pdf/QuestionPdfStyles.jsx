import { StyleSheet, Font } from '@react-pdf/renderer';

const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

Font.register({
  family: 'Tajawal',
  fonts: [
    { 
      src: `${baseUrl}/fonts/Tajawal-Regular.ttf`, 
      fontWeight: 'normal' 
    },
    { 
      src: `${baseUrl}/fonts/Tajawal-Bold.ttf`, 
      fontWeight: 'bold' 
    },
  ],
});

export const styles = StyleSheet.create({
  page: {
    paddingTop: 70,
    paddingBottom: 60,
    paddingHorizontal: 30,
    fontFamily: 'Tajawal',
    fontSize: 9,
    direction: 'rtl',
    backgroundColor: '#ffffff',
  },
  
  // Header Fixed
  header: {
    position: 'absolute',
    top: 20,
    left: 30,
    right: 30,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1e293b',
    borderBottomStyle: 'solid',
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 8,
    color: '#475569',
    marginTop: 2,
  },

  // Footer Fixed
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 8,
    color: '#64748b',
  },

  // Question Card General
  questionCard: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  questionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  questionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    width: '85%',
    textAlign: 'right',
  },
  badgePoints: {
    fontSize: 8,
    color: '#1e40af',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },

  // Utility Boxes
  boxGray: {
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 3,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  boxGreen: {
    backgroundColor: '#f0fdf4',
    padding: 6,
    borderRadius: 3,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#bbf7d0',
  },
  textBold: {
    fontWeight: 'bold',
  },
  textGreen: {
    color: '#15803d',
    fontWeight: 'bold',
  },
  textRed: {
    color: '#b91c1c',
  },

  // Table Styles
  table: {
    width: '100%',
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    padding: 4,
  },
  tableColHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
  },
  tableCol: {
    flex: 1,
    textAlign: 'right',
    fontSize: 8,
  },
});