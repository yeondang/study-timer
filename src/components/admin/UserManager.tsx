import { useEffect, useState } from 'react'
import Avatar from '@/components/common/Avatar'
import { supabase } from '@/lib/supabase'
import { formatDuration } from '@/lib/time'

interface UserRow {
  uid: string
  email: string | null
  nick: string | null
  avatar: string | null
  provider: string
  joined_at: string
  last_login: string | null
  total_seconds: number | string
  session_count: number | string
}

interface Profile {
  nickname: string | null
  avatar: string | null
  status_emoji: string | null
  status_text: string | null
  email: string | null
  provider: string
  joined_at: string
  last_login: string | null
  week_seconds: number
  groups: { name: string; is_owner: boolean }[]
}

interface SessionRow {
  sid: string
  s_date: string
  s_subject: string
  s_kind: string
  s_seconds: number
  s_note: string
  s_away: number
  s_created: string
}

const day = (s: string | null) => (s ? new Date(s).toLocaleDateString('ko-KR') : '-')
const providerLabel = (p: string) => (p === 'google' ? 'Google' : p === 'email' ? '이메일' : p)

export default function UserManager() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [target, setTarget] = useState<UserRow | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.rpc('admin_list_users').then(({ data, error }) => {
      if (error) setError(error.message)
      else setUsers((data ?? []) as UserRow[])
    })
  }, [])

  const open = async (u: UserRow) => {
    setTarget(u)
    setProfile(null)
    setSessions([])
    setError('')
    setLoading(true)
    const [p, s] = await Promise.all([
      supabase.rpc('admin_user_profile', { target: u.uid }),
      supabase.rpc('admin_user_sessions', { target: u.uid }),
    ])
    setLoading(false)
    if (p.error || s.error) setError((p.error ?? s.error)!.message)
    if (!p.error) setProfile(p.data as Profile)
    if (!s.error) setSessions((s.data ?? []) as SessionRow[])
  }

  const removeSession = async (s: SessionRow) => {
    if (!confirm('이 기록을 삭제할까요? 삭제는 복구할 수 없어요.')) return
    const { error } = await supabase.rpc('admin_delete_session', { p_id: s.sid })
    if (error) {
      setError(error.message)
      return
    }
    setSessions((prev) => prev.filter((x) => x.sid !== s.sid))
  }

  const q = query.trim().toLowerCase()
  const filtered = users.filter(
    (u) =>
      !q ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.nick ?? '').toLowerCase().includes(q)
  )

  // ----- 유저 상세 -----
  if (target) {
    const nick = profile?.nickname ?? target.nick ?? '(닉네임 없음)'
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <button onClick={() => setTarget(null)} className="text-sm text-blue-600 hover:underline">
          ← 목록으로
        </button>

        <div className="mt-4 flex items-start gap-4">
          <Avatar url={profile?.avatar ?? target.avatar} name={nick} size={72} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{nick}</h2>
            <div className="text-sm text-slate-500">{target.email}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {providerLabel(profile?.provider ?? target.provider)}
              </span>
              <span>가입 {day(target.joined_at)}</span>
              <span>마지막 접속 {day(target.last_login)}</span>
            </div>
            {(profile?.status_emoji || profile?.status_text) && (
              <div className="mt-2 text-sm text-slate-600">
                상태 메시지: {profile?.status_emoji} {profile?.status_text}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">총 공부</div>
            <div className="mt-1 font-bold">{formatDuration(Number(target.total_seconds))}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">최근 7일</div>
            <div className="mt-1 font-bold">
              {profile ? formatDuration(Number(profile.week_seconds)) : '-'}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">기록 수</div>
            <div className="mt-1 font-bold">{Number(target.session_count)}건</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium text-slate-500">소속 그룹</div>
          {profile && profile.groups.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.groups.map((g, i) => (
                <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                  {g.name}
                  {g.is_owner && ' 👑'}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-400">소속 그룹이 없어요.</p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          이 화면을 연 기록이 접근 기록(admin_audit)에 남아요.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <h3 className="mt-5 text-sm font-semibold">공부 기록</h3>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
        ) : sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">공부 기록이 없어요.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {sessions.map((s) => (
              <li key={s.sid} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-20 shrink-0 text-slate-500">{s.s_date.slice(2)}</span>
                <span className="w-20 shrink-0 truncate">{s.s_subject}</span>
                <span
                  className={`w-24 shrink-0 font-semibold ${
                    s.s_seconds < 0 ? 'text-red-500' : ''
                  }`}
                >
                  {s.s_seconds < 0 ? '-' : ''}
                  {formatDuration(Math.abs(s.s_seconds))}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                  {s.s_kind === 'manual' && (
                    <span className="mr-1 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">
                      수동 조정
                    </span>
                  )}
                  {s.s_note}
                </span>
                <button
                  onClick={() => removeSession(s)}
                  className="shrink-0 text-xs text-slate-400 hover:text-red-500"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
        {sessions.length >= 500 && (
          <p className="mt-2 text-xs text-slate-400">최근 500건까지만 표시돼요.</p>
        )}
      </section>
    )
  }

  // ----- 유저 목록 -----
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">전체 유저 ({users.length}명)</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이메일 또는 닉네임 검색"
          className="w-60 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr>
              <th className="py-2">유저</th>
              <th>이메일</th>
              <th>가입</th>
              <th>가입일</th>
              <th>마지막 접속</th>
              <th className="text-right">총 공부</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.uid}
                onClick={() => open(u)}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <Avatar url={u.avatar} name={u.nick ?? u.email ?? '?'} size={28} />
                    <span className="font-medium">{u.nick ?? '-'}</span>
                  </div>
                </td>
                <td className="max-w-[180px] truncate text-slate-500">{u.email}</td>
                <td className="text-xs text-slate-500">{providerLabel(u.provider)}</td>
                <td className="text-slate-500">{day(u.joined_at)}</td>
                <td className="text-slate-500">{day(u.last_login)}</td>
                <td className="text-right">{formatDuration(Number(u.total_seconds))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">검색 결과가 없어요.</p>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">유저를 누르면 프로필과 공부 기록을 볼 수 있어요. (최대 500명)</p>
    </section>
  )
}