import { useRef, useState, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Loader2, Network } from 'lucide-react'
import { GraphControls } from './GraphControls'
import { NodeTooltip } from './NodeTooltip'
import type { GraphNode, GraphLink } from '@/types'
import { getNodeColor, getNodeSize, NODE_COLORS } from '@/types'
import { Button } from '@/components/ui/button'

interface GraphVisualizationProps {
  graphData: { nodes: GraphNode[]; links: GraphLink[] }
  graphLoading: boolean
  backendConnected: boolean
  selectedNode: GraphNode | null
  highlightLinks: Set<GraphLink>
  onNodeClick: (node: GraphNode) => void
  onNodeHover: (node: GraphNode | null) => void
  onBackgroundClick: () => void
  onRetry: () => void
  getConnectionCount: (node: GraphNode) => number
}

export function GraphVisualization({
  graphData,
  graphLoading,
  backendConnected,
  selectedNode,
  highlightLinks,
  onNodeClick,
  onNodeHover,
  onBackgroundClick,
  onRetry,
  getConnectionCount,
}: GraphVisualizationProps) {
  const graphRef = useRef<any>()
  const [showOverlay, setShowOverlay] = useState(true)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleNodeClick = useCallback(
    (node: any) => {
      onNodeClick(node as GraphNode)
      // Calculate tooltip position relative to container
      if (containerRef.current && graphRef.current) {
        const screen = graphRef.current.graph2ScreenCoords(node.x, node.y)
        setTooltipPos({ x: screen.x, y: screen.y })
      }
    },
    [onNodeClick]
  )

  const handleBackgroundClick = useCallback(() => {
    onBackgroundClick()
    setTooltipPos(null)
  }, [onBackgroundClick])

  if (graphLoading) {
    return (
      <div className="flex-1 relative flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-sm text-gray-500">Loading graph...</span>
        </div>
      </div>
    )
  }

  if (!backendConnected) {
    return (
      <div className="flex-1 relative flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Network className="h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-700">Cannot Connect to Backend</h3>
        <p className="text-sm text-gray-500">
          Make sure the backend server is running
        </p>
        <Button onClick={onRetry} className="mt-2">
          Retry Connection
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-slate-50">
      <GraphControls
        showOverlay={showOverlay}
        onToggleOverlay={() => setShowOverlay(!showOverlay)}
      />

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel=""
        nodeColor={(node: any) => getNodeColor(node as GraphNode)}
        nodeVal={(node: any) => getNodeSize(node as GraphNode)}
        nodeRelSize={6}
        nodeCanvasObjectMode={() => (showOverlay ? 'after' : 'replace')}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          if (!showOverlay) {
            // Simple dot mode
            const size = getNodeSize(node as GraphNode)
            ctx.beginPath()
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false)
            ctx.fillStyle = getNodeColor(node as GraphNode)
            ctx.fill()
            return
          }
          // Label mode
          const label = node.label || ''
          const fontSize = Math.max(10 / globalScale, 2)
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#64748b'
          ctx.fillText(label, node.x, node.y + (getNodeSize(node as GraphNode) * 6 + 4) / globalScale)
        }}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.2}
        backgroundColor="#f8fafc"
        linkColor={(link: any) =>
          highlightLinks.has(link) ? '#3b82f6' : '#cbd5e1'
        }
        linkWidth={(link: any) => (highlightLinks.has(link) ? 2.5 : 0.8)}
        linkLabel="label"
        onNodeClick={handleNodeClick}
        onNodeHover={(node: any) => onNodeHover(node as GraphNode | null)}
        onBackgroundClick={handleBackgroundClick}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />

      {/* Node Tooltip - positioned near clicked node */}
      {selectedNode && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-auto"
          style={{
            left: Math.min(tooltipPos.x + 20, (containerRef.current?.clientWidth || 800) - 360),
            top: Math.max(tooltipPos.y - 80, 10),
          }}
        >
          <NodeTooltip
            node={selectedNode}
            connectionCount={getConnectionCount(selectedNode)}
          />
        </div>
      )}

      {/* Bottom legend - minimal */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-gray-100 z-10">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[11px] text-gray-500">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
