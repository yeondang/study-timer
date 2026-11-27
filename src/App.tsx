import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import RequireAuth from '@/components/layout/RequireAuth'
import LoginPage from '@/pages/LoginPage'
import TimerPage from '@/pages/TimerPage'
import PlannerPage from '@/pages/PlannerPage'
import StatsPage from '@/pages/StatsPage'
import GroupPage from '@/pages/GroupPage'
import SettingsPage from '@/pages/SettingsPage'
import { useAuthStore } from '@/store/useAuthStore'
import TermsPage from '@/pages/TermsPage'
import PrivacyPage from '@/pages/PrivacyPage'

export default function App() {
  const init = useAuthStore((s) => s.init)

  // 앱이 켜질 때 로그인 상태 확인 시작
  useEffect(() => init(), [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/terms" element={<TermsPage />} /> 
        <Route path="/privacy" element={<PrivacyPage />} />
        
        {/* 로그인해야 들어갈 수 있는 화면들 */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<TimerPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/group" element={<GroupPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}