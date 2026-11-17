import { useTimerStore } from '@/store/useTimerStore'

export type ToolId = 'naver-en' | 'naver-ko' | 'google'

export interface ToolDef {
  id: ToolId
  label: string
  home: string // 바로가기 주소
  search: (query: string) => string // 검색 결과 주소
}

export const TOOLS: ToolDef[] = [
  {
    id: 'naver-en',
    label: '네이버 영어사전',
    home: 'https://en.dict.naver.com/',
    search: (q) => `https://en.dict.naver.com/#/search?query=${encodeURIComponent(q)}`,
  },
  {
    id: 'naver-ko',
    label: '네이버 국어사전',
    home: 'https://ko.dict.naver.com/',
    search: (q) => `https://ko.dict.naver.com/#/search?query=${encodeURIComponent(q)}`,
  },
  {
    id: 'google',
    label: '구글',
    home: 'https://www.google.com/',
    search: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
]

/**
 * 학습 도구를 새 탭으로 연다.
 * 열기 "직전에" 도구 사용 표시를 켜야, 탭이 숨겨지는 순간 이탈 감지가 예외로 처리한다.
 */
export function openTool(url: string) {
  useTimerStore.getState().markToolOpened()
  window.open(url, '_blank', 'noopener,noreferrer')

  // 팝업 차단 등으로 탭이 실제로 안 열렸다면 표시를 바로 해제
  window.setTimeout(() => {
    if (!document.hidden) useTimerStore.getState().clearToolFlag()
  }, 1500)
}