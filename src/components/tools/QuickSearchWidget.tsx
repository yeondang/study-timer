import { useState } from 'react'
import { TOOLS, openTool, type ToolId } from '@/lib/tools'

export default function QuickSearchWidget() {
  const [toolId, setToolId] = useState<ToolId>('naver-en')
  const [query, setQuery] = useState('')

  const tool = TOOLS.find((t) => t.id === toolId)!

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    openTool(tool.search(q))
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold">학습 도구</h2>

      {/* 바로가기 버튼 */}
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => openTool(t.home)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            {t.label} ↗
          </button>
        ))}
      </div>

      {/* 검색창 */}
      <form onSubmit={handleSearch} className="mt-4 space-y-2">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setToolId(t.id)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
                toolId === t.id ? 'bg-white shadow-sm' : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // 한글 입력 중(조합 중) Enter가 두 번 실행되는 것을 방지
              if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault()
            }}
            placeholder={`${tool.label}에서 검색할 단어`}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            검색
          </button>
        </div>
      </form>

    </div>
  )
}