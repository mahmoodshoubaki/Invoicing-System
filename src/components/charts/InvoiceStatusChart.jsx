'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value, color } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-gray-600">{name}:</span>
        <span className="font-semibold text-gray-800">{value}</span>
      </div>
    </div>
  );
}

/**
 * InvoiceStatusChart — Recharts PieChart (donut) for invoice status distribution.
 *
 * @param {{ data: Array<{name: string, value: number, color: string}> }} props
 */
export default function InvoiceStatusChart({ data = [] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label overlay is handled via positioning trick */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-500">{entry.name}</span>
            <span className="text-xs font-semibold text-gray-700">{entry.value}</span>
            {total > 0 && (
              <span className="text-xs text-gray-400">
                ({Math.round((entry.value / total) * 100)}%)
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
