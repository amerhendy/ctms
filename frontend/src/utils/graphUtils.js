// src/utils/graphUtils.js

/**
 * التحقق من وجود دورة (Cycle) في رسم بياني موجه (Directed Graph)
 * باستخدام خوارزمية DFS (Depth First Search) مع ثلاث حالات:
 * - 0: لم يتم زيارته
 * - 1: قيد الزيارة (في مسار البحث الحالي)
 * - 2: تمت زيارته بالكامل
 *
 * @param {Array} nodes - قائمة العقد (كل عقدة لها id)
 * @param {Array} edges - قائمة الحواف (كل حافة لها source و target)
 * @returns {Object} - { hasCycle: boolean, cyclePath: Array<string> | null }
 */
export function detectCycle(nodes, edges) {
  // 1. بناء جدول الجوار (Adjacency List)
  const graph = new Map()
  
  // تهيئة كل عقدة بقائمة فارغة
  nodes.forEach(node => {
    graph.set(node.id, [])
  })

  // إضافة الحواف
  edges.forEach(edge => {
    const source = edge.source
    const target = edge.target
    // التأكد من وجود المصدر والهدف في قائمة العقد
    if (graph.has(source) && graph.has(target)) {
      graph.get(source).push(target)
    }
  })

  // 2. خوارزمية DFS للكشف عن الدورات
  const visited = new Map() // 0 = unvisited, 1 = visiting, 2 = visited
  const recursionStack = new Set()
  const path = [] // لتتبع مسار الدورة (للعرض في رسالة الخطأ)

  // تهيئة جميع العقد كـ unvisited
  nodes.forEach(node => {
    visited.set(node.id, 0)
  })

  function dfs(nodeId) {
    // وضع العقدة كـ "قيد الزيارة"
    visited.set(nodeId, 1)
    recursionStack.add(nodeId)
    path.push(nodeId)

    const neighbors = graph.get(nodeId) || []
    for (const neighbor of neighbors) {
      // إذا كان الجار غير مُزار، نستمر في DFS
      if (visited.get(neighbor) === 0) {
        if (dfs(neighbor)) {
          return true
        }
      }
      // إذا كان الجار في "قيد الزيارة"، فقد وجدنا دورة
      else if (visited.get(neighbor) === 1) {
        // بناء مسار الدورة من أول ظهور للـ neighbor في الـ path
        const cycleStartIndex = path.indexOf(neighbor)
        const cyclePath = path.slice(cycleStartIndex)
        return true
      }
    }

    // انتهينا من زيارة هذه العقدة
    visited.set(nodeId, 2)
    recursionStack.delete(nodeId)
    path.pop()
    return false
  }

  // تشغيل DFS على كل عقدة غير مُزارة
  for (const node of nodes) {
    if (visited.get(node.id) === 0) {
      // إعادة تهيئة المسار لكل بداية جديدة
      path.length = 0
      if (dfs(node.id)) {
        // استخراج مسار الدورة من الـ path
        const cycleStartIndex = path.indexOf(path[path.length - 1])
        const cyclePath = path.slice(cycleStartIndex)
        return {
          hasCycle: true,
          cyclePath: cyclePath.map(id => {
            const node = nodes.find(n => n.id === id)
            return node?.data?.label || id
          }),
        }
      }
    }
  }

  return { hasCycle: false, cyclePath: null }
}

/**
 * دالة مبسطة للتحقق من وجود دورة وإرجاع رسالة خطأ مناسبة
 * @param {Array} nodes
 * @param {Array} edges
 * @returns {string | null} - رسالة الخطأ أو null إذا لم توجد دورة
 */
export function getCycleErrorMessage(nodes, edges) {
  const { hasCycle, cyclePath } = detectCycle(nodes, edges)
  if (!hasCycle) return null

  if (cyclePath && cyclePath.length > 0) {
    return `توجد دورة مغلقة في تبعيات الخطوات: ${cyclePath.join(' → ')}. يرجى إزالة هذه العلاقة الدائرية.`
  }
  return 'توجد دورة مغلقة في تبعيات الخطوات. يرجى إزالة العلاقات الدائرية.'
}

export default { detectCycle, getCycleErrorMessage }