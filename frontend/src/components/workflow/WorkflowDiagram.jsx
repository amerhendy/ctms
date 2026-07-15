// src/components/workflow/WorkflowDiagram.jsx
import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import { ZoomIn, ZoomOut, Maximize, Loader2, AlertCircle, Layout } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import CustomNode from './CustomNode';
import AnimatedEdge from './AnimatedEdge';
import { layoutNodes } from '@/utils/layoutUtils';
import 'reactflow/dist/style.css';

// تعريف nodeTypes و edgeTypes خارج المكون (ثابت)
const nodeTypes = {
  step: CustomNode,
};

// ملاحظة: edgeTypes يتم تعريفه داخل المكون لأنه يحتاج إلى props (onEdit, onDelete, onAdd)
// لكننا سنستخدم useMemo مع الاعتماديات المناسبة.

function WorkflowDiagramInner({
  nodes: initialNodes = [],
  edges: initialEdges = [],
  isLoading = false,
  error = null,
  onNodeClick = null,
  onAutoLayout = false,
  onEdgeEdit = null,
  onEdgeDelete = null,
  onEdgeAdd = null,
  className = '',
  fitViewOptions = { padding: 0.2 },
}) {
  const processedEdges = initialEdges.map((edge, index) => ({
    ...edge,
    id: edge.id || `${edge.source}-${edge.target}-${index}`,
  }));


  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(processedEdges);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);


  // تعريف edgeTypes باستخدام useMemo مع الاعتماديات الصحيحة
  const edgeTypes = useMemo(() => ({
    animated: (props) => (
      <AnimatedEdge
        {...props}
        onEdit={onEdgeEdit}
        onDelete={onEdgeDelete}
        onAdd={onEdgeAdd}
      />
    ),
  }), [onEdgeEdit, onEdgeDelete, onEdgeAdd]);

  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);
  useEffect(() => {
    if (processedEdges.length > 0) {
      setEdges(processedEdges);
    }
  }, [initialEdges, setEdges]);
  const onNodeClickHandler = useCallback(
    (event, node) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  const handleZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [reactFlowInstance]);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) {
      toast.info('لا توجد خطوات لترتيبها');
      return;
    }
    try {
      const layoutedNodes = layoutNodes(nodes, edges, {
        direction: 'TB',
        nodeWidth: 220,
        nodeHeight: 130,
        rankSep: 100,
        nodeSep: 50,
      });
      setNodes(layoutedNodes);
      toast.success('تم ترتيب الخطوات تلقائياً');
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
        }
      }, 100);
    } catch (error) {
      toast.error('فشل ترتيب الخطوات: ' + error.message);
    }
  }, [nodes, edges, setNodes, reactFlowInstance]);

  // التأكد من أن أبعاد الحاوية صحيحة
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 150);
    }
  }, [reactFlowInstance, nodes]);

  if (isLoading) {
    return (
      <div className={clsx(
        'flex flex-col items-center justify-center min-h-[400px] rounded-2xl',
        'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        className
      )}>
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">جاري تحميل الـ Workflow...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx(
        'flex flex-col items-center justify-center min-h-[400px] rounded-2xl',
        'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800',
        className
      )}>
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">حدث خطأ أثناء تحميل الـ Workflow</p>
        <p className="text-xs text-red-500 dark:text-red-300 mt-1">{error.message || 'يرجى المحاولة مرة أخرى'}</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className={clsx(
        'flex flex-col items-center justify-center min-h-[400px] rounded-2xl',
        'bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-slate-700',
        className
      )}>
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد خطوات في هذا الـ Workflow</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">أضف خطوات لبدء العمل</p>
      </div>
    );
  }

  return (
    <div
      ref={reactFlowWrapper}
      className={clsx(
        'relative w-full min-h-[450px] rounded-2xl overflow-hidden',
        'border border-slate-200 dark:border-slate-700',
        'bg-white dark:bg-slate-950',
        className
      )}
      style={{ width: '100%', height: '100%' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        minZoom={0.1}
        maxZoom={2}
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'animated',
          style: {
            stroke: '#94a3b8',
            strokeWidth: 2,
            strokeDasharray: '8 6',
          },
        }}
        edgesFocusable={false}
        edgesUpdatable={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={false}
      >
        <Background
          variant="dots"
          gap={20}
          size={1.5}
          className="bg-slate-50/50 dark:bg-slate-900/30"
          color="#e2e8f0"
        />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-white/90 dark:!bg-slate-800/90 !border !border-slate-200 dark:!border-slate-700 rounded-xl"
          maskColor="rgba(0,0,0,0.1)"
          nodeColor={(node) => {
            const status = node.data?.status || 'pending';
            const colors = {
              pending: '#94a3b8',
              in_progress: '#3b82f6',
              completed: '#22c55e',
              skipped: '#94a3b8',
              cancelled: '#ef4444',
            };
            return colors[status] || '#94a3b8';
          }}
        />
        <Controls
          className="!bg-white dark:!bg-slate-800 !border !border-slate-200 dark:!border-slate-700 rounded-xl overflow-hidden shadow-lg"
          showInteractive={false}
          position="bottom-right"
        />
        <Panel position="bottom-left" className="flex flex-col gap-1.5">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-150 shadow-sm hover:shadow-md"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-150 shadow-sm hover:shadow-md"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitView}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-150 shadow-sm hover:shadow-md"
            title="تكبير للرؤية الكاملة"
          >
            <Maximize className="w-4 h-4" />
          </button>
          {onAutoLayout && (
            <button
              onClick={handleAutoLayout}
              className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all duration-150 shadow-sm hover:shadow-md"
              title="ترتيب الخطوات تلقائياً"
            >
              <Layout className="w-4 h-4" />
            </button>
          )}
        </Panel>
        <Panel position="top-right" className="text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="font-medium">{nodes.length}</span> خطوة
          {edges.length > 0 && (
            <>
              {' · '}
              <span className="font-medium">{edges.length}</span> علاقة
            </>
          )}
        </Panel>
        <Panel position="bottom-center" className="pointer-events-none">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            عرض فقط
          </span>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function WorkflowDiagram(props) {
  return (
    <ReactFlowProvider>
      <WorkflowDiagramInner {...props} />
    </ReactFlowProvider>
  );
}