export default function PreviewBanner({ manager, onExit }) {
  if (!manager) return null
  return (
    <div className="h-7 flex items-center justify-center gap-3 flex-shrink-0 border-b border-red-500/30"
      style={{ background: 'linear-gradient(90deg,rgba(254,44,85,.15),rgba(254,44,85,.07))' }}>
      <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">◈ Preview Mode</span>
      <span className="text-[10px] text-zinc-500">Viewing as: {manager.name}</span>
      <button onClick={onExit} className="text-[9px] font-bold text-red-400 border border-red-500/35 rounded px-2 py-0.5 bg-transparent cursor-pointer hover:bg-red-500/10 transition-colors">
        ✕ Exit
      </button>
    </div>
  )
}
