import { Minimize2, Layers } from 'lucide-react'

interface GraphControlsProps {
  showOverlay: boolean
  onToggleOverlay: () => void
}

export function GraphControls({ showOverlay, onToggleOverlay }: GraphControlsProps) {
  return (
    <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors">
        <Minimize2 className="h-3.5 w-3.5" />
        Minimize
      </button>
      <button
        onClick={onToggleOverlay}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md shadow-sm transition-colors ${
          showOverlay
            ? 'bg-gray-800 text-white hover:bg-gray-700'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        }`}
      >
        <Layers className="h-3.5 w-3.5" />
        {showOverlay ? 'Hide Granular Overlay' : 'Show Granular Overlay'}
      </button>
    </div>
  )
}
