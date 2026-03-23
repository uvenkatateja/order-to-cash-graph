import { useState } from 'react'
import { Header } from '@/components/Header'
import { GraphVisualization } from '@/components/GraphVisualization'
import { ChatPanel } from '@/components/ChatPanel'
import { useGraph } from '@/hooks/useGraph'
import { useChat } from '@/hooks/useChat'
import { MessageSquare, X } from 'lucide-react'

function App() {
  const graph = useGraph()
  const chat = useChat()
  const [chatOpen, setChatOpen] = useState(true)

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Graph takes full remaining space */}
        <GraphVisualization
          graphData={graph.graphData}
          graphLoading={graph.graphLoading}
          backendConnected={graph.backendConnected}
          selectedNode={graph.selectedNode}
          highlightLinks={graph.highlightLinks}
          onNodeClick={graph.handleNodeClick}
          onNodeHover={graph.handleNodeHover}
          onBackgroundClick={graph.clearSelection}
          onRetry={graph.loadGraph}
          getConnectionCount={graph.getConnectionCount}
        />

        {/* Chat Panel - desktop: always visible sidebar, mobile: toggleable overlay */}
        {chatOpen ? (
          <>
            {/* Desktop sidebar */}
            <div className="hidden lg:flex">
              <ChatPanel
                chatHistory={chat.chatHistory}
                query={chat.query}
                loading={chat.loading}
                chatEndRef={chat.chatEndRef as React.RefObject<HTMLDivElement>}
                onQueryChange={chat.setQuery}
                onSubmit={chat.handleQuery}
              />
            </div>

            {/* Mobile overlay */}
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
              <div className="absolute inset-0 bg-black/20" onClick={() => setChatOpen(false)} />
              <div className="ml-auto relative w-full max-w-[380px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <button
                  onClick={() => setChatOpen(false)}
                  className="absolute top-4 right-4 z-10 p-1 rounded-md hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
                <ChatPanel
                  chatHistory={chat.chatHistory}
                  query={chat.query}
                  loading={chat.loading}
                  chatEndRef={chat.chatEndRef as React.RefObject<HTMLDivElement>}
                  onQueryChange={chat.setQuery}
                  onSubmit={chat.handleQuery}
                />
              </div>
            </div>
          </>
        ) : null}

        {/* Mobile chat toggle button */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors z-40"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default App
