// src/utils/db.js
import { openDB, deleteDB } from 'idb';
const DB_NAME_PREFIX = 'CTMS_db_';

export const initUserDB = async (userId) => {
  return await openDB(`${DB_NAME_PREFIX}${userId}`, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('treeState')) {
        db.createObjectStore('treeState');
      }
    },
  });
};
export const clearUserDB = async (userId) => {
  try {
    await deleteDB(`${DB_NAME_PREFIX}${userId}`);
  } catch (e) {
    console.error("Failed to clear DB", e);
  }
};

export const saveTreeData = async (userId, data) => {
  const db = await initUserDB(userId);
  await db.put('treeState', data, 'currentTree');
};

export const getTreeData = async (userId) => {
  const db = await initUserDB(userId);
  return await db.get('treeState', 'currentTree');
};
