'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import { languagePalette } from '@/lib/timeline-style'

interface CenturyBarChartProps {
  data: { century: string; Greek: number; Latin: number; Other: number }[]
}

export default function CenturyBarChart({ data }: CenturyBarChartProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
      <h3 className="text-lg font-bold text-primary font-serif mb-4">Authors by Century</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e2dc" />
          <XAxis
            dataKey="century"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            allowDecimals={false}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="Greek" stackId="a" fill={languagePalette.Greek.dark} radius={[0, 0, 0, 0]} />
          <Bar dataKey="Latin" stackId="a" fill={languagePalette.Latin.dark} radius={[0, 0, 0, 0]} />
          <Bar dataKey="Other" stackId="a" fill={languagePalette.Other.dark} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
