import React, { useEffect, useState } from "react";
import { getMonthlySales, getAvailableMonths } from "../api/productsApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Dot,
} from "recharts";
import { Calendar, TrendingUp, AlertCircle } from "lucide-react";
import Loading from "./Loading";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TopDayDot = (props) => {
  const { cx, cy, payload, topDays } = props;
  if (!topDays || !topDays.includes(payload.day)) {
    return <Dot cx={cx} cy={cy} r={3} fill="#4f46e5" />;
  }
  return (
    <g>
      <circle cx={cx} cy={cy - 24} r={14} fill="#fff" stroke="#4f46e5" strokeWidth={2} />
      <text x={cx} y={cy - 20} textAnchor="middle" fontSize="9" fontWeight="700" fill="#4f46e5">
        {payload.unitsSold}
      </text>
      <path d={`M${cx - 5},${cy - 10} L${cx},${cy - 2} L${cx + 5},${cy - 10} Z`} fill="#4f46e5" />
      <circle cx={cx} cy={cy} r={4} fill="#4f46e5" stroke="#fff" strokeWidth={2} />
    </g>
  );
};

function MonthlySalesGraph({ productId, refreshKey = 0 }) {
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selected, setSelected] = useState(null); // { year, month }
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Load list of months that have data
  useEffect(() => {
    let isMounted = true;
    if (!productId) return;

    getAvailableMonths(productId)
      .then((res) => {
        if (!isMounted) return;
        const months = res?.months || [];
        setAvailableMonths(months);
        if (months.length > 0) {
          setSelected((currentSelection) => {
            if (!currentSelection) return months[0];
            const hasCurrentMonth = months.some(
              (month) =>
                month.year === currentSelection.year &&
                month.month === currentSelection.month,
            );
            return hasCurrentMonth ? currentSelection : months[0];
          });
        } else {
          // Fallback to current month if no sales yet
          const now = new Date();
          setSelected((currentSelection) => (
            currentSelection || { year: now.getFullYear(), month: now.getMonth() + 1 }
          ));
        }
      })
      .catch((err) => {
        console.error("Error fetching available months", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId, refreshKey]);

  // 2. Fetch graph data when month/year changes
  useEffect(() => {
    if (!selected || !productId) return;

    let isMounted = true;
    setLoading(true);
    getMonthlySales(productId, selected.month, selected.year)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        console.error("Error fetching monthly sales", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId, selected, refreshKey]);

  const uniqueYears = Array.from(new Set(availableMonths.map((m) => m.year)));
  if (uniqueYears.length === 0) {
    uniqueYears.push(new Date().getFullYear());
  }

  const totalSoldThisMonth = data?.chartData?.reduce((sum, d) => sum + d.unitsSold, 0) || 0;

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl">
      {/* Graph Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-slate-800">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Monthly Sales Breakdown
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily units sold for {selected ? `${MONTH_NAMES[selected.month - 1]} ${selected.year}` : "selected period"}
          </p>
        </div>

        {/* Date Filters and Price */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="relative">
            <select
              value={selected?.month || new Date().getMonth() + 1}
              onChange={(e) => {
                const month = Number(e.target.value);
                setSelected((prev) => ({
                  year: prev?.year || new Date().getFullYear(),
                  month,
                }));
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:bg-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
            >
              {MONTH_NAMES.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select
              value={selected?.year || new Date().getFullYear()}
              onChange={(e) => {
                const year = Number(e.target.value);
                setSelected((prev) => ({
                  month: prev?.month || new Date().getMonth() + 1,
                  year,
                }));
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:bg-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
            >
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Total Sold Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 font-bold text-xs whitespace-nowrap">
            {totalSoldThisMonth} units sold
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loading text="Loading sales breakdown..." size="sm" />
        </div>
      ) : !data || data.chartData?.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <AlertCircle size={32} className="mb-1 text-slate-300" />
          <p className="text-xs font-medium">No sales recorded for this month.</p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="h-60 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.chartData}
                margin={{ top: 25, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => [`${value} units`, "Sold"]}
                  labelFormatter={(label) => `Day ${label}`}
                  contentStyle={{
                    backgroundColor: "#1e1b4b",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="unitsSold"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={(props) => <TopDayDot {...props} topDays={data.topDays} />}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>* Dots highlight top sales peak days</span>
            <span>Total: <strong className="text-indigo-600 font-bold">{totalSoldThisMonth} units</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonthlySalesGraph;