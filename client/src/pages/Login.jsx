import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'

// ─── Icons ────────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Spinner({ size = 15 }) {
  return (
    <div className="anim-spin" style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: 'currentColor', flexShrink: 0,
    }} />
  )
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function TextInput({ type = 'text', placeholder, value, onChange, hasError, autoComplete }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      style={{
        width: '100%', background: 'var(--bg-input)', borderRadius: 8, height: 42,
        padding: '0 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none',
        boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
        border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border-subtle)'}`,
      }}
      onFocus={e => {
        e.target.style.borderColor = hasError ? 'var(--danger)' : 'var(--border-active)'
        e.target.style.boxShadow = hasError ? '0 0 0 3px rgba(239,68,68,0.12)' : '0 0 0 3px var(--accent-glow)'
      }}
      onBlur={e => {
        e.target.style.borderColor = hasError ? 'var(--danger)' : 'var(--border-subtle)'
        e.target.style.boxShadow = 'none'
      }}
    />
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--danger)', lineHeight: 1.4 }}>{msg}</p>
}

function AlertBox({ type, message }) {
  const isError = type === 'error'
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8, fontSize: 12, lineHeight: 1.55,
      background: isError ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
      color: isError ? 'var(--danger)' : 'var(--success)',
    }}>
      {message}
    </div>
  )
}

const OAUTH_BTN_BASE = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 500,
  border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
  color: 'var(--text-primary)', transition: 'border-color 0.15s, background 0.15s',
  cursor: 'pointer',
}

function OAuthButtons({ loading, onOAuth }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { provider: 'google', label: 'Continue with Google', icon: <GoogleIcon /> },
        { provider: 'github', label: 'Continue with GitHub', icon: <GitHubIcon /> },
      ].map(({ provider, label, icon }) => (
        <button
          key={provider}
          type="button"
          onClick={() => onOAuth(provider)}
          disabled={!!loading}
          style={{ ...OAUTH_BTN_BASE, opacity: loading ? 0.6 : 1 }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--border-active)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
        >
          {loading === provider ? <Spinner /> : icon}
          {label}
        </button>
      ))}
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  )
}

function SubmitButton({ loading, loadingKey, label, loadingLabel }) {
  const isLoading = loading === loadingKey
  return (
    <button
      type="submit"
      disabled={!!loading}
      style={{
        width: '100%', padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
        background: isLoading ? 'var(--bg-elevated)' : 'var(--accent-primary)',
        border: 'none', color: '#fff',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.2s', marginTop: 4,
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.filter = 'brightness(1.12)'; e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)' } }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {isLoading ? <><Spinner />{loadingLabel}</> : label}
    </button>
  )
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
      <svg
        width="56" height="56" viewBox="0 0 40 40"
        style={{ marginBottom: 14, filter: 'drop-shadow(0 0 18px rgba(124,111,247,0.5))', borderRadius: 10 }}
      >
        <rect width="40" height="40" rx="10" fill="#7C6FF7"/>
        <line x1="6"  y1="10" x2="6"  y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="15" y1="10" x2="15" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="6"  y1="20" x2="15" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="20" y1="10" x2="34" y2="10" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="27" y1="10" x2="27" y2="30" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
        HireTrack
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>
        Track. Apply. Succeed.
      </span>
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onSwitch }) {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(null)
  const [error, setError]         = useState(null)
  const [resetSent, setResetSent] = useState(false)

  async function handleOAuth(provider) {
    setLoading(provider)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
    if (error) { setError(error.message); setLoading(null) }
  }

  async function handleSignIn(e) {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Email and password are required'); return }
    setLoading('email')
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError(error.message); setLoading(null) }
    // on success: onAuthStateChange fires → AuthContext sets user → ProtectedRoute navigates to /
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first, then click "Forgot password?"')
      return
    }
    setLoading('reset')
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(null)
    if (error) setError(error.message)
    else setResetSent(true)
  }

  return (
    <div className="anim-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Welcome back
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Sign in to your HireTrack account
        </p>
      </div>

      <OAuthButtons loading={loading} onOAuth={handleOAuth} />
      <Divider />

      <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <TextInput
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(null) }}
          autoComplete="email"
        />

        <div>
          <TextInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null) }}
            autoComplete="current-password"
          />
          <div style={{ textAlign: 'right', marginTop: 7 }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={!!loading}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: 12, color: 'var(--accent-primary)', opacity: loading === 'reset' ? 0.6 : 1,
              }}
            >
              {loading === 'reset' ? 'Sending…' : 'Forgot password?'}
            </button>
          </div>
        </div>

        {resetSent && <AlertBox type="success" message="Password reset email sent! Check your inbox." />}
        {error && <AlertBox type="error" message={error} />}

        <SubmitButton loading={loading} loadingKey="email" label="Sign In" loadingLabel="Signing in…" />
      </form>

      <p style={{ margin: '22px 0 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        {"Don't have an account?"}{' '}
        <button
          type="button"
          onClick={onSwitch}
          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}
        >
          Create one →
        </button>
      </p>
    </div>
  )
}

// ─── Signup Screen ────────────────────────────────────────────────────────────
function SignupScreen({ onSwitch }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(null)
  const [errors, setErrors]     = useState({})
  const [success, setSuccess]   = useState(false)

  function clearFieldError(field) {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  async function handleOAuth(provider) {
    setLoading(provider)
    setErrors({})
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
    if (error) { setErrors({ general: error.message }); setLoading(null) }
  }

  function validate() {
    const e = {}
    if (!email.trim()) e.email = 'Email is required'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!confirm) e.confirm = 'Please confirm your password'
    else if (confirm !== password) e.confirm = 'Passwords do not match'
    return e
  }

  async function handleSignUp(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading('email')
    setErrors({})
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() || null } },
    })
    setLoading(null)
    if (error) setErrors({ general: error.message })
    else setSuccess(true)
  }

  if (success) {
    return (
      <div className="anim-fade-in" style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          width: 58, height: 58, borderRadius: '50%', margin: '0 auto 18px',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckIcon />
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Check your email
        </h2>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          We sent a confirmation link to
        </p>
        <p style={{ margin: '0 0 26px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {email}
        </p>
        <p style={{ margin: '0 0 26px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Click the link in the email to activate your account, then sign in.
        </p>
        <button
          type="button"
          onClick={onSwitch}
          style={{
            background: 'none', border: '1px solid var(--border-default)', borderRadius: 8,
            padding: '9px 22px', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
        >
          ← Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="anim-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Start tracking smarter
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Create your free account — 30 days full access
        </p>
      </div>

      <OAuthButtons loading={loading} onOAuth={handleOAuth} />
      <Divider />

      <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <TextInput
          type="text"
          placeholder="Full name (optional)"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          autoComplete="name"
        />

        <div>
          <TextInput
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
            hasError={!!errors.email}
            autoComplete="email"
          />
          <FieldError msg={errors.email} />
        </div>

        <div>
          <TextInput
            type="password"
            placeholder="Password (8+ characters)"
            value={password}
            onChange={e => { setPassword(e.target.value); clearFieldError('password') }}
            hasError={!!errors.password}
            autoComplete="new-password"
          />
          <FieldError msg={errors.password} />
        </div>

        <div>
          <TextInput
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); clearFieldError('confirm') }}
            hasError={!!errors.confirm}
            autoComplete="new-password"
          />
          <FieldError msg={errors.confirm} />
        </div>

        {errors.general && <AlertBox type="error" message={errors.general} />}

        <SubmitButton loading={loading} loadingKey="email" label="Create Account" loadingLabel="Creating account…" />
      </form>

      <p style={{ margin: '22px 0 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}
        >
          Sign in →
        </button>
      </p>

      <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        By signing up you agree to our{' '}
        <span style={{ color: 'var(--text-secondary)' }}>Terms of Service</span>
      </p>
    </div>
  )
}

// ─── Page shell ───────────────────────────────────────────────────────────────
export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(rgba(124,111,247,0.12) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 20,
        padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,111,247,0.08)',
      }}>
        <Logo />
        {mode === 'signin'
          ? <LoginScreen  key="signin"  onSwitch={() => setMode('signup')} />
          : <SignupScreen key="signup"  onSwitch={() => setMode('signin')} />
        }
      </div>
    </div>
  )
}
