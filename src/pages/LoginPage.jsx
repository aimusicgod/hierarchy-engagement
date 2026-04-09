import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth()
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView]     = useState('login') // login | forgot | sent
  const [fpEmail, setFpEmail] = useState('')
  const [fpErr, setFpErr]   = useState('')
  const [fpLoad, setFpLoad] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (!email || !pass) { setError('Please enter your email and password.'); return }
    setLoading(true)
    try { await signIn(email, pass) }
    catch { setError('Invalid email or password. Contact your administrator.'); setLoading(false) }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setFpErr('')
    if (!fpEmail) { setFpErr('Please enter your email address.'); return }
    setFpLoad(true)
    try { await resetPassword(fpEmail); setView('sent') }
    catch (err) { setFpErr(err.message || 'Failed to send reset email.') }
    setFpLoad(false)
  }

  const inp = { className: 'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-white text-sm font-mono outline-none focus:border-cyan-500/50 transition-colors' }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Hierarchy Music" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <div className="text-xl font-black text-white">Hierarchy Music</div>
          <div className="text-[11px] text-zinc-600 mt-1 uppercase tracking-widest">
            {view === 'login' ? 'Engagement Tracker' : view === 'forgot' ? 'Reset Password' : 'Check Your Email'}
          </div>
        </div>

        {/* LOGIN */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email</div>
              <input {...inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Password</div>
                <button type="button" onClick={() => { setView('forgot'); setFpEmail(email) }} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">Forgot password?</button>
              </div>
              <input {...inp} type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <div className="text-[11px] text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2.5">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-[#fe2c55] text-white font-bold py-3 rounded-xl border-0 cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50">
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
            <div className="text-center pt-2">
              <div className="text-[10px] text-zinc-700">Access granted by Hierarchy Music LLC only</div>
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-full">
                <span className="text-[9px]">🔒</span>
                <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Private · Hierarchy Music LLC</span>
              </div>
            </div>
          </form>
        )}

        {/* FORGOT */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="text-center text-3xl mb-2">🔑</div>
            <p className="text-[11px] text-zinc-500 text-center">Enter your email and we'll send a reset link</p>
            <div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email</div>
              <input {...inp} type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            {fpErr && <div className="text-[11px] text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2.5">{fpErr}</div>}
            <button type="submit" disabled={fpLoad} className="w-full bg-[#fe2c55] text-white font-bold py-3 rounded-xl border-0 cursor-pointer hover:opacity-85 disabled:opacity-50">
              {fpLoad ? 'Sending…' : 'Send Reset Link →'}
            </button>
            <button type="button" onClick={() => setView('login')} className="w-full bg-transparent border border-zinc-800 text-zinc-500 font-bold py-3 rounded-xl cursor-pointer hover:border-zinc-600 hover:text-white transition-all">
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* SENT */}
        {view === 'sent' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">📬</div>
            <div className="text-base font-black text-white">Check Your Inbox</div>
            <p className="text-[11px] text-zinc-500">A reset link was sent to</p>
            <div className="text-sm font-bold text-cyan-400 break-all">{fpEmail}</div>
            <p className="text-[10px] text-zinc-600">Link expires in 15 minutes. Check your spam folder too.</p>
            <button onClick={() => setView('login')} className="w-full bg-transparent border border-zinc-800 text-zinc-500 font-bold py-3 rounded-xl cursor-pointer hover:border-zinc-600 hover:text-white transition-all">
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
