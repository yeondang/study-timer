import ColorEditor from '@/components/timer/ColorEditor'
import { isTooLight, THEME_PRESETS } from '@/lib/theme'
import { usePrefsStore } from '@/store/usePrefsStore'

export default function ThemePicker() {
  const color = usePrefsStore((s) => s.themeColor)
  const setThemeColor = usePrefsStore((s) => s.setThemeColor)
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

      {isTooLight(color) && (
        <p className="mt-2 text-xs text-slate-500">
          밝은 색이라 버튼 글자가 잘 보이도록 글자에 그림자가 적용돼요.
        </p>
      )}

      <button
        type="button"
        onClick={resetTheme}
        className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        기본 색(테라코타)으로 되돌리기
      </button>
    </div>
  )
}