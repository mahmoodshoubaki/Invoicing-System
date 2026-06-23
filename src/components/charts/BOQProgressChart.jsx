'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-2 truncate max-w-[180px]">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mt-1">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500 capitalize">{entry.name}:</span>
          <span className="font-medium text-gray-800">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * BOQProgressChart — Stacked BarChart showing BOQ status breakdown per project.
 *
 * @param {{ data: Array<{project: string, approved: number, pending: number, delayed: number, invoiced: number}> }} props
 */
export default function BOQProgressChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        barSize={24}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal vertical={false} />
        <XAxis
          dataKey="project"
          tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'Montserrat, sans-serif' }}
          axisLine={false}
          tickLine={false}
          dy={6}
          interval={0}
          width={80}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Montserrat, sans-serif' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Legend
          wrapperStyle={{ fontSize: '12px', fontFamily: 'Montserrat, sans-serif', paddingTop: '12px' }}
          iconType="square"
          iconSize={10}
        />
        <Bar dataKey="invoiced" name="Invoiced" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
        <Bar dataKey="approved" name="Approved" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
        <Bar dataKey="pending" name="Pending" stackId="a" fill="#fcc354" radius={[0, 0, 0, 0]} />
        <Bar dataKey="delayed" name="Delayed" stackId="a" fill="#f8485e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
