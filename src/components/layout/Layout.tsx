import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Avatar from '@/components/common/Avatar'
import { useAwayDetection } from '@/hooks/useAwayDetection'
import { useLiveStatusSync } from '@/hooks/useLiveStatusSync'
import { useAuthStore } from '@/store/useAuthStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useProfileStore } from '@/store/useProfileStore'
import { useTimerStore } from '@/store/useTimerStore'
import BugReportButton from '@/components/common/BugReportButton'

const menus = [
  { to: '/', label: '타이머' },
  { to: '/planner', label: '플래너' },
  { to: '/stats', label: '통계' },
  { to: '/group', label: '그룹' },
  { to: '/settings', label: '설정' },
]

export default function Layout() {
  useAwayDetection() // 이탈 감지 (모든 페이지에서 작동)
  useLiveStatusSync() // 내 상태를 그룹원에게 공유

  const session = useAuthStore((s) => s.session)
  const signOut = useAuthStore((s) => s.signOut)
  const userId = session?.user.id

  const loadTimer = useTimerStore((s) => s.loadAll)
  const loadPlanner = usePlannerStore((s) => s.loadAll)
  const loadProfile = useProfileStore((s) => s.loadProfile)
  const timerLoaded = useTimerStore((s) => s.loaded)
  const plannerLoaded = usePlannerStore((s) => s.loaded)
  const timerError = useTimerStore((s) => s.loadError)
  const plannerError = usePlannerStore((s) => s.loadError)
  const nickname = useProfileStore((s) => s.nickname)
  const avatarUrl = useProfileStore((s) => s.avatarUrl)

  // 로그인되면 DB에서 내 데이터 불러오기
  useEffect(() => {
    if (!userId) return
    loadTimer()
    loadPlanner()
    loadProfile()
  }, [userId, loadTimer, loadPlanner, loadProfile])

  const error = timerError ?? plannerError

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-slate-700">데이터를 불러오지 못했어요.</p>
        <p className="max-w-md text-xs text-red-500">{error}</p>
        <button
          onClick={() => {
            loadTimer()
            loadPlanner()
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!timerLoaded || !plannerLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-1 px-4 py-3">
          <span className="mr-4 font-bold text-blue-600">StudyTimer</span>
          {menus.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {m.label}
            </NavLink>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <NavLink to="/settings" className="flex items-center gap-2" title="프로필 설정">
              <Avatar url={avatarUrl} name={nickname || session?.user.email || '?'} size={28} />
              <span className="hidden max-w-[120px] truncate text-xs text-slate-600 sm:inline">
                {nickname || session?.user.email}
              </span>
            </NavLink>
            <button
              onClick={() => {
                if (confirm('로그아웃할까요?')) signOut()
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              로그아웃
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl">
        <Outlet />
      </main>
      <BugReportButton />
    </div>
  )
}