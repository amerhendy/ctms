// useIndexedJson.js
import { useEffect } from 'react';
import { db } from '../hooks/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function useIndexedJson(docId = 'main_config', initialData = {}) {
  // 1. التأكد من وجود المستند الأولي (Initialization Side-Effect)
  useEffect(() => {
    let isMounted = true;

    async function initDocument() {
      try {
        const doc = await db.userSettings.get(docId);
        if (!doc && isMounted) {
          // استخدام put لتجنب أخطاء المفاتيح المكررة في حالة التزامن
          await db.userSettings.put({ id: docId, ...initialData });
        }
      } catch (error) {
        console.error('Error initializing indexed document:', error);
      }
    }

    initDocument();

    return () => {
      isMounted = false;
    };
  }, [docId]);

  // 2. قراءة المستند ومراقبته (Pure Read Operation)
  const data = useLiveQuery(
    async () => {
      const doc = await db.userSettings.get(docId);
      return doc || { id: docId, ...initialData };
    },
    [docId],
    undefined // Value if loading
  );

  // 3. تحديث مسار محدد (مثل "theme" أو "profile.name")
  const updatePatch = async (path, value) => {
    try {
      await db.userSettings.update(docId, {
        [path]: value,
      });
    } catch (error) {
      console.error(`Error updating field [${path}]:`, error);
    }
  };

  // 4. تحديث مجمّع لعدة حقول في وقت واحد
  const updateMultipleFields = async (fieldsObject) => {
    try {
      await db.userSettings.update(docId, fieldsObject);
    } catch (error) {
      console.error('Error updating multiple fields:', error);
    }
  };

  // 5. استبدال الكائن بالكامل أو دمج كائن جديد
  const resetOrSetData = async (newData) => {
    try {
      await db.userSettings.put({ id: docId, ...newData });
    } catch (error) {
      console.error('Error resetting document data:', error);
    }
  };

  return {
    data: data || { id: docId, ...initialData },
    loading: data === undefined,
    updatePatch,
    updateMultipleFields,
    resetOrSetData,
  };
}