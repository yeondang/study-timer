import { useEffect, useRef, useState } from 'react'
import Avatar from '@/components/common/Avatar'
import ThemePicker from '@/components/common/ThemePicker'
import { useProfileStore } from '@/store/useProfileStore'
import { supabase } from '@/lib/supabase'

const EMOJIS = ['📚', '✏️', '💻', '🧠', '🔥', '🎯', '☕', '🍚', '🎧', '😴', '💪', '🌙']

const PRESETS = [
  { emoji: '🔥', text: '집중 모드, 말 걸지 마세요' },
  { emoji: '☕', text: '잠깐 쉬는 중' },
  { emoji: '🍚', text: '밥 먹고 올게요' },
  { emoji: '🎯', text: '시험 D-day' },
]

export default function SettingsPage() {
  const nickname = useProfileStore((s) => s.nickname)
  const avatarUrl = useProfileStore((s) => s.avatarUrl)
  const statusEmoji = useProfileStore((s) => s.statusEmoji)
  const statusText = useProfileStore((s) => s.statusText)
  const updateNickname = useProfileStore((s) => s.updateNickname)
  const uploadAvatar = useProfileStore((s) => s.uploadAvatar)
  const removeAvatar = useProfileStore((s) => s.removeAvatar)
  const setCustomStatus = useProfileStore((s) => s.setCustomStatus)

  const fileRef = useRef<HTMLInputElement>(null)
  const [nameInput, setNameInput] = useState(nickname)
  const [emojiInput, setEmojiInput] = useState(statusEmoji)
  const [textInput, setTextInput] = useState(statusText)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<{ area: string; text: string; ok: boolean } | null>(null)

  useEffect(() => setNameInput(nickname), [nickname])
  useEffect(() => {
    setEmojiInput(statusEmoji)
    setTextInput(statusText)
  }, [statusEmoji, statusText])

  const show = (area: string, error: string | null, okText: string) =>
    setMsg({ area, text: error ?? okText, ok: !error })

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const err = await uploadAvatar(file)
    setUploading(false)
    show('avatar', err, '프로필 사진을 바꿨어요.')
  }

  const saveNickname = async () => {
    const err = await updateNickname(nameInput)
    show('nickname', err, '닉네임을 저장했어요.')
  }

  const saveStatus = async (emoji = emojiInput, text = textInput) => {
    const err = await setCustomStatus(emoji, text)
    show('status', err, '상태를 저장했어요. 그룹원에게 바로 보여요.')
  }
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    const ok = confirm(
      '정말 탈퇴할까요?\n\n계정과 공부 기록, 할 일, 프로필 등 모든 데이터가 삭제되고 복구할 수 없어요.\n내가 만든 그룹은 삭제되어 다른 멤버도 그룹에서 빠져요.'
    )
    if (!ok) return
    if (prompt('확인을 위해 "탈퇴"라고 입력해 주세요.') !== '탈퇴') return

    setDeleting(true)
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user.id
    if (uid) await supabase.storage.from('avatars').remove([`${uid}/avatar.jpg`])

    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      setDeleting(false)
      alert(`탈퇴하지 못했어요: ${error.message}`)
      return
    }
    localStorage.removeItem('study-timer-runtime')
    await supabase.auth.signOut()
  }

  const Msg = ({ area }: { area: string }) =>
    msg && msg.area === area ? (
      <p className={`mt-2 text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>
    ) : null

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">⚙️ 설정</h1>

      {/* 프로필 */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">프로필</h2>

        <div className="mt-4 flex items-center gap-4">
          <Avatar url={avatarUrl} name={nickname} size={80} />
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                {uploading ? '올리는 중...' : '사진 변경'}
              </button>
              {avatarUrl && (
                <button
                  onClick={async () => show('avatar', await removeAvatar(), '사진을 삭제했어요.')}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  삭제
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">JPG/PNG/WEBP · 자동으로 정사각형으로 잘려요</p>
          </div>
        </div>
        <Msg area="avatar" />

        <div className="mt-5">
          <label className="text-sm font-medium">닉네임</label>
          <div className="mt-1 flex gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={20}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              onClick={saveNickname}
              disabled={!nameInput.trim() || nameInput.trim() === nickname}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-300"
            >
              저장
            </button>
          </div>
          <Msg area="nickname" />
        </div>
      </section>

      {/* 사용자 지정 상태 */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">내 상태 메시지</h2>
        <p className="mt-1 text-sm text-slate-500">
          "공부 중", "휴식 중" 같은 자동 상태와 별개로 그룹원에게 함께 보여요.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setEmojiInput(em)}
              className={`h-9 w-9 rounded-lg text-lg ${
                emojiInput === em
                  ? 'bg-blue-100 ring-2 ring-blue-500'
                  : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {em}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={emojiInput}
            onChange={(e) => setEmojiInput(e.target.value)}
            maxLength={8}
            placeholder="🙂"
            className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-lg outline-none focus:border-blue-500"
            aria-label="이모지"
          />
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            maxLength={40}
            placeholder="상태 메시지 (40자)"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.text}
              type="button"
              onClick={() => {
                setEmojiInput(p.emoji)
                setTextInput(p.text)
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              {p.emoji} {p.text}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => saveStatus()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            상태 저장
          </button>
          <button
            onClick={() => {
              setEmojiInput('')
              setTextInput('')
              saveStatus('', '')
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            지우기
          </button>
        </div>
        <Msg area="status" />
      </section>
      
            {/* 테마 색상 */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">테마 색상</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          버튼, 메뉴 등 앱 전체의 포인트 색을 바꿔요. 이 기기에 저장돼요.
        </p>
        <ThemePicker />
      </section>
      {/* 회원 탈퇴 */}
      <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-red-600">회원 탈퇴</h2>
        <p className="mt-1 text-sm text-slate-500">
          탈퇴하면 계정과 모든 데이터가 삭제되고 복구할 수 없어요.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? '처리 중...' : '회원 탈퇴'}
        </button>
      </section>
    </div>
  )
}