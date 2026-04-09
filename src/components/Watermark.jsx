import { useAuth } from '../contexts/AuthContext'

// Diagonal repeating email watermark for security/leak tracking
export default function Watermark() {
  const { user } = useAuth()
  if (!user?.email) return null

  const email = user.email
  // Build a repeating pattern of the email rotated diagonally
  const rows = 8
  const cols = 4

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9998,
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => (
          <div key={`${row}-${col}`} style={{
            position: 'absolute',
            left: `${col * 28 - 5}%`,
            top: `${row * 14 - 2}%`,
            transform: 'rotate(-30deg)',
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.045)',
            fontFamily: 'ui-monospace, monospace',
            whiteSpace: 'nowrap',
            letterSpacing: '0.5px',
          }}>
            {email}
          </div>
        ))
      )}
    </div>
  )
}
