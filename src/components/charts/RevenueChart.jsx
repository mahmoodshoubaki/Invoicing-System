'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function formatSAR(value) {
  if (value >= 1000000) return `SAR ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `SAR ${(value / 1000).toFixed(0)}K`;
  return `SAR ${value}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mt-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500 capitalize">{entry.name}:</span>
          <span className="font-medium text-gray-800">{formatSAR(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * RevenueChart — Recharts AreaChart showing monthly revenue trend.
 *
 * @param {{ data: Array<{month: string, revenue: number, invoiced: number, collected: number}> }} props
 */
export default function RevenueChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f8485e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f8485e" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradInvoiced" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Montserrat, sans-serif' }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          tickFormatter={(v) => {
            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
            if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
            return v;
          }}
          tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Montserrat, sans-serif' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', fontFamily: 'Montserrat, sans-serif', paddingTop: '12px' }}
          iconType="circle"
          iconSize={8}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#f8485e"
          strokeWidth={2.5}
          fill="url(#gradRevenue)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="invoiced"
          name="Invoiced"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#gradInvoiced)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="collected"
          name="Collected"
          stroke="#16a34a"
          strokeWidth={2}
          fill="url(#gradCollected)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
