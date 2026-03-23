import axios from 'axios'
import type { GraphData, GraphLink, QueryResponse } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchGraph(): Promise<GraphData> {
  const response = await axios.get(`${API_URL}/api/graph`)
  const { nodes, edges } = response.data
  const links: GraphLink[] = edges.map((e: any) => ({
    source: e.source,
    target: e.target,
    label: e.label,
  }))
  return { nodes, links }
}

export async function sendQuery(
  question: string,
  history: Array<{ role: string; content: string }>
): Promise<QueryResponse> {
  const response = await axios.post(`${API_URL}/api/query`, {
    question,
    history,
  })
  return response.data
}

export { API_URL }
