import { PanelLeft } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-gray-200 px-5 py-3 flex items-center gap-3 bg-white">
      <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
        <PanelLeft className="h-5 w-5 text-gray-500" />
      </button>
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="text-blue-600 font-medium hover:underline cursor-pointer">
          Mapping
        </span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-semibold">Order to Cash</span>
      </nav>
    </header>
  )
}
