import { useCallback, useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'

export interface DailyRow {
  uid: string
  day: string // 'yyyy-MM-dd'
  seconds: number
}

export function useGroupHistory(groupId: string | null, days: number) {
  const [rows, setRows] = useState<DailyRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!groupId) return
    const to = new Date()
    const from = subDays(to, days - 1)
    const { data, error } = await supabase.rpc('group_daily_study', {
      gid: groupId,
      from_date: format(from, 'yyyy-MM-dd'),
      to_date: format(to, 'yyyy-MM-dd'),
    })
    if (error) {
      setError(error.message)
      return
    }
    setError('')
    setRows(
      ((data ?? []) as { uid: string; day: string; seconds: number | string }[]).map((r) => ({
        uid: r.uid,
        day: r.day,
        seconds: Number(r.seconds),
      }))
    )
  }, [groupId, days])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  return { rows, loading, error, reload: load }
}