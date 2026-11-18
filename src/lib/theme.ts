import { hexToRgb, rgbToHex } from '@/lib/color'

export const DEFAULT_THEME = '#D97757'

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

// 단계별로 흰색/검정과 섞는 비율 (500이 선택한 색 그대로)
const STEPS: [number, RGB, number][] = [
  [50, WHITE, 0.92],
  [100, WHITE, 0.84],
  [200, WHITE, 0.68],
  [300, WHITE, 0.5],
  [400, WHITE, 0.25],
  [500, WHITE, 0],
  [600, BLACK, 0.12],
  [700, BLACK, 0.28],
  [800, BLACK, 0.42],
  [900, BLACK, 0.55],
]

// 앱 전체의 "blue-*" 색을 사용자가 고른 색으로 덮어쓰기
export function applyTheme(hex: string) {
  const base = hexToRgb(hex)
  const root = document.documentElement
  for (const [step, target, t] of STEPS) {
    const [r, g, b] = mix(base, target, t)
    root.style.setProperty(`--color-blue-${step}`, rgbToHex(r, g, b))
  }
}

// 너무 밝은 색은 흰 글자 버튼이 안 보임
export function isTooLight(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72
}