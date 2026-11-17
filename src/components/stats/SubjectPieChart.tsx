import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatDuration } from '@/lib/time'
import type { SubjectStat } from '@/lib/stats'

export default function SubjectPieChart({ data }: { data: SubjectStat[] }) {
  const total = data.reduce((sum, d) => sum + d.seconds, 0)

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="seconds"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {data.map((d) => (
                <Cell key={d.subjectId} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatDuration(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-2 space-y-1.5">
        {data.map((d) => (
          <li key={d.subjectId} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="flex-1">{d.name}</span>
            <span className="text-slate-500">{formatDuration(d.seconds)}</span>
            <span className="w-12 text-right font-semibold">
              {total > 0 ? Math.round((d.seconds / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}