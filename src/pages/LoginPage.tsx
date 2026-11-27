import { useState } from 'react'
import GoogleIcon from '@/components/icons/GoogleIcon'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Link, Navigate } from 'react-router-dom'

type Mode = 'login' | 'signup'

function toKorean(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요.'
  if (m.includes('email not confirmed')) return '이메일 인증이 아직 완료되지 않았어요. 메일함을 확인해 주세요.'
  if (m.includes('already registered')) return '이미 가입된 이메일이에요. 로그인해 주세요.'
  if (m.includes('at least')) return '비밀번호는 6자 이상이어야 해요.'
  if (m.includes('rate limit')) return '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
  if (m.includes('valid email') || m.includes('invalid email')) return '이메일 형식이 올바르지 않아요.'
  return message
}

export default function LoginPage() {
  const session = useAuthStore((s) => s.session)
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [agreed, setAgreed] = useState(false)
  const CONSENT_ERROR = '이용약관과 개인정보처리방침에 동의해야 가입할 수 있어요.'

  if (session) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (mode === 'signup' && !agreed) {
      setError(CONSENT_ERROR)
      return
    }
    setBusy(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(toKorean(error.message))
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(toKorean(error.message))
      } else if (data.user && data.user.identities?.length === 0) {
        setError('이미 가입된 이메일이에요. 로그인해 주세요.')
      } else if (!data.session) {
        setInfo('가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.')
        setMode('login')
      }
    }
    setBusy(false)
  }

  const handleGoogle = async () => {
    setError('')
    if (mode === 'signup' && !agreed) {
      setError(CONSENT_ERROR)
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(toKorean(error.message))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-blue-600">StudyTimer</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          {mode === 'login' ? '로그인하고 공부를 시작해요' : '새 계정을 만들어요'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 (6자 이상)"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          {mode === 'signup' && (
            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                (필수) 만 14세 이상이며{' '}
                <Link to="/terms" target="_blank" className="text-blue-600 underline">
                  이용약관
                </Link>
                과{' '}
                <Link to="/privacy" target="_blank" className="text-blue-600 underline">
                  개인정보처리방침
                </Link>
                에 동의합니다.
              </span>
            </label>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            {busy ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          또는
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 py-2.5 text-sm font-medium hover:bg-slate-50"
        >
          <GoogleIcon />
          Google로 계속하기
        </button>

        {mode === 'login' && (
          <p className="mt-3 text-center text-xs text-slate-400">
            로그인하면{' '}
            <Link to="/terms" target="_blank" className="underline">이용약관</Link>과{' '}
            <Link to="/privacy" target="_blank" className="underline">개인정보처리방침</Link>에
            동의한 것으로 봅니다.
          </p>
        )}
        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'login' ? '계정이 없나요?' : '이미 계정이 있나요?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
              setInfo('')
            }}
            className="font-semibold text-blue-600 hover:underline"
          >
            {mode === 'login' ? '가입하기' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  )
}