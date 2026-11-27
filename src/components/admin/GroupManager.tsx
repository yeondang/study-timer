import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDuration } from '@/lib/time'

interface GroupRow {
  g_id: string
  g_name: string
  g_desc: string | null
  g_max: number
  g_code: string
  g_owner: string
  g_owner_nick: string | null
  g_owner_email: string | null
  g_members: number | string
  g_created: string
}

interface MemberRow {
  m_uid: string
  m_nick: string | null
  m_email: string | null
  m_joined: string
  m_is_owner: boolean
  m_week_seconds: number | string
  m_status: string
}

const STATUS: Record<string, string> = {
  studying: '🟢 공부 중',
  resting: '🟡 휴식 중',
  away: '🔴 자리 비움',
  offline: '⚪ 오프라인',
}

const day = (s: string) => new Date(s).toLocaleDateString('ko-KR')

export default function GroupManager() {
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [target, setTarget] = useState<GroupRow | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(false)

  const loadGroups = async () => {
    const { data, error } = await supabase.rpc('admin_list_groups')
    if (error) setError(error.message)
    else {
      setError('')
      setGroups((data ?? []) as GroupRow[])
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const loadMembers = async (g: GroupRow) => {
    setLoading(true)
    const { data, error } = await supabase.rpc('admin_group_members', { target: g.g_id })
    setLoading(false)
    if (error) setError(error.message)
    else setMembers((data ?? []) as MemberRow[])
  }

  const open = (g: GroupRow) => {
    setTarget(g)
    setMembers([])
    setError('')
    loadMembers(g)
  }

  const kick = async (m: MemberRow) => {
    if (!target) return
    if (!confirm(`'${m.m_nick ?? m.m_email}' 님을 그룹에서 내보낼까요?`)) return
    const { error } = await supabase.rpc('admin_kick_member', {
      p_gid: target.g_id,
      p_uid: m.m_uid,
    })
    if (error) {
      setError(error.message)
      return
    }
    loadMembers(target)
    loadGroups()
  }

  const removeGroup = async () => {
    if (!target) return
    if (!confirm(`'${target.g_name}' 그룹을 삭제할까요? 모든 멤버가 빠지고 복구할 수 없어요.`)) return
    const { error } = await supabase.rpc('admin_delete_group', { p_id: target.g_id })
    if (error) {
      setError(error.message)
      return
    }
    setTarget(null)
    loadGroups()
  }

  const q = query.trim().toLowerCase()
  const filtered = groups.filter(
    (g) =>
      !q ||
      g.g_name.toLowerCase().includes(q) ||
      g.g_code.toLowerCase().includes(q) ||
      (g.g_owner_nick ?? '').toLowerCase().includes(q) ||
      (g.g_owner_email ?? '').toLowerCase().includes(q)
  )

  // ----- 그룹 상세 -----
  if (target) {
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <button onClick={() => setTarget(null)} className="text-sm text-blue-600 hover:underline">
          ← 목록으로
        </button>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{target.g_name}</h2>
            {target.g_desc && (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                {target.g_desc}
              </p>
            )}
            <div className="mt-2 text-xs text-slate-400">
              인원 {members.length || target.g_members} / {target.g_max} · 초대 코드{' '}
              <code className="font-mono">{target.g_code}</code> · 생성 {day(target.g_created)}
            </div>
          </div>
          <button
            onClick={removeGroup}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            그룹 삭제
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          이 화면을 연 기록이 접근 기록(admin_audit)에 남아요.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-2">닉네임</th>
                  <th>이메일</th>
                  <th>상태</th>
                  <th>가입일</th>
                  <th className="text-right">최근 7일</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.m_uid} className="border-t border-slate-100">
                    <td className="py-2 font-medium">
                      {m.m_nick ?? '-'}
                      {m.m_is_owner && <span className="ml-1 text-xs text-slate-400">👑</span>}
                    </td>
                    <td className="max-w-[180px] truncate text-slate-500">{m.m_email}</td>
                    <td className="text-xs">{STATUS[m.m_status] ?? m.m_status}</td>
                    <td className="text-slate-500">{day(m.m_joined)}</td>
                    <td className="text-right">{formatDuration(Number(m.m_week_seconds))}</td>
                    <td className="pl-3 text-right">
                      {!m.m_is_owner && (
                        <button
                          onClick={() => kick(m)}
                          className="text-xs text-slate-400 hover:text-red-500"
                        >
                          내보내기
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400">
          상태는 최근 신호 기준이라, 브라우저를 닫은 사람은 잠시 "공부 중"으로 남아 있을 수 있어요.
        </p>
      </section>
    )
  }

  // ----- 그룹 목록 -----
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">전체 그룹 ({groups.length}개)</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="그룹명, 그룹장, 초대 코드 검색"
          className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr>
              <th className="py-2">그룹명</th>
              <th>그룹장</th>
              <th>인원</th>
              <th>초대 코드</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr
                key={g.g_id}
                onClick={() => open(g)}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="max-w-[200px] truncate py-2 font-medium">{g.g_name}</td>
                <td className="max-w-[160px] truncate text-slate-500">
                  {g.g_owner_nick ?? g.g_owner_email ?? '-'}
                </td>
                <td>
                  {Number(g.g_members)} / {g.g_max}
                </td>
                <td className="font-mono text-slate-500">{g.g_code}</td>
                <td className="text-slate-500">{day(g.g_created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">그룹이 없어요.</p>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">그룹을 누르면 멤버를 볼 수 있어요. (최대 500개)</p>
    </section>
  )
}