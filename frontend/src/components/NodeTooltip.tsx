import type { GraphNode } from '@/types'

interface NodeTooltipProps {
  node: GraphNode
  connectionCount: number
  position?: { x: number; y: number }
}

export function NodeTooltip({ node, connectionCount }: NodeTooltipProps) {
  if (!node.props) return null

  // Separate entity type from the rest of the props
  const entityType = node.props.Entity || node.type
  const MAX_VISIBLE_FIELDS = 12

  // Get all property entries except 'Entity'
  const entries = Object.entries(node.props).filter(([key]) => key !== 'Entity')
  const visibleEntries = entries.slice(0, MAX_VISIBLE_FIELDS)
  const hiddenCount = entries.length - MAX_VISIBLE_FIELDS

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px] max-w-[340px] text-left animate-in fade-in duration-200">
      {/* Title */}
      <h3 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
        {entityType}
      </h3>

      {/* Properties */}
      <div className="space-y-1">
        {visibleEntries.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 text-sm py-0.5">
            <span className="text-gray-500 font-medium whitespace-nowrap min-w-[100px]">
              {key}:
            </span>
            <span className="text-gray-900 font-medium break-all">
              {String(value || '')}
            </span>
          </div>
        ))}
      </div>

      {/* Hidden fields notice */}
      {hiddenCount > 0 && (
        <p className="text-xs text-gray-400 italic mt-2">
          Additional fields hidden for readability
        </p>
      )}

      {/* Connection count */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5">
        <span className="text-sm text-gray-500 font-medium">Connections:</span>
        <span className="text-sm font-bold text-gray-900">{connectionCount}</span>
      </div>
    </div>
  )
}
