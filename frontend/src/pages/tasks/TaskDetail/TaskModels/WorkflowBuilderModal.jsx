// src/pages/tasks/TaskDetail/TaskModels/WorkflowBuilderModal.jsx
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Panel,
} from 'reactflow'
import AnimatedEdge from '@/components/workflow/AnimatedEdge'
import {
  Plus,
  Save,
  X,
  Loader2,
  GitBranch,
  Users,
  Building2,
  Trash2,
  Edit3,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlertCircle,
  Layout,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { Modal } from '@/components/common'
import { theme } from '@/constants/theme'
import { getApiError } from '@/utils/helpers'
import useWorkflowDiagram from '@/hooks/useWorkflowDiagram'
import CustomNode from '@/components/workflow/CustomNode'
import 'reactflow/dist/style.css'
import { workflowApi, workflowTemplatesApi } from '@/api/workflow'
import { detectCycle, getCycleErrorMessage } from '@/utils/graphUtils'
import { autoLayout } from '@/utils/layoutUtils'
import SidebarTree from '@/pages/tasks/TaskDetail/SidebarTree'



// ── المكوّن الداخلي (الذي يستخدم ReactFlow) ──────────────────
function WorkflowBuilderInner({
  taskId,
  templateId,        // 🆕 للقوالب
  mode = 'task',     // 🆕 'task' | 'template'
  existingDiagram = null,
  onClose,
  onSuccess,
  isEdit = false,
}) {
  // ── ١. إعداد الـ Hook ──────────────────────────────────────────
  const initialNodes = existingDiagram?.nodes || []
  const initialEdges = (existingDiagram?.edges || [])
  // خطوة 1: إزالة الحواف المكررة بناءً على source-target
  .filter((edge, index, self) => 
    index === self.findIndex(e => e.source === edge.source && e.target === edge.target)
  )
  // خطوة 2: إعادة تعيين ID فريد لكل حافة
  .map((edge, index) => ({
    ...edge,
    id: `${edge.source}-${edge.target}-${index}`,
  }));


  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addStepNode,
    removeNode,
    updateNode,
    clearDiagram,
    getDiagramData,
    selectedNodeId,
    setSelectedNodeId,
    applyLayout,      // من المهمة 7.2
    toggleParallel,   
    setEdges,
  } = useWorkflowDiagram(initialNodes, initialEdges, { snapToGrid: true, snapGap: 15 })

  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingNodeId, setEditingNodeId] = useState(null)
  const [editFormData, setEditFormData] = useState({})

  const [showPickerModal, setShowPickerModal] = useState(false)
  const [pickerTarget, setPickerTarget] = useState(null) // 'user' | 'department'
  
  const edgeTypes = useMemo(() => ({
    animated: AnimatedEdge, // ← نفس النوع اللي استخدمناه في defaultEdgeOptions
  }), []);
  const edgesWithType = edges.map(edge => ({
    ...edge,
    type: 'animated',
  }));


  // ── ٢. معالج إضافة خطوة جديدة ──────────────────────────────────
  const handleAddStep = useCallback(() => {
    // حساب موقع مناسب في وسط الشاشة
    const viewportCenter = reactFlowInstance
      ? reactFlowInstance.getViewport()
      : { x: 0, y: 0, zoom: 1 }

    const centerX = (window.innerWidth / 2 - 150) / viewportCenter.zoom - viewportCenter.x
    const centerY = (window.innerHeight / 2 - 100) / viewportCenter.zoom - viewportCenter.y

    const newNode = addStepNode(
      { x: centerX + Math.random() * 50, y: centerY + Math.random() * 50 },
      {
        label: `خطوة ${nodes.length + 1}`,
        step_order: nodes.length + 1,
      }
    )
    console.log(newNode)

    // فتح محرر التعديل فوراً
    setEditingNodeId(newNode.id)
    setEditFormData(newNode.data)
  }, [addStepNode, nodes.length, reactFlowInstance])

  // ── ٣. معالج حفظ البيانات ──────────────────────────────────────
  const handleSave = useCallback(async () => {
    // التحقق من وجود خطوات
    if (nodes.length === 0) {
      toast.error('لا يمكن حفظ Workflow بدون خطوات')
      return
    }

    // التحقق من أن كل خطوة لها مسؤول
    const invalidNode = nodes.find(
      (node) =>
        !node.data.assigned_user_id && !node.data.assigned_department_id
    )
    if (invalidNode) {
      toast.error(`الخطوة "${invalidNode.data.label}" ليس لها مسؤول محدد`)
      return
    }

    // 🆕 التحقق من عدم وجود دوائر مغلقة (Cyclic Dependencies)
    const cycleError = getCycleErrorMessage(nodes, edges)
    if (cycleError) {
      toast.error(cycleError)
      return
    }


    // التحقق من عدم وجود دوائر مغلقة (سيتم التحقق في الباك اند أيضاً)
    // يمكن إضافة تحقق بسيط هنا باستخدام خوارزمية DFS

    setIsSaving(true)
    try {
      const rawData = getDiagramData();
      const uniqueEdges = rawData.edges
        .filter((edge, index, self) =>
          index === self.findIndex(e => e.source === edge.source && e.target === edge.target)
        )
        .map((edge, index) => ({
          ...edge,
          id: `${edge.source}-${edge.target}-${index}`, // ID فريد
        }));

      const diagramData = {
        nodes: rawData.nodes,
        edges: uniqueEdges,
      };


      if (mode === 'template') {
        // 🆕 وضع القوالب
        if (isEdit && templateId) {
          await workflowTemplatesApi.updateDiagram(templateId, diagramData)
          toast.success('تم تحديث القالب بنجاح')
        } else {
          // إنشاء قالب جديد
          await workflowTemplatesApi.create({
            name: 'قالب جديد',
            description: '',
            steps: diagramData.nodes.map(n => ({
              title: n.data.label,
              description: n.data.description || null,
              step_order: n.data.step_order || 1,
              is_parallel: n.data.is_parallel || false,
              assigned_user_id: n.data.assigned_user_id || null,
              assigned_department_id: n.data.assigned_department_id || null,
            }))
          })
          toast.success('تم إنشاء القالب بنجاح')
        }
      } else {
        // وضع المهام (الكود الموجود)
        if (isEdit) {
          await workflowApi.updateDiagram(taskId, diagramData)
          toast.success('تم تحديث الـ Workflow بنجاح')
        } else {
          await workflowApi.create(taskId, { 
            steps: diagramData.nodes.map(n => ({
              title: n.data.label,
              description: n.data.description || null,
              step_order: n.data.step_order || 1,
              is_parallel: n.data.is_parallel || false,
              assigned_user_id: n.data.assigned_user_id || null,
              assigned_department_id: n.data.assigned_department_id || null,
            }))
          })
          toast.success('تم إنشاء الـ Workflow بنجاح')
        }
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(getApiError(error) || 'فشل الحفظ')
    } finally {
      setIsSaving(false)
    }
  }, [nodes, getDiagramData, isEdit, mode, taskId, templateId, onSuccess, onClose])

  // ── ٤. معالج حذف عقدة ──────────────────────────────────────────
  const handleRemoveNode = useCallback(
    (nodeId) => {
      if (window.confirm('هل تريد حذف هذه الخطوة نهائياً؟')) {
        removeNode(nodeId)
        setEditingNodeId(null)
        setSelectedNodeId(null)
      }
    },
    [removeNode, setSelectedNodeId]
  )

  // ── ٥. معالج فتح/غلق محرر التعديل ─────────────────────────────
  const handleEditNode = useCallback(
    (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        setEditingNodeId(nodeId)
        setEditFormData(node.data)
      }
    },
    [nodes]
  )

  const handleCloseEditor = useCallback(() => {
    setEditingNodeId(null)
    setEditFormData({})
  }, [])

  const handleSaveNodeEdit = useCallback(() => {
    if (editingNodeId) {
      updateNode(editingNodeId, editFormData)
      setEditingNodeId(null)
      setEditFormData({})
      toast.success('تم تحديث الخطوة')
    }
  }, [editingNodeId, editFormData, updateNode])

  // ── ٦. معالج التكبير/التصغير ──────────────────────────────────
  const handleZoomIn = useCallback(() => {
    if (reactFlowInstance) reactFlowInstance.zoomIn()
  }, [reactFlowInstance])

  const handleZoomOut = useCallback(() => {
    if (reactFlowInstance) reactFlowInstance.zoomOut()
  }, [reactFlowInstance])

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2 })
  }, [reactFlowInstance])

  // ── معالج تبديل التوازي ──────────────────────────────────────────
const handleToggleParallel = useCallback(
  (nodeId) => {
    toggleParallel(nodeId)
  },
  [toggleParallel]
)
// ── تعريف أنواع العقد المخصصة ──────────────────────────────────
// ── معالج تعديل العقدة ──────────────────────────────────────────
const handleEditNodeFromNode = useCallback((nodeId) => {
  // نبحث عن العقدة في القائمة
  const node = nodes.find(n => n.id === nodeId);
  if (node) {
    setEditingNodeId(nodeId);
    setEditFormData(node.data);
  }
}, [nodes]);

// ── معالج حذف العقدة ────────────────────────────────────────────
const handleDeleteNodeFromNode = useCallback((nodeId) => {
  if (window.confirm('هل تريد حذف هذه الخطوة نهائياً؟')) {
    removeNode(nodeId);
    setEditingNodeId(null);
    setSelectedNodeId(null);
  }
}, [removeNode, setSelectedNodeId]);

// ── معالج إضافة خطوة بينية ──────────────────────────────────────
const handleAddNodeBetween = useCallback((edgeId) => {
  // 1. البحث عن الحافة المحددة
  const edge = edges.find(e => e.id === edgeId);
  if (!edge) return;

  // 2. معرفة موقع المنتصف بين العقدتين
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  if (!sourceNode || !targetNode) return;

  // 3. حساب موقع المنتصف
  const midX = (sourceNode.position.x + targetNode.position.x) / 2;
  const midY = (sourceNode.position.y + targetNode.position.y) / 2;

  // 4. إضافة عقدة جديدة في المنتصف
  const newNode = addStepNode(
    { x: midX, y: midY },
    {
      label: `خطوة ${nodes.length + 1}`,
      step_order: Math.max(sourceNode.data.step_order || 0, targetNode.data.step_order || 0) + 0.5,
    }
  );

  // 5. حذف الحافة القديمة وإضافة حافتين جديدتين
  setEdges(prev => {
    // حذف الحافة القديمة
    const withoutOld = prev.filter(e => e.id !== edgeId);
    // إضافة حافة من المصدر إلى العقدة الجديدة
    const newEdge1 = {
      id: `edge-${edge.source}-${newNode.id}`,
      source: edge.source,
      target: newNode.id,
      type: 'animated',
      animated: false,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    };
    // إضافة حافة من العقدة الجديدة إلى الهدف
    const newEdge2 = {
      id: `edge-${newNode.id}-${edge.target}`,
      source: newNode.id,
      target: edge.target,
      type: 'animated',
      animated: false,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    };
    return [...withoutOld, newEdge1, newEdge2];
  });

  toast.success('تم إضافة خطوة بينية');
}, [nodes, edges, addStepNode, setEdges]);
const handlersRef = useRef({
    onToggleParallel: handleToggleParallel,
    onEdit: handleEditNodeFromNode,
    onDelete: handleDeleteNodeFromNode,
    onAdd: handleAddNodeBetween,
  });
  // تحديث الـ ref كلما تغيرت الدوال
  useEffect(() => {
    handlersRef.current = {
      onToggleParallel: handleToggleParallel,
      onEdit: handleEditNodeFromNode,
      onDelete: handleDeleteNodeFromNode,
      onAdd: handleAddNodeBetween,
    };
  }, [handleToggleParallel, handleEditNodeFromNode, handleDeleteNodeFromNode, handleAddNodeBetween]);

const nodeTypes = useMemo(() => ({
  step: (props) => (
    <CustomNode
      {...props}
      {...handlersRef.current}
    />
  ),
}), [handleToggleParallel, handleEditNodeFromNode, handleDeleteNodeFromNode, handleAddNodeBetween]);

// ── ٩. معالج الترتيب التلقائي ──────────────────────────────────
const handleAutoLayout = useCallback(() => {
  if (nodes.length === 0) {
    toast.info('لا توجد خطوات لترتيبها')
    return
  }
  applyLayout('TB') // الترتيب من الأعلى للأسفل
  toast.success('تم ترتيب الخطوات تلقائياً')
}, [nodes.length, applyLayout])

  const modalTitle = mode === 'template'
    ? (isEdit ? 'تعديل القالب' : 'إنشاء قالب جديد')
    : (isEdit ? 'تعديل الـ Workflow' : 'إنشاء Workflow جديد')

    const handleSelectFromTree = useCallback((selected) => {
  // selected: { id, type: 'employee' | 'department', name, full_name }
  const isEmployee = selected.type === 'employee'
  const displayName = isEmployee ? selected.full_name : selected.name

  setEditFormData((prev) => ({
    ...prev,
    assigned_user_id: isEmployee ? selected.id : null,
    assigned_user_name: isEmployee ? displayName : null,
    assigned_department_id: isEmployee ? null : selected.id,
    assigned_department_name: isEmployee ? null : displayName,
  }))

  setShowPickerModal(false)
}, [setEditFormData])

  // ── ٧. حالة عدم وجود بيانات ──────────────────────────────────
  if (nodes.length === 0 && !isEdit) {
    return (
      <Modal open={true} onClose={onClose} title={modalTitle} size="full">
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <div className="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <GitBranch className="w-10 h-10 text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            ابدأ بإنشاء Workflow
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md text-center">
            استخدم المحرر لإنشاء خطوات المهمة وترتيبها. يمكنك سحب العقد وإفلاتها，
            وربطها ببعضها لتحديد تسلسل التنفيذ.
          </p>
          <button
            onClick={handleAddStep}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            أضف خطوتك الأولى
          </button>
        </div>
      </Modal>
    )
  }
  // ── ٨. العرض الرئيسي ──────────────────────────────────────────
  return (
    <Modal open={true} onClose={onClose} title={isEdit ? 'تعديل الـ Workflow' : 'إنشاء Workflow جديد'} size="full">
      <div className="flex flex-col lg:flex-row gap-4 h-[80vh]">
        {/* ─── المحرر الرئيسي ────────────────────────────────────── */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 min-h-[300px] h-full w-full">
          <ReactFlow
            nodes={nodes}
            nodeTypes={nodeTypes}
            edges={edgesWithType}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              type: 'animated', // ← نستخدم النوع الجديد
              animated: false,  // مش بنستخدم الـ animated المدمجة عشان عندنا حركتنا الخاصة
              style: {
                stroke: '#94a3b8',
                strokeWidth: 2,
              },
              data: {
                status: 'pending', // القيمة الافتراضية
              },
            }}
            // وضع التعديل (السحب والإفلات والربط مسموح)
            nodesDraggable={true}
            nodesConnectable={true}
            edgesUpdatable={true}
            elementsSelectable={true}
            selectNodesOnDrag={true}
            panOnDrag={true}
            panOnScroll={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            preventScrolling={false}
            onNodeClick={(event, node) => {
              setSelectedNodeId(node.id)
              handleEditNode(node.id)
            }}
            onPaneClick={() => {
              setSelectedNodeId(null)
              handleCloseEditor()
            }}
          >
            {/* خلفية */}
            <Background
              variant="dots"
              gap={20}
              size={1.5}
              className="bg-slate-50/50 dark:bg-slate-900/30"
              color="#e2e8f0"
            />

            {/* مصغرة */}
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="!bg-white/90 dark:!bg-slate-800/90 !border !border-slate-200 dark:!border-slate-700 rounded-xl"
              maskColor="rgba(0,0,0,0.1)"
            />

            {/* أدوات التحكم */}
            
            <Panel position="bottom-left" className="flex flex-col gap-1.5">
                      <button
                        onClick={handleZoomIn}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                          text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 
                          transition-all duration-150 shadow-sm hover:shadow-md"
                        title="تكبير"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleZoomOut}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                          text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 
                          transition-all duration-150 shadow-sm hover:shadow-md"
                        title="تصغير"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleFitView}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                          text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 
                          transition-all duration-150 shadow-sm hover:shadow-md"
                        title="تكبير للرؤية الكاملة"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                        <button
                          onClick={handleAutoLayout}
                          className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 
                            text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 
                            transition-all duration-150 shadow-sm hover:shadow-md"
                          title="ترتيب الخطوات تلقائياً"
                        >
                          <Layout className="w-4 h-4" />
                        </button>
                    </Panel>


            {/* معلومات */}
            <Panel position="top-right" className="text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="font-medium">{nodes.length}</span> خطوة
              {edges.length > 0 && (
                <>
                  {' · '}
                  <span className="font-medium">{edges.length}</span> علاقة
                </>
              )}
            </Panel>

            {/* علامة التعديل */}
            <Panel position="bottom-center" className="pointer-events-none">
              <span className="text-[10px] text-blue-500 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                وضع التعديل
              </span>
            </Panel>
          </ReactFlow>
        </div>

        {/* ─── الشريط الجانبي ────────────────────────────────────── */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-3">
          {/* زر إضافة خطوة */}
          <button
            onClick={handleAddStep}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة خطوة جديدة
          </button>
          {/* زر الترتيب التلقائي */}
          <button
            onClick={handleAutoLayout}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 text-sm font-medium transition-colors"
            title="ترتيب الخطوات تلقائياً"
          >
            <Layout className="w-4 h-4" />
            ترتيب تلقائي
          </button>


          {/* محرر تفاصيل الخطوة المحددة */}
          {editingNodeId && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  تعديل الخطوة
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRemoveNode(editingNodeId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="حذف الخطوة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCloseEditor}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className={theme.field.wrapper}>
                  <label className={theme.field.label}>العنوان *</label>
                  <input
                    value={editFormData.label || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, label: e.target.value }))
                    }
                    className={clsx(theme.input.base, 'text-sm')}
                    placeholder="عنوان الخطوة"
                  />
                </div>

                <div className={theme.field.wrapper}>
                  <label className={theme.field.label}>الوصف</label>
                  <input
                    value={editFormData.description || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className={clsx(theme.input.base, 'text-sm')}
                    placeholder="وصف الخطوة (اختياري)"
                  />
                </div>

                <div className={theme.field.wrapper}>
                  <label className={theme.field.label}>رقم الترتيب</label>
                  <input
                    type="number"
                    value={editFormData.step_order || 1}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        step_order: parseInt(e.target.value) || 1,
                      }))
                    }
                    className={clsx(theme.input.base, 'text-sm')}
                    min={1}
                  />
                </div>

                {/* حقل اختيار المسؤول باستخدام الشجرة */}
                <div className={theme.field.wrapper}>
                  <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> المسؤول
                  </label>
                  <div className="flex gap-2">
                    <div
                      className={clsx(
                        "flex-1 h-9 flex items-center px-3 text-sm rounded-lg border cursor-pointer",
                        "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700",
                        (editFormData.assigned_user_name || editFormData.assigned_department_name)
                          ? "text-slate-800 dark:text-slate-200"
                          : "text-slate-400"
                      )}
                      onClick={() => {
                        setPickerTarget('assignee')
                        setShowPickerModal(true)
                      }}
                    >
                      {editFormData.assigned_user_name || editFormData.assigned_department_name || "اختر مسؤول (موظف أو إدارة)"}
                    </div>
                    {(editFormData.assigned_user_name || editFormData.assigned_department_name) && (
                      <button
                        onClick={() => {
                          setEditFormData((prev) => ({
                            ...prev,
                            assigned_user_id: null,
                            assigned_user_name: null,
                            assigned_department_id: null,
                            assigned_department_name: null,
                          }))
                        }}
                        className="h-9 px-3 text-xs bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
                {/* مودال اختيار المسؤول */}
                {showPickerModal && (
                  <Modal
                    open={showPickerModal}
                    onClose={() => setShowPickerModal(false)}
                    title="اختر المسؤول (موظف أو إدارة)"
                    size="md"
                  >
                    <div className="h-[400px] overflow-y-auto">
                      <SidebarTree
                        onSelectNode={(selected) => {
                          // تأكد من وجود selected.type للتمييز
                          if (selected.type === 'employee' || selected.type === 'department') {
                            handleSelectFromTree(selected)
                          } else {
                            // إذا لم يكن هناك type، حاول التمييز بناءً على وجود full_name
                            const isEmployee = !!selected.full_name
                            handleSelectFromTree({
                              ...selected,
                              type: isEmployee ? 'employee' : 'department',
                              name: selected.name || selected.full_name,
                            })
                          }
                        }}
                      />
                    </div>
                  </Modal>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.is_parallel || false}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        is_parallel: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-300 dark:border-slate-600 text-primary-600"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-violet-500" />
                    تنفيذ بالتوازي مع الخطوة السابقة
                  </span>
                </label>

                <button
                  onClick={handleSaveNodeEdit}
                  className="w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          )}

          {/* نصائح */}
          {!editingNodeId && (
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                💡 <span className="font-medium">نصائح:</span>
                <br />
                • انقر على أي خطوة لتعديل تفاصيلها
                <br />
                • اسحب من النقطة السفلية للخطوة إلى النقطة العلوية لخطوة أخرى لربطهما
                <br />
                • يمكنك سحب الخطوات وإفلاتها في أي مكان
              </p>
            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || nodes.length === 0}
              className="flex-1 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              حفظ
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── المكوّن الرئيسي (مع ReactFlowProvider) ──────────────────────
export default function WorkflowBuilderModal(props) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  )
}