// src/components/workflow/AnimatedEdge.jsx
import React, { useState } from 'react';
import { BaseEdge, getBezierPath } from 'reactflow';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
  onEdit,
  onDelete,
  onAdd,
}) {
  const [showActions, setShowActions] = useState(false);

  const [edgePath, centerX, centerY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const status = data?.status || 'pending';
  const edgeColor =
    status === 'completed' ? '#22c55e' :
    status === 'in_progress' ? '#3b82f6' :
    status === 'pending' ? '#94a3b8' : '#94a3b8';

  return (
    <g
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => setShowActions(!showActions)}
    >
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '8 6',
          strokeLinecap: 'round',
          ...style,
        }}
        markerEnd={markerEnd}
        className="animated-edge"
      />

      {showActions && (
        <foreignObject
          width={120}
          height={40}
          x={centerX - 60}
          y={centerY - 20}
          className="pointer-events-auto"
        >
          <div className="flex items-center justify-center gap-1 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 px-2 py-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(id); }}
              className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
              title="تعديل العلاقة"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAdd?.(id); }}
              className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors"
              title="إضافة خطوة بينية"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
              className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
              title="حذف العلاقة"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
}