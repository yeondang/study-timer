import { hexToRgb, rgbToHex } from '@/lib/color'

export const DEFAULT_THEME = '#D97757'
export type ThemeText = 'white' | 'black'
export const DEFAULT_THEME_TEXT: ThemeText = 'white'

export const THEME_PRESETS = [
  { name: '테라코타', hex: '#D97757' },
  { name: '파랑', hex: '#3B82F6' },
  { name: '초록', hex: '#10B981' },
  { name: '보라', hex: '#8B5CF6' },
  { name: '분홍', hex: '#EC4899' },
  { name: '청록', hex: '#14B8A6' },
  { name: '회색', hex: '#64748B' },
]

type RGB = [number, number, number]

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

const WHITE: RGB = [255, 255, 255]
const BLACK: RGB = [0, 0, 0]

// 앱 전체의 "blue-*" 색을 사용자가 고른 색으로 덮어쓰기 (600 = 고른 색 그대로)
export function applyTheme(hex: string) {
  const base = hexToRgb(hex)

  const steps: [number, RGB][] = [
    [50, mix(base, WHITE, 0.92)],
    [100, mix(base, WHITE, 0.84)],
    [200, mix(base, WHITE, 0.68)],
    [300, mix(base, WHITE, 0.5)],
    [400, mix(base, WHITE, 0.25)],
    [500, base],
    [600, base],
    [700, mix(base, BLACK, 0.12)], // 마우스를 올렸을 때만 살짝 어둡게
    [800, mix(base, BLACK, 0.3)],
    [900, mix(base, BLACK, 0.45)],
  ]

  const root = document.documentElement
  for (const [step, [r, g, b]] of steps) {
    root.style.setProperty(`--color-blue-${step}`, rgbToHex(r, g, b))
  }
}

// 테마 색 배경 위 글자색 적용
export function applyThemeText(text: ThemeText) {
  document.documentElement.style.setProperty(
    '--theme-on-color',
    text === 'black' ? '#000000' : '#ffffff'
  )
}