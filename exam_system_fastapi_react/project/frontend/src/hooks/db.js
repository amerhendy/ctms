// db.js
import Dexie from 'dexie';

export const db = new Dexie('ExamAppDB');

// تعريف الـ Stores والـ Indexing
db.version(1).stores({
  store: 'key'
});
db.version(2.2).stores({
  store: 'key',
  answers_archive: '++id, [user_code+question_id], user_code, question_id, timestamp, synced',
  offline_violations: '++id, violation_type, timestamp, synced'
})