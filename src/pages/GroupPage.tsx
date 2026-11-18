import { useEffect, useState } from 'react'
import MemberStatusList from '@/components/group/MemberStatusList'
import { useGroupMembers } from '@/hooks/useGroupMembers'
import { useAuthStore } from '@/store/useAuthStore'
import { useGroupStore } from '@/store/useGroupStore'
import type { GroupMember } from '@/types'

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
  const updateGroup = useGroupStore((s) => s.updateGroup)
  const regenerateCode = useGroupStore((s) => s.regenerateCode)
  const kickMember = useGroupStore((s) => s.kickMember)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  // 그룹 정보 수정 폼
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editMax, setEditMax] = useState(20)
  const [editMsg, setEditMsg] = useState('')

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const current = groups.find((g) => g.id === selectedId) ?? groups[0] ?? null
  const isOwner = current?.ownerId === myId
  const { members, live, loading, error, refresh } = useGroupMembers(
    current?.id ?? null,
    current?.ownerId ?? null
  )

  // 다른 그룹으로 바꾸면 수정 폼 닫기
  useEffect(() => {
    setEditing(false)
    setEditMsg('')
  }, [current?.id])

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

  const startEdit = () => {
    if (!current) return
    setEditName(current.name)
    setEditDesc(current.description)
    setEditMax(current.maxMembers)
    setEditMsg('')
    setEditing(true)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current) return
    setBusy(true)
    const err = await updateGroup(current.id, {
      name: editName,
      description: editDesc,
      maxMembers: editMax,
    })
    setBusy(false)
    if (err) setEditMsg(err)
    else setEditing(false)
  }

  const handleRegenerate = async () => {
    if (!current) return
    if (!confirm('초대 코드를 새로 만들까요? 이전 코드는 바로 사용할 수 없게 돼요.')) return
    const err = await regenerateCode(current.id)
    if (err) alert(err)
  }

  const handleKick = async (m: GroupMember) => {
    if (!current) return
    if (!confirm(`'${m.nickname}' 님을 그룹에서 내보낼까요?`)) return
    const err = await kickMember(current.id, m.userId)
    if (err) alert(err)
    else refresh()
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
          <p className="mt-2 text-xs text-slate-400">소개와 최대 인원은 만든 뒤에 수정할 수 있어요.</p>
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
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{current.name}</h2>
                  {current.description && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                      {current.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <span>
                      인원{' '}
                      <b className="text-slate-700">
                        {members.length} / {current.maxMembers}
                      </b>
                      명
                    </span>
                    <span className="flex items-center gap-2">
                      초대 코드
                      <code className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold tracking-widest text-slate-700">
                        {current.inviteCode}
                      </code>
                      <button onClick={copyCode} className="text-blue-600 hover:underline">
                        {copied ? '복사됨!' : '복사'}
                      </button>
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isOwner && !editing && (
                    <button
                      onClick={startEdit}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      그룹 정보 수정
                    </button>
                  )}
                  <button
                    onClick={handleLeave}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {isOwner ? '그룹 삭제' : '그룹 나가기'}
                  </button>
                </div>
              </div>

              {/* 그룹 정보 수정 (그룹장) */}
              {isOwner && editing && (
                <form
                  onSubmit={saveEdit}
                  className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <label className="text-sm font-medium">그룹 이름</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={30}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">소개</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      maxLength={200}
                      rows={3}
                      placeholder="그룹을 소개해 주세요. (목표, 규칙 등)"
                      className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <div className="text-right text-xs text-slate-400">{editDesc.length} / 200</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">최대 인원</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min={Math.max(2, members.length)}
                        max={100}
                        value={editMax}
                        onChange={(e) => setEditMax(Number(e.target.value))}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-blue-500"
                      />
                      <span className="text-sm text-slate-500">
                        명 (2~100, 현재 {members.length}명)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      초대 코드 재발급
                    </button>
                    <span className="text-xs text-slate-400">코드가 유출됐을 때 사용하세요.</span>
                  </div>

                  {editMsg && <p className="text-sm text-red-600">{editMsg}</p>}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={busy || !editName.trim()}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
                    >
                      {busy ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-5">
                {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
                {loading && members.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">불러오는 중...</p>
                ) : (
                  <MemberStatusList
                    members={members}
                    live={live}
                    myId={myId}
                    onKick={isOwner ? handleKick : undefined}
                  />
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}