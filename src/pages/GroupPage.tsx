import { useEffect, useState } from 'react'
import MemberStatusList from '@/components/group/MemberStatusList'
import { useGroupMembers } from '@/hooks/useGroupMembers'
import { useAuthStore } from '@/store/useAuthStore'
import { useGroupStore } from '@/store/useGroupStore'

export default function GroupPage() {
  const myId = useAuthStore((s) => s.session?.user.id) ?? ''
  const groups = useGroupStore((s) => s.groups)
  const loaded = useGroupStore((s) => s.loaded)
  const loadError = useGroupStore((s) => s.loadError)
  const loadGroups = useGroupStore((s) => s.loadGroups)
  const createGroup = useGroupStore((s) => s.createGroup)
  const joinGroup = useGroupStore((s) => s.joinGroup)
  const leaveGroup = useGroupStore((s) => s.leaveGroup)
  const deleteGroup = useGroupStore((s) => s.deleteGroup)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const current = groups.find((g) => g.id === selectedId) ?? groups[0] ?? null
  const { members, live, loading, error } = useGroupMembers(
    current?.id ?? null,
    current?.ownerId ?? null
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setBusy(true)
    const r = await createGroup(name)
    setBusy(false)
    if (r.error) setMsg(r.error)
    else {
      setName('')
      setSelectedId(r.id)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setBusy(true)
    const r = await joinGroup(code)
    setBusy(false)
    if (r.error) setMsg(r.error)
    else {
      setCode('')
      setSelectedId(r.id)
    }
  }

  const copyCode = async () => {
    if (!current) return
    try {
      await navigator.clipboard.writeText(current.inviteCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      alert(`초대 코드: ${current.inviteCode}`)
    }
  }

  const handleLeave = async () => {
    if (!current) return
    const isOwner = current.ownerId === myId
    const ok = confirm(
      isOwner
        ? `'${current.name}' 그룹을 삭제할까요? 모든 멤버가 그룹에서 빠져요.`
        : `'${current.name}' 그룹에서 나갈까요?`
    )
    if (!ok) return
    const err = isOwner ? await deleteGroup(current.id) : await leaveGroup(current.id)
    if (err) alert(err)
    else setSelectedId(null)
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">👥 그룹</h1>

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      {/* 만들기 / 참여하기 */}
      <section className="grid gap-4 sm:grid-cols-2">
        <form onSubmit={handleCreate} className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">새 그룹 만들기</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="그룹 이름"
              maxLength={30}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-300"
            >
              만들기
            </button>
          </div>
        </form>

        <form onSubmit={handleJoin} className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">초대 코드로 참여</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="6자리 코드"
              maxLength={6}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={busy || code.trim().length < 6}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              참여
            </button>
          </div>
        </form>
      </section>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {/* 내 그룹 */}
      {!loaded ? (
        <p className="py-8 text-center text-slate-400">불러오는 중...</p>
      ) : groups.length === 0 ? (
        <p className="rounded-2xl bg-white py-10 text-center text-sm text-slate-400 shadow-sm">
          아직 참여한 그룹이 없어요. 그룹을 만들거나 초대 코드로 참여해 보세요.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  g.id === current?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {current && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{current.name}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    초대 코드
                    <code className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold tracking-widest text-slate-700">
                      {current.inviteCode}
                    </code>
                    <button onClick={copyCode} className="text-blue-600 hover:underline">
                      {copied ? '복사됨!' : '복사'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleLeave}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {current.ownerId === myId ? '그룹 삭제' : '그룹 나가기'}
                </button>
              </div>

              <div className="mt-5">
                {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
                {loading && members.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">불러오는 중...</p>
                ) : (
                  <MemberStatusList members={members} live={live} myId={myId} />
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}