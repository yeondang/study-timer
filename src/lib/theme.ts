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

const luminance = ([r, g, b]: RGB) => (0.299 * r + 0.587 * g + 0.114 * b) / 255

// 이보다 밝으면 흰 글자가 잘 안 보이므로 글자 그림자를 켬
const SHADOW_THRESHOLD = 0.55

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
    [600, base], // 버튼, 선택된 메뉴: 고른 색 그대로
    [700, mix(base, BLACK, 0.12)], // 마우스를 올렸을 때만 살짝 어둡게
    [800, mix(base, BLACK, 0.3)],
    [900, mix(base, BLACK, 0.45)],
  ]

  const root = document.documentElement
  for (const [step, [r, g, b]] of steps) {
    root.style.setProperty(`--color-blue-${step}`, rgbToHex(r, g, b))
  }

  // 밝은 색이면 흰 글자에 그림자를 붙여서 읽히게 함
  const light = luminance(base) > SHADOW_THRESHOLD
  root.style.setProperty(
    '--theme-text-shadow',
    light ? '0 1px 2px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.5)' : 'none'
  )
}

// 밝은 색이라 글자 그림자가 적용되는지 (안내 문구용)
export function isTooLight(hex: string): boolean {
  return luminance(hexToRgb(hex)) > SHADOW_THRESHOLD
}