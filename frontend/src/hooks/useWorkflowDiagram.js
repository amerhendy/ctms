// src/hooks/useWorkflowDiagram.js
import { useCallback, useState, useEffect } from 'react'
import {
  useNodesState,
  useEdgesState,
  addEdge,
  //Connection,
  //Edge,
  //Node,
} from 'reactflow'
import { v4 as uuidv4 } from 'uuid'
import { autoLayout } from '@/utils/layoutUtils'
import { detectCycle } from '@/utils/graphUtils'

/**
 * Hook مخصص لإدارة حالة الرسم البياني (Nodes + Edges) في ReactFlow.
 * يوفر دوال للإضافة والحذف والتحديث ومعالجة التغييرات.
 *
 * @param {Array} initialNodes - العقد الابتدائية (اختياري)
 * @param {Array} initialEdges - الحواف الابتدائية (اختياري)
 * @param {Object} options - خيارات إضافية
 * @param {boolean} options.snapToGrid - تفعيل المحاذاة للشبكة (افتراضي: true)
 * @param {number} options.snapGap - حجم الشبكة (افتراضي: 15)
 * @returns {Object} {
 *   nodes, edges,
 *   onNodesChange, onEdgesChange, onConnect,
 *   addStepNode, removeNode, updateNode, updateEdge,
 *   toggleParallel, getNextStepOrder,
 *   setNodes, setEdges, clearDiagram,
 *   getDiagramData, getWorkflowData,
 *   selectedNodeId, setSelectedNodeId,
 * }
 */
export function useWorkflowDiagram(initialNodes = [], initialEdges = [], options = {}) {
  const {
    snapToGrid = true,
    snapGap = 15,
  } = options

  // حالة العقد والحواف
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  // تحديث الحالة عند تغير البيانات الواردة
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes)
    }
  }, [initialNodes, setNodes])

  useEffect(() => {
    if (initialEdges.length > 0) {
      setEdges(initialEdges)
    }
  }, [initialEdges, setEdges])

  // ─── حساب الـ step_order التالي ──────────────────────────────
  const getNextStepOrder = useCallback(() => {
    // 1. حساب أعلى step_order موجود
    const maxOrder = nodes.reduce((max, node) => {
      const order = node.data?.step_order || 0
      return order > max ? order : max
    }, 0)

    // 2. إذا كانت العقدة الأخيرة متوازية، نضيف في نفس الـ order
    //    وإلا نضيف order جديد
    const lastNode = nodes.length > 0 ? nodes[nodes.length - 1] : null
    const lastOrder = lastNode?.data?.step_order || 0
    const isLastParallel = lastNode?.data?.is_parallel || false

    // إذا كانت العقدة الأخيرة متوازية، نضيف في نفس الـ order
    if (isLastParallel && lastOrder === maxOrder) {
      return maxOrder
    }

    // وإلا نضيف order جديد
    return maxOrder + 1
  }, [nodes])

  // ─── إضافة عقدة خطوة جديدة ─────────────────────────────────
  const addStepNode = useCallback(
    (position = null, data = null) => {
      // توليد إحداثيات جديدة (إذا لم يتم تحديدها)
      let newPosition = position
      if (!newPosition) {
        const baseX = 250 + Math.random() * 100
        const baseY = 150 + Math.random() * 100
        newPosition = { x: baseX, y: baseY }
      }

      // حساب الـ step_order التلقائي
      const nextOrder = getNextStepOrder()

      // البيانات الافتراضية للخطوة الجديدة
      const defaultData = {
        label: `خطوة ${nodes.length + 1}`,
        description: '',
        status: 'pending',
        step_order: nextOrder,
        is_parallel: false,
        assigned_user_id: null,
        assigned_user_name: null,
        assigned_department_id: null,
        assigned_department_name: null,
        is_editable: true,
        is_completable: false,
        parent_step_id:false
      }

      // إنشاء العقدة الجديدة
      const newNode = {
        id: `node-${uuidv4()}`,
        type: 'step',
        position: newPosition,
        data: { ...defaultData, ...data },
      }
      setNodes((prevNodes) => [...prevNodes, newNode])

      // تحديد العقدة الجديدة
      setSelectedNodeId(newNode.id)

      return newNode
    },
    [nodes.length, getNextStepOrder, setNodes]
  )

  // ─── تبديل حالة التوازي (Parallel) ──────────────────────────
  const toggleParallel = useCallback(
    (nodeId) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id === nodeId) {
            const currentParallel = node.data?.is_parallel || false
            const newParallel = !currentParallel

            // إذا كنا نفعّل التوازي، نحتاج أن نعطي نفس الـ step_order
            // للعقدة السابقة (إذا كانت موجودة)
            let newStepOrder = node.data?.step_order || 1

            if (newParallel) {
              // البحث عن العقدة السابقة في نفس الترتيب أو التي تسبقها
              const currentOrder = node.data?.step_order || 1
              const previousNodes = prevNodes
                .filter((n) => n.id !== nodeId && (n.data?.step_order || 0) <= currentOrder)
                .sort((a, b) => (b.data?.step_order || 0) - (a.data?.step_order || 0))

              if (previousNodes.length > 0) {
                const prevNode = previousNodes[0]
                // إذا كانت العقدة السابقة في نفس الـ order، نأخذ نفس الـ order
                // وإلا نأخذ order العقدة السابقة
                if (prevNode.data?.step_order === currentOrder) {
                  newStepOrder = currentOrder
                } else {
                  newStepOrder = prevNode.data?.step_order || 1
                }
              }
            }

            return {
              ...node,
              data: {
                ...node.data,
                is_parallel: newParallel,
                step_order: newStepOrder,
              },
            }
          }
          return node
        })
      )

      // تحديث العقد المتأثرة (العقد التي تليها بنفس الـ order)
      // لضمان بقاء التوازي صحيحاً
      setNodes((prevNodes) => {
        const updatedNodes = [...prevNodes]
        const toggledNode = updatedNodes.find((n) => n.id === nodeId)
        if (!toggledNode) return prevNodes

        const order = toggledNode.data?.step_order || 1
        const isParallel = toggledNode.data?.is_parallel || false

        // إذا تم إلغاء التوازي، نعيد ترتيب العقد التي كانت بنفس الـ order
        if (!isParallel) {
          // العقد التي بنفس الـ order (عدا العقدة المحددة)
          const sameOrderNodes = updatedNodes
            .filter((n) => n.id !== nodeId && (n.data?.step_order || 0) === order)
            .sort((a, b) => {
              // ترتيب حسب الموقع Y
              return (a.position?.y || 0) - (b.position?.y || 0)
            })

          // إعادة ترتيبها
          let newOrder = order
          sameOrderNodes.forEach((node, index) => {
            // إذا كانت العقدة متوازية، نبقيها في نفس الـ order
            if (node.data?.is_parallel) {
              // نتركها
            } else {
              // نعطيها order جديد
              newOrder += 1
              node.data.step_order = newOrder
            }
          })
        }

        return updatedNodes
      })
    },
    [setNodes]
  )

  // ─── حذف عقدة ──────────────────────────────────────────────
  const removeNode = useCallback(
    (nodeId) => {
      // جلب العقدة قبل حذفها (للمعرفة)
      const nodeToRemove = nodes.find((n) => n.id === nodeId)
      const removedOrder = nodeToRemove?.data?.step_order || 0

      // 1. حذف العقدة
      setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId))

      // 2. حذف جميع الحواف المرتبطة بها
      setEdges((prevEdges) =>
        prevEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      )

      // 3. إعادة ترتيب العقد التي كانت بنفس الـ order (إذا كانت متوازية)
      if (removedOrder > 0) {
        setNodes((prevNodes) => {
          const sameOrderNodes = prevNodes
            .filter((n) => (n.data?.step_order || 0) === removedOrder)
            .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0))

          // إذا كان هناك عقدتان أو أكثر بنفس الـ order، نحافظ عليهما
          // وإلا نعيد ترقيم الـ order
          if (sameOrderNodes.length === 0) {
            // لا توجد عقد بنفس الـ order، نعيد ترقيم العقد التالية
            return prevNodes.map((n) => {
              if ((n.data?.step_order || 0) > removedOrder) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    step_order: (n.data?.step_order || 0) - 1,
                  },
                }
              }
              return n
            })
          }
          return prevNodes
        })
      }

      // 4. إلغاء التحديد إذا كانت هي المحددة
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null)
      }
    },
    [nodes, selectedNodeId, setNodes, setEdges]
  )

  // ─── تحديث عقدة ─────────────────────────────────────────────
  const updateNode = useCallback(
    (nodeId, newData) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      )
    },
    [setNodes]
  )

  // ─── تحديث حافة ─────────────────────────────────────────────
  const updateEdge = useCallback(
    (edgeId, newData) => {
      setEdges((prevEdges) =>
        prevEdges.map((edge) =>
          edge.id === edgeId
            ? { ...edge, ...newData }
            : edge
        )
      )
    },
    [setEdges]
  )

  // ─── مسح الرسم البياني بالكامل ────────────────────────────
  const clearDiagram = useCallback(() => {
    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
  }, [setNodes, setEdges])

  // ─── معالج الاتصال (إضافة حافة جديدة) ──────────────────────
  const onConnect = useCallback(
    (connection) => {
      // 1. منع الحافة الذاتية (نفس العقدة)
      if (connection.source === connection.target) {
        console.warn('لا يمكن ربط العقدة بنفسها')
        return
      }

      // 2. التحقق من عدم وجود حافة مكررة
      const isDuplicate = edges.some(
        (edge) => edge.source === connection.source && edge.target === connection.target
      )
      if (isDuplicate) {
        console.warn('هذه الحافة موجودة بالفعل')
        return
      }
      // 3. 🆕 التحقق من أن إضافة هذه الحافة لا تسبب دورة
      //    نقوم بمحاكاة إضافة الحافة مؤقتاً ثم التحقق
      const tempEdges = [...edges, { ...connection, id: 'temp' }]
      const { hasCycle } = detectCycle(nodes, tempEdges)
      if (hasCycle) {
        toast.error('لا يمكن إضافة هذه العلاقة لأنها ستسبب دورة مغلقة')
        return
      }


      // 3. إضافة الحافة الجديدة
      const newEdge = {
        ...connection,
        id: `edge-${uuidv4()}`,
        type: 'animated', // ← النوع الجديد
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        data: {
          status: 'pending', // الحالة الافتراضية للعلاقة الجديدة
          label: 'يعتمد على',
        },
      }
      setEdges((prevEdges) => addEdge(newEdge, prevEdges))
    },
    [edges, setEdges]

  )

  // ─── الحصول على بيانات الرسم البياني (للتخزين في API) ────
  const getDiagramData = useCallback(() => {
    return {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.animated,
        data: edge.data,
      })),
    }
  }, [nodes, edges])

  // ─── الحصول على بيانات الـ Workflow (للتخزين في API) ──────
  const getWorkflowData = useCallback(() => {
    const steps = nodes.map((node) => ({
      title: node.data.label,
      description: node.data.description || null,
      step_order: node.data.step_order || 1,
      is_parallel: node.data.is_parallel || false,
      assigned_user_id: node.data.assigned_user_id || null,
      assigned_department_id: node.data.assigned_department_id || null,
    }))

    const dependencies = edges.map((edge) => ({
      parent_step_id: parseInt(edge.source.split('-')[1]) || 0,
      child_step_id: parseInt(edge.target.split('-')[1]) || 0,
    }))

    return { steps, dependencies }
  }, [nodes, edges])

  // ─── إعادة تعيين العقد والحواف ──────────────────────────────
  const setDiagramData = useCallback(
    (newNodes, newEdges) => {
      if (newNodes) setNodes(newNodes)
      if (newEdges) setEdges(newEdges)
    },
    [setNodes, setEdges]
  )
    // ─── تطبيق الترتيب التلقائي ──────────────────────────────────
  const applyLayout = useCallback(
    (direction = 'TB') => {
      if (nodes.length === 0) return

      const layoutedNodes = autoLayout(nodes, edges, direction)
      setNodes(layoutedNodes)
    },
    [nodes, edges, setNodes]
  )


  // ─── تصدير الـ API ──────────────────────────────────────────
  return {
    // الحالة الأساسية
    nodes,
    edges,
    selectedNodeId,

    // معالجات ReactFlow
    onNodesChange,
    onEdgesChange,
    onConnect,

    // دوال التعديل
    addStepNode,
    removeNode,
    updateNode,
    updateEdge,
    toggleParallel,      // 🆕 تبديل التوازي
    getNextStepOrder,    // 🆕 حساب الـ order التالي
    clearDiagram,

    // دوال التحكم في التحديد
    setSelectedNodeId,

    setNodes,
    setEdges,

    // دوال التصدير
    getDiagramData,
    getWorkflowData,
    setDiagramData,
    applyLayout,
  }
}

export default useWorkflowDiagram