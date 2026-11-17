import { useEffect, useState } from 'react'
import { hexToRgb, isHex, rgbToHex } from '@/lib/color'

interface Props {
  color: string
  onChange: (hex: string) => void
}

const CHANNELS = [
  { key: 0, label: 'R', from: '#000000', to: '#ff0000' },
  { key: 1, label: 'G', from: '#000000', to: '#00ff00' },
  { key: 2, label: 'B', from: '#000000', to: '#0000ff' },
]

export default function ColorEditor({ color, onChange }: Props) {
  const rgb = hexToRgb(color)
  const [hexText, setHexText] = useState(color)

  // 슬라이더로 바뀐 색을 HEX 입력칸에도 반영
  useEffect(() => setHexText(color.toUpperCase()), [color])

  const setChannel = (idx: number, value: number) => {
    const next = [...rgb] as [number, number, number]
    next[idx] = Math.max(0, Math.min(255, Math.round(value) || 0))
    onChange(rgbToHex(next[0], next[1], next[2]))
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 shrink-0 rounded-lg border border-slate-200"
          style={{ backgroundColor: color }}
        />
        <input
          value={hexText}
          onChange={(e) => {
            setHexText(e.target.value)
            if (isHex(e.target.value)) {
              const v = e.target.value.trim()
              onChange((v.startsWith('#') ? v : `#${v}`).toUpperCase())
            }
          }}
          maxLength={7}
          className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm uppercase outline-none focus:border-blue-500"
          aria-label="HEX 색상 코드"
        />
      </div>

      <div className="mt-4 space-y-3">
        {CHANNELS.map((c) => (
          <div key={c.label} className="flex items-center gap-3">
            <span className="w-4 text-xs font-bold text-slate-500">{c.label}</span>
            <input
              type="range"
              min={0}
              max={255}
              value={rgb[c.key]}
              onChange={(e) => setChannel(c.key, Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full"
              style={{ background: `linear-gradient(to right, ${c.from}, ${c.to})` }}
            />
            <input
              type="number"
              min={0}
              max={255}
              value={rgb[c.key]}
              onChange={(e) => setChannel(c.key, Number(e.target.value))}
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-sm outline-none focus:border-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  )
}