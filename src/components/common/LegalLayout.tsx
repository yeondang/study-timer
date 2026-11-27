import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { LEGAL } from '@/lib/legal'

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  )
}

export default function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← {LEGAL.serviceName}으로 돌아가기
        </Link>
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-xs text-slate-400">시행일: {LEGAL.effectiveDate}</p>
        {children}
        <div className="mt-8 flex gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <Link to="/terms" className="hover:underline">이용약관</Link>
          <Link to="/privacy" className="hover:underline">개인정보처리방침</Link>
        </div>
      </div>
    </div>
  )
}