// Compliance score: based on violations vs sessions
// Max 2 violations per session (no comment + no like)
export function compliancePct(member) {
  if (!member) return 100
  const { violation_count = 0, session_count = 0 } = member
  if (session_count === 0) return 100
  return Math.min(100, Math.max(0, Math.round((1 - violation_count / (session_count * 2)) * 100)))
}

export function scoreColor(pct) {
  if (pct <= 50) return '#f87171'   // red
  if (pct <= 70) return '#fb923c'   // orange
  if (pct <= 80) return '#fbbf24'   // yellow
  return '#22d3ee'                   // cyan
}

export function platformLabel(p) {
  return p === 'ig' ? 'Instagram' : p === 'tt' ? 'TikTok' : 'Both'
}
export function platformShort(p) {
  return p === 'ig' ? 'IG' : p === 'tt' ? 'TT' : 'Both'
}
export function platformBadgeClass(p) {
  return p === 'ig'
    ? 'bg-red-500/10 text-red-400 border-red-500/25'
    : p === 'tt'
    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25'
}

export function initials(name) { return (name || '?')[0].toUpperCase() }

export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function parseUsernames(raw) {
  return raw.split(/[\n,]+/).map(u => u.trim().replace(/^@/, '').toLowerCase()).filter(Boolean)
}
