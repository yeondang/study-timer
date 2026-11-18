import ColorEditor from '@/components/timer/ColorEditor'
import { THEME_PRESETS } from '@/lib/theme'
import { usePrefsStore } from '@/store/usePrefsStore'

export default function ThemePicker() {
  const color = usePrefsStore((s) => s.themeColor)
  const text = usePrefsStore((s) => s.themeText)
  const setThemeColor = usePrefsStore((s) => s.setThemeColor)
  const setThemeText = usePrefsStore((s) => s.setThemeText)
  const resetTheme = usePrefsStore((s) => s.resetTheme)

  return (
    <div>
      <div className="text-sm font-medium">추천 색상</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {THEME_PRESETS.map((p) => (
          <button
            key={p.hex}
            type="button"
            onClick={() => setThemeColor(p.hex)}
            title={p.name}
            aria-label={p.name}
            className={`h-9 w-9 rounded-full ${
              color.toUpperCase() === p.hex ? 'ring-2 ring-slate-800 ring-offset-2' : ''
            }`}
            style={{ backgroundColor: p.hex }}
          />
        ))}
      </div>

      <div className="mt-4 text-sm font-medium">직접 고르기 (RGB / HEX)</div>
      <ColorEditor color={color} onChange={setThemeColor} />

      <div className="mt-4 text-sm font-medium">버튼 글자색</div>
      <div className="mt-2 flex gap-2">
        {(
          [
            { value: 'white', label: '흰색', bg: '#ffffff', fg: '#000000' },
            { value: 'black', label: '검정', bg: '#000000', fg: '#ffffff' },
          ] as const
        ).map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setThemeText(o.value)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
              text === o.value
                ? 'border-slate-800 ring-1 ring-slate-800'
                : 'border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span
              className="h-4 w-4 rounded-full border border-slate-300"
              style={{ backgroundColor: o.bg }}
            />
            {o.label}
          </button>
        ))}
      </div>

      {/* 미리보기 */}
      <div className="mt-3">
        <span className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          미리보기 버튼
        </span>
      </div>

      <button
        type="button"
        onClick={resetTheme}
        className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        기본 색(테라코타)으로 되돌리기
      </button>
    </div>
  )
}