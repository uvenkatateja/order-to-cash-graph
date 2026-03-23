// ─── Graph Node ──────────────────────────────────────────────────────────────
export interface GraphNode {
  id: string
  label: string
  type: string
  props?: Record<string, any>
  val?: number
  x?: number
  y?: number
}

// ─── Graph Link ──────────────────────────────────────────────────────────────
export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  label?: string
}

// ─── Graph Data ──────────────────────────────────────────────────────────────
export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

// ─── Chat Message ────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant' | 'error'
  content: string
}

// ─── API Response ────────────────────────────────────────────────────────────
export interface QueryResponse {
  answer: string
  sql: string
  data: Record<string, any>[]
}

// ─── Node Color Map ──────────────────────────────────────────────────────────
export const NODE_COLORS: Record<string, string> = {
  SalesOrder: '#3b82f6',
  Delivery: '#10b981',
  Billing: '#f59e0b',
  Payment: '#8b5cf6',
  JournalEntry: '#ec4899',
  Customer: '#ef4444',
  Product: '#06b6d4',
}

export const NODE_SIZES: Record<string, number> = {
  Customer: 8,
  SalesOrder: 6,
  Product: 5,
  Delivery: 6,
  Billing: 6,
  JournalEntry: 5,
  Payment: 7,
}

export const getNodeColor = (node: GraphNode): string => {
  return NODE_COLORS[node.type] || '#6b7280'
}

export const getNodeSize = (node: GraphNode): number => {
  return NODE_SIZES[node.type] || 4
}
