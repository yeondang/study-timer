import { DEFAULT_SETTINGS, useTimerStore } from '@/store/useTimerStore'
import type { AwayMode } from '@/types'

const MODES: { value: AwayMode; title: string; desc: string }[] = [
  {
    value: 'pause',
    title: '일시정지',
    desc: '유예 시간이 지나면 타이머가 멈춰요. 돌아와서 "계속"을 눌러야 다시 시작돼요.',
  },
  {
    value: 'away',
    title: '자리 비움 표시',
    desc: '유예 시간이 지나면 "자리 비움"으로 바뀌고 시간이 멈춰요. 돌아오면 자동으로 이어져요.',
  },
  {
    value: 'record_only',
    title: '기록만 하기',
    desc: '타이머는 계속 흘러가요. 대신 이탈 횟수와 자리 비움 시간만 통계로 기록해요.',
  },
]

export default function SettingsPage() {
  const settings = useTimerStore((s) => s.settings)
  const status = useTimerStore((s) => s.status)
  const updateSettings = useTimerStore((s) => s.updateSettings)
  const resetSettings = useTimerStore((s) => s.resetSettings)

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">⚙️ 설정</h1>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">이탈 감지 방식</h2>
        <p className="mt-1 text-sm text-slate-500">
          공부 중 다른 탭으로 이동하거나 창을 최소화했을 때의 처리 방식이에요.
        </p>

        <div className="mt-4 space-y-2">
          {MODES.map((m) => {
            const selected = settings.awayMode === m.value
            return (
              <label
                key={m.value}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                  selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="awayMode"
                  checked={selected}
                  onChange={() => updateSettings({ awayMode: m.value })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{m.title}</div>
                  <div className="text-sm text-slate-500">{m.desc}</div>
                </div>
              </label>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">유예 시간</h2>
          <span className="text-lg font-bold text-blue-600">{settings.graceSeconds}초</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          이 시간 안에 돌아오면 이탈로 보지 않아요. (5초 ~ 300초)
        </p>

        <input
          type="range"
          min={5}
          max={300}
          step={5}
          value={settings.graceSeconds}
          onChange={(e) => updateSettings({ graceSeconds: Number(e.target.value) })}
          className="mt-4 w-full"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>5초</span>
          <span>300초</span>
        </div>

        {status !== 'idle' && (
          <p className="mt-3 text-xs text-slate-400">
            공부 중에 바꾼 설정은 다음 이탈부터 적용돼요.
          </p>
        )}
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          기본값: 유예 {DEFAULT_SETTINGS.graceSeconds}초 / 일시정지
        </p>
        <button
          onClick={resetSettings}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          기본값으로 되돌리기
        </button>
      </div>
    </div>
  )
}