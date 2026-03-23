import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types'
import { sendQuery } from '@/lib/api'

export function useChat() {
  const [query, setQuery] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleQuery = async () => {
    if (!query.trim()) return

    const userMessage = query
    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }])
    setQuery('')
    setLoading(true)

    try {
      const { answer, sql, data } = await sendQuery(userMessage, chatHistory as any)

      let content = answer || 'No response received'

      if (sql && sql.trim()) {
        content += `\n\n📊 SQL Query:\n\`\`\`sql\n${sql}\n\`\`\``
      }

      if (data && data.length > 0) {
        content += `\n\n✅ Found ${data.length} result${data.length > 1 ? 's' : ''}`
      }

      setChatHistory((prev) => [...prev, { role: 'assistant', content }])
    } catch (error: any) {
      console.error('Query failed:', error)
      let errorMessage = 'Failed to process query'

      if (error.response) {
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.detail || error.response.statusText}`
      } else if (error.request) {
        errorMessage =
          '⚠️ Cannot connect to backend. Make sure the server is running on http://localhost:8000'
      } else {
        errorMessage = `Error: ${error.message}`
      }

      setChatHistory((prev) => [...prev, { role: 'error', content: errorMessage }])
    } finally {
      setLoading(false)
    }
  }

  return {
    query,
    setQuery,
    chatHistory,
    loading,
    chatEndRef,
    handleQuery,
  }
}
