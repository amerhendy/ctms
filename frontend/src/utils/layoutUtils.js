// src/utils/layoutUtils.js
import dagre from 'dagre'

/**
 * ترتيب العقد باستخدام خوارزمية dagre
 * @param {Array} nodes - قائمة العقد (يجب أن تحتوي على id و position)
 * @param {Array} edges - قائمة الحواف (يجب أن تحتوي على source و target)
 * @param {Object} options - خيارات إضافية
 * @param {string} options.direction - اتجاه التخطيط: 'TB' (من الأعلى للأسفل), 'LR' (من اليسار لليمين)
 * @param {number} options.nodeWidth - عرض العقدة الافتراضي
 * @param {number} options.nodeHeight - ارتفاع العقدة الافتراضي
 * @param {number} options.rankSep - المسافة بين الرتب (الطبقات)
 * @param {number} options.nodeSep - المسافة بين العقد في نفس الرتبة
 * @returns {Array} - العقد مع إحداثيات جديدة
 */
export function layoutNodes(nodes, edges, options = {}) {
  const {
    direction = 'TB', // 'TB' (Top-Bottom) أو 'LR' (Left-Right)
    nodeWidth = 220,
    nodeHeight = 120,
    rankSep = 80,
    nodeSep = 40,
  } = options

  if (!nodes || nodes.length === 0) return nodes

  // 1. إنشاء رسم بياني جديد من dagre
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
    edgesep: 20,
    marginx: 30,
    marginy: 30,
  })
  g.setDefaultEdgeLabel(() => ({}))

  // 2. إضافة العقد إلى الرسم البياني مع أبعادها
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    })
  })

  // 3. إضافة الحواف
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  // 4. تنفيذ خوارزمية التخطيط
  dagre.layout(g)

  // 5. استخراج الإحداثيات الجديدة للعقد
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return layoutedNodes
}

/**
 * ترتيب العقد مع الحفاظ على الإعدادات الحالية
 * @param {Array} nodes - قائمة العقد
 * @param {Array} edges - قائمة الحواف
 * @param {string} direction - اتجاه التخطيط
 * @returns {Array} - العقد مع إحداثيات جديدة
 */
export function autoLayout(nodes, edges, direction = 'TB') {
  if (nodes.length === 0) return nodes

  // إذا كانت هناك عقدة واحدة فقط، نضعها في المنتصف
  if (nodes.length === 1) {
    return [
      {
        ...nodes[0],
        position: { x: 250, y: 150 },
      },
    ]
  }

  return layoutNodes(nodes, edges, {
    direction,
    nodeWidth: Math.min(220, Math.max(180, 200)),
    nodeHeight: Math.min(130, Math.max(100, 110)),
    rankSep: 100,
    nodeSep: 50,
  })
}

export default { layoutNodes, autoLayout }