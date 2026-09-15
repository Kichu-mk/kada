// MonthlySalesGraph.jsx
import React, { useEffect, useState } from 'react';
import { getMonthlySales, getAvailableMonths } from '../api/productsApi';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Dot
} from 'recharts';


const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TopDayDot = (props) => {
  const { cx, cy, payload, topDays } = props;
  if (!topDays.includes(payload.day)) {
    return <Dot cx={cx} cy={cy} r={3} fill="#4f46e5" />;
  }
  return (
    <g>
      <circle cx={cx} cy={cy - 28} r={16} fill="#fff" stroke="#4f46e5" strokeWidth={2} />
      <text x={cx} y={cy - 24} textAnchor="middle" fontSize="10" fontWeight="700" fill="#4f46e5">
        {payload.unitsSold}
      </text>
      <path d={`M${cx - 6},${cy - 14} L${cx},${cy - 4} L${cx + 6},${cy - 14} Z`} fill="#4f46e5" />
      <circle cx={cx} cy={cy} r={5} fill="#4f46e5" stroke="#fff" strokeWidth={2} />
    </g>
  );
};

function MonthlySalesGraph({ productId }) {
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selected, setSelected] = useState(null); // { year, month }
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Load list of months that have data
   function fetchAvailableMonths() {
    getAvailableMonths(productId)
      .then((res) => {
        setAvailableMonths(res.months);
        if (res.months.length > 0) {
          setSelected(res.months[0]);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => console.error(err));
  }

  useEffect(() => {
    fetchAvailableMonths();
  }, [productId]);


  // 2. Fetch graph data whenever selected month changes
  function fetchMonthlySales() {
    if (!selected) return;
    setLoading(true);
    getMonthlySales(productId, selected.month, selected.year)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchMonthlySales();
  }, [productId, selected]);

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e1b4b' }}>{data?.productName || 'Product'} — Monthly Sales</h3>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Units sold per day</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Month/Year Selector */}
          <div className="flex items-center gap-2">
  <select
    value={selected?.month || ''}
    onChange={(e) => {
      const month = Number(e.target.value);

      setSelected(prev => ({
        ...prev,
        month,
      }));
    }}
    className="rounded-xl border border-slate-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm outline-none transition hover:bg-indigo-100 focus:ring-2 focus:ring-indigo-300"
  >
    <option value="" disabled>
      Month
    </option>

    {availableMonths.map(m => (
      <option key={`${m.year}-${m.month}`} value={m.month}>
        {MONTH_NAMES[m.month - 1]}
      </option>
    ))}
  </select>

  <select
    value={selected?.year || ''}
    onChange={(e) => {
      const year = Number(e.target.value);

      setSelected(prev => ({
        ...prev,
        year,
      }));
    }}
    className="rounded-xl border border-slate-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm outline-none transition hover:bg-indigo-100 focus:ring-2 focus:ring-indigo-300"
  >
    <option value="" disabled>
      Year
    </option>

    {[...new Set(availableMonths.map(m => m.year))].map(year => (
      <option key={year} value={year}>
        {year}
      </option>
    ))}
  </select>
</div>
          {data && (
            <div style={{
              background: '#eef2ff',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              color: '#4f46e5',
              whiteSpace: 'nowrap'
            }}>
              Current Price: ₹{data.currentPrice}
            </div>
          )}
        </div>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && availableMonths.length === 0 && (
        <p style={{ color: '#94a3b8' }}>No sales history available yet.</p>
      )}

      {!loading && data && (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data.chartData} margin={{ top: 40, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                label={{ value: 'Units Sold', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value} units`, 'Sold']}
                labelFormatter={(label) => `Day ${label}`}
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="unitsSold"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={(props) => <TopDayDot {...props} topDays={data.topDays} />}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <p style={{ textAlign: 'right', fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
            Total this month: <strong style={{ color: '#4f46e5' }}>
              {data.chartData.reduce((sum, d) => sum + d.unitsSold, 0)} units
            </strong>
          </p>
        </>
      )}
    </div>
  );
}

export default MonthlySalesGraph;