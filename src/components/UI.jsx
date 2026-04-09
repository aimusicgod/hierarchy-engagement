import { compliancePct, scoreColor, platformBadgeClass, platformShort } from '../lib/utils'

export function Badge({ children, className = '' }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${className}`}>{children}</span>
}
export function PlatBadge({ platform }) {
  return <Badge className={platformBadgeClass(platform) + ' text-[9px]'}>{platformShort(platform)}</Badge>
}
export function ScoreBadge({ member }) {
  const pct = compliancePct(member)
  const c = scoreColor(pct)
  return <Badge style={{ background: c + '18', color: c, borderColor: c + '40' }}>{pct}%</Badge>
}

export function Btn({ children, onClick, variant = 'red', size = 'md', disabled, className = '' }) {
  const sz = size === 'sm' ? 'text-[10px] px-3 py-1.5' : size === 'lg' ? 'text-sm px-5 py-3' : 'text-[11px] px-4 py-2'
  const v = {
    red:   'bg-[#fe2c55] text-white hover:opacity-85 border-0',
    blue:  'bg-[#25f4ee] text-black hover:opacity-85 border-0',
    ghost: 'bg-transparent border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white',
    cyan:  'bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20',
    danger:'bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`font-bold rounded-lg cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed font-mono ${sz} ${v[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-700 ${className}`} />
  )
}

export function Select({ value, onChange, children, className = '' }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50 cursor-pointer ${className}`}>
      {children}
    </select>
  )
}

export function Panel({ title, children, className = '' }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 ${className}`}>
      {title && <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">{title}</div>}
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, accent, warning, danger }) {
  const vc = danger ? 'text-red-400' : warning ? 'text-orange-400' : accent ? 'text-cyan-400' : 'text-white'
  const bc = danger ? 'border-red-500/20 bg-red-500/5' : accent ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-zinc-800'
  return (
    <div className={`rounded-xl border p-4 ${bc}`}>
      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{label}</div>
      <div className={`text-3xl font-black ${vc}`}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-600 mt-1">{sub}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/75 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-zinc-950 border border-zinc-800 rounded-2xl p-6 ${width} w-full max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black text-white">{title}</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-white w-7 h-7 flex items-center justify-center rounded border border-zinc-800 hover:border-zinc-600 text-sm bg-transparent cursor-pointer">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'
  return <div className={`${s} border-2 border-zinc-800 border-t-cyan-400 rounded-full animate-spin`} />
}

export function Empty({ msg = 'No data found.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="text-3xl opacity-20">◯</div>
      <div className="text-sm text-zinc-600">{msg}</div>
      {action}
    </div>
  )
}

export function GradBar() {
  return <div className="h-px bg-gradient-to-r from-cyan-500 to-red-500 rounded mb-5" />
}

export function PageHeader({ title, sub, action }) {
  return (
    <div className="flex items-start justify-between mb-1">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
        {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

let _toastTimer
export function toast(msg) {
  let el = document.getElementById('hm-toast')
  if (!el) { el = document.createElement('div'); el.id = 'hm-toast'; document.body.appendChild(el) }
  el.textContent = msg
  el.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#1a1a1a;border:1px solid rgba(37,244,238,.35);color:#fff;font-size:12px;font-weight:700;padding:10px 20px;border-radius:10px;z-index:9999;opacity:1;transition:opacity .4s;white-space:nowrap;font-family:monospace'
  clearTimeout(_toastTimer)
  _toastTimer = setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400) }, 2400)
}
