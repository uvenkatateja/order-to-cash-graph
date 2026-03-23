import { useState, useEffect } from 'react'
import type { GraphData, GraphNode, GraphLink } from '@/types'
import { fetchGraph } from '@/lib/api'

export function useGraph() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [graphLoading, setGraphLoading] = useState(true)
  const [backendConnected, setBackendConnected] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [highlightLinks, setHighlightLinks] = useState<Set<GraphLink>>(new Set())

  const loadGraph = async () => {
    try {
      setGraphLoading(true)
      const data = await fetchGraph()
      setGraphData(data)
      setBackendConnected(true)
    } catch (error) {
      console.error('Failed to load graph:', error)
      setBackendConnected(false)
    } finally {
      setGraphLoading(false)
    }
  }

  useEffect(() => {
    loadGraph()
  }, [])

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node)
  }

  const handleNodeHover = (node: GraphNode | null) => {
    if (node) {
      const links = new Set<GraphLink>()
      graphData.links.forEach((link) => {
        const source = typeof link.source === 'object' ? link.source.id : link.source
        const target = typeof link.target === 'object' ? link.target.id : link.target
        if (source === node.id || target === node.id) {
          links.add(link)
        }
      })
      setHighlightLinks(links)
    } else {
      setHighlightLinks(new Set())
    }
  }

  const clearSelection = () => {
    setSelectedNode(null)
  }

  // Count connections for a node
  const getConnectionCount = (node: GraphNode): number => {
    return graphData.links.filter((link) => {
      const source = typeof link.source === 'object' ? link.source.id : link.source
      const target = typeof link.target === 'object' ? link.target.id : link.target
      return source === node.id || target === node.id
    }).length
  }

  return {
    graphData,
    graphLoading,
    backendConnected,
    selectedNode,
    highlightLinks,
    loadGraph,
    handleNodeClick,
    handleNodeHover,
    clearSelection,
    getConnectionCount,
  }
}
