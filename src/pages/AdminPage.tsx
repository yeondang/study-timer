import { useState } from 'react'
import AdminStats from '@/components/admin/AdminStats'
import AnnouncementManager from '@/components/admin/AnnouncementManager'
import ReportManager from '@/components/admin/ReportManager'
import UserManager from '@/components/admin/UserManager'

type Tab = 'dash' | 'notice' | 'users' | 'reports'

const TABS: { v: Tab; label: string }[] = [
  { v: 'dash', label: '현황' },
  { v: 'notice', label: '공지' },
  { v: 'users', label: '유저' },
  { v: 'reports', label: '제보' },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dash')

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">🛠 관리자</h1>

      <div className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`rounded-lg px-5 py-1.5 text-sm font-medium ${
              tab === t.v ? 'bg-white shadow-sm' : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dash' && <AdminStats />}
      {tab === 'notice' && <AnnouncementManager />}
      {tab === 'users' && <UserManager />}
      {tab === 'reports' && <ReportManager />}
    </div>
  )
}