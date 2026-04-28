'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { languagePalette } from '@/lib/timeline-style'

interface LanguagePieChartProps {
  data: { name: string; value: number }[]
}

const COLORS: Record<string, string> = {
  Greek: languagePalette.Greek.dark,
  Latin: languagePalette.Latin.dark,
  Other: languagePalette.Other.dark,
}

export default function LanguagePieChart({ data }: LanguagePieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
      <h3 className="text-lg font-bold text-primary font-serif mb-4">Authors by Language</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value} (${Math.round((value / total) * 100)}%)`}
            labelLine={true}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name] || COLORS.Other}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${value} (${Math.round((Number(value) / total) * 100)}%)`,
              String(name),
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
