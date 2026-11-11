import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { db } from '../hooks/db'

import { examApi } from '../api/examApi'
import { extractErrorMessage } from '../api/axiosClient'
import { EXAM_STORAGE_KEY } from '../constants'

let isSyncing = false // مانع التداخل (Race Condition Guard)

const dexieStorage = {
  getItem: async (name) => {
    const item = await db.store.get(name)
    return item ? item.value : null
  },
  setItem: async (name, value) => {
    await db.store.put({ key: name, value })
  },
  removeItem: async (name) => {
    await db.store.delete(name)
  },
}

export const useExamStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      duration_minutes: 0,
      count_questions: 0,
      questions: [],
      currentIndex: 0,
      answers: {},
      pendingQueue: [],
      syncStatus: 'idle',
      finished: false,
      finishResult: null,
      toastMessage: null,

      loginWithCode: async (accessCode) => {
        const state = get()

        if (
          state.token &&
          state.user &&
          (state.user.access_code === accessCode || state.user.code === accessCode) &&
          !state.finished &&
          state.questions.length > 0
        ) {
          return { success: true, resumed: true }
        }

        try {
          const { data } = await examApi.login(accessCode)

          const savedAnswers = {}
          if (Array.isArray(data.questions)) {
            data.questions.forEach((q) => {
              if (q.saved_answer) savedAnswers[q.id] = q.saved_answer
            })
          }

          set({
            token: data.token,
            user: data.user,
            duration_minutes: data.duration_minutes || 0,
            count_questions: data.job_model_count_questions || data.questions?.length || 0,
            questions: data.questions || [],
            answers: savedAnswers,
            pendingQueue: [],
            currentIndex: 0,
            finished: false,
            finishResult: null,
          })
          return { success: true, resumed: false }
        } catch (error) {
          return { success: false, message: extractErrorMessage(error, 'كود الدخول غير صحيح') }
        }
      },

      setAnswer: async (questionId, answerData) => {
        const { user } = get()
        const userCode = user?.access_code || user?.code || user?.id || 'unknown'

        set((state) => ({
          answers: { ...state.answers, [questionId]: answerData },
          pendingQueue: [
            ...state.pendingQueue.filter((item) => item.question_id !== questionId),
            { question_id: questionId, answer_data: answerData },
          ],
        }))

        try {
          await db.answers_archive.put({
            user_code: userCode,
            question_id: questionId,
            answer_data: answerData,
            timestamp: new Date().toISOString(),
            synced: false,
          })
        } catch (e) {
          console.error('Failed to save to backup archive:', e)
        }

        get().syncNow()
      },

      goToQuestion: (index) => {
        const { questions } = get()
        if (index < 0 || index >= questions.length) return
        set({ currentIndex: index })
      },

      syncNow: async () => {
        const { pendingQueue } = get()
        
        if (isSyncing || pendingQueue.length === 0) return

        isSyncing = true
        set({ syncStatus: 'syncing' })

        const batch = [...pendingQueue]
        try {
          const { data } = await examApi.saveBatch(batch)
          const succeededIds = new Set(
            (data.results || []).filter((r) => r.success).map((r) => r.question_id)
          )

          const { user } = get()
          const userCode = user?.access_code || user?.code || user?.id || 'unknown'
          
          if (succeededIds.size > 0) {
            await db.transaction('rw', db.answers_archive, async () => {
              for (const id of succeededIds) {
                const record = await db.answers_archive
                  .where('[user_code+question_id]')
                  .equals([userCode, id])
                  .first()
                if (record) {
                  await db.answers_archive.update(record.id, { synced: true })
                }
              }
            })
          }

          set((state) => ({
            pendingQueue: state.pendingQueue.filter((item) => !succeededIds.has(item.question_id)),
            syncStatus: succeededIds.size === batch.length ? 'ok' : 'error',
          }))
        } catch {
          set({ syncStatus: 'offline' })
        } finally {
          isSyncing = false
        }
      },

      logViolation: async (violationType, details) => {
        set({ toastMessage: details })

        setTimeout(() => {
          set({ toastMessage: null })
        }, 4000)

        try {
          await examApi.logViolation(violationType, details)
        } catch (error) {
          try {
            await db.offline_violations.add({
              violation_type: violationType,
              details: details,
              timestamp: new Date().toISOString(),
              synced: false,
            })
          } catch (e) {
            console.error('Failed to save violation offline:', e)
          }
        }
      },

      dismissToast: () => set({ toastMessage: null }),

      finishExam: async () => {
        const { pendingQueue } = get()
        if (pendingQueue.length > 0) {
          try {
            await examApi.saveBatch(pendingQueue)
          } catch {
            // اعتماداً على الأرشيف والـ local database
          }
        }
        try {
          const { data } = await examApi.finish()
          const finalResult = data.result

          // 🟢 1. تفريغ الـ IndexedDB عبر Dexie مباشرة
          await db.store.clear() // تفرغ جدول Zustand Persist
          
          // (اختياري) لو عايز تمسح الأرشيف والمخالفات بعد التسليم الفعلي النجاح:
          // await db.answers_archive.clear()
          // await db.offline_violations.clear()

          // 🟢 2. تصنيع حالة الإنهاء في الـ State
          set({
            token: null,
            user: null,
            duration_minutes: 0,
            count_questions: 0,
            questions: [],
            currentIndex: 0,
            answers: {},
            pendingQueue: [],
            syncStatus: 'idle',
            finished: true,
            finishResult: finalResult,
          })

          return { success: true }
        } catch (error) {
          return { success: false, message: extractErrorMessage(error, 'تعذر تسليم الاختبار') }
        }
      },

      reset: async () => {
        // 🟢 حذف البيانات المخزنة محلياً عند الـ Reset
        try {
          await db.store.delete(EXAM_STORAGE_KEY)
        } catch (e) {
          console.error('Failed to clear dexie storage:', e)
        }

        set({
          token: null,
          user: null,
          duration_minutes: 0,
          count_questions: 0,
          questions: [],
          currentIndex: 0,
          answers: {},
          pendingQueue: [],
          syncStatus: 'idle',
          finished: false,
          finishResult: null,
        })
      },
    }),
    {
      name: EXAM_STORAGE_KEY,
      storage: createJSONStorage(() => dexieStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        duration_minutes: state.duration_minutes,
        count_questions: state.count_questions,
        questions: state.questions,
        answers: state.answers,
        pendingQueue: state.pendingQueue,
        currentIndex: state.currentIndex,
        finished: state.finished,
        finishResult: state.finishResult,
      }),
    }
  )
)