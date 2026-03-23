import { Network, Send, Loader2 } from 'lucide-react'
import type { ChatMessage } from '@/types'

interface ChatPanelProps {
  chatHistory: ChatMessage[]
  query: string
  loading: boolean
  chatEndRef: React.RefObject<HTMLDivElement>
  onQueryChange: (value: string) => void
  onSubmit: () => void
}

const SUGGESTED_QUERIES = [
  'How many sales orders are there?',
  'Show me top 5 customers by order value',
  'Which products are most ordered?',
  'Identify sales orders with broken flows',
]

export function ChatPanel({
  chatHistory,
  query,
  loading,
  chatEndRef,
  onQueryChange,
  onSubmit,
}: ChatPanelProps) {
  return (
    <div className="w-full lg:w-[340px] xl:w-[380px] border-l border-gray-200 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">Chat with Graph</h2>
        <p className="text-xs text-gray-500 mt-0.5">Order to Cash</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {chatHistory.length === 0 && <EmptyState onQuerySelect={onQueryChange} onSubmit={onSubmit} />}

        {chatHistory.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}

        {loading && <TypingIndicator />}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 px-5 py-4">
        {/* Status */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">
            {loading ? 'Dodge AI is thinking...' : 'Dodge AI is awaiting instructions'}
          </span>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Analyze anything"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSubmit()}
            disabled={loading}
            className="flex-1 h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all disabled:opacity-50 placeholder:text-gray-400"
          />
          <button
            onClick={onSubmit}
            disabled={loading || !query.trim()}
            className="h-10 w-10 flex items-center justify-center bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EmptyState({ onQuerySelect, onSubmit }: { onQuerySelect: (q: string) => void; onSubmit: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      {/* Bot Avatar */}
      <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center mb-4">
        <Network className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-base font-bold text-gray-900">Dodge AI</h3>
      <p className="text-xs text-gray-500 mb-4">Graph Agent</p>
      <p className="text-sm text-gray-600 mb-6">
        Hi! I can help you analyze the <strong>Order to Cash</strong> process.
      </p>

      {/* Suggested queries */}
      <div className="w-full space-y-1.5">
        {SUGGESTED_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => {
              onQuerySelect(q)
              // Small delay to allow state update before submit
              setTimeout(() => onSubmit(), 50)
            }}
            className="w-full text-left text-xs text-gray-500 hover:text-gray-900 p-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
          <Network className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-gray-600">U</span>
        </div>
      )}

      {/* Message */}
      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        <div className="text-[11px] font-medium text-gray-500 mb-1">
          {isUser ? 'You' : 'Dodge AI'}
          {!isUser && <span className="text-gray-400 ml-1">Graph Agent</span>}
        </div>
        <div
          className={`inline-block text-left text-sm leading-relaxed px-3.5 py-2.5 rounded-xl max-w-full ${
            isUser
              ? 'bg-gray-900 text-white rounded-br-sm'
              : isError
              ? 'bg-red-50 text-red-700 border border-red-100'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
        <Network className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1">
        <div className="text-[11px] font-medium text-gray-500 mb-1">
          Dodge AI <span className="text-gray-400">Graph Agent</span>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-gray-100 rounded-xl rounded-bl-sm px-4 py-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
