import { Navigate, Outlet } from 'react-router-dom'
import { useAdminStore } from '@/store/useAdminStore'

export default function RequireAdmin() {
  const isAdmin = useAdminStore((s) => s.isAdmin)
  const checked = useAdminStore((s) => s.checked)

  if (!checked) {
    return <div className="p-10 text-center text-slate-400">확인 중...</div>
  }
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}