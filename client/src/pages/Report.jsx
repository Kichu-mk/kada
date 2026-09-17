import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, LoaderCircle, Printer, RefreshCw, IndianRupee, ShoppingCart, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getHistory } from "../api";
import Loading from "../components/Loading";

const getToday = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const getCurrentMonth = () => getToday().slice(0, 7);

const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString();

const Report = () => {
  const { user } = useAuth();
  const [periodType, setPeriodType] = useState("month");
  const [period, setPeriod] = useState(getCurrentMonth);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dateRange = useMemo(() => {
    if (periodType === "date") {
      return { startDate: period, endDate: period };
    }

    const [year, month] = period.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      startDate: `${period}-01`,
      endDate: `${period}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [period, periodType]);

  const loadReport = useCallback(async () => {
    if (!period || !user?.token) return;

    setLoading(true);
    setError("");
    try {
      const entries = await getHistory(dateRange);
      setHistory(entries.filter((entry) => entry.action === "Sold Product"));
    } catch (requestError) {
      console.error("Error fetching report", requestError);
      setError("Unable to load the report. Please try again.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, period, user?.token]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const rows = useMemo(() => {
    const grouped = new Map();

    history.forEach((entry) => {
      const key = entry.product?._id || entry.product?.name || "unknown";
      const quantity = Number(entry.changes?.soldQuantity) || 0;
      const revenue = Number(entry.changes?.totalPrice) || 0;
      const existing = grouped.get(key);

      if (existing) {
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.transactions += 1;
      } else {
        grouped.set(key, {
          name: entry.product?.name || "Unknown product",
          quantity,
          revenue,
          transactions: 1,
        });
      }
    });

    return [...grouped.values()].sort((a, b) => b.revenue - a.revenue);
  }, [history]);

  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const periodLabel =
    periodType === "date"
      ? period
        ? formatDate(period)
        : "Select a date"
      : period
      ? new Date(`${period}-01T00:00:00`).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })
      : "Select a month";

  const downloadReport = () => {
    const csvRows = [
      ["Product", "Units sold", "Transactions", "Revenue (INR)"],
      ...rows.map((row) => [
        row.name,
        row.quantity,
        row.transactions,
        row.revenue.toFixed(2),
      ]),
      [],
      ["Total", totalQuantity, history.length, totalRevenue.toFixed(2)],
    ];
    const csv = csvRows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    link.download = `sales-report-${period}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200/60 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Sales Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Detailed performance breakdown and revenue analytics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadReport}
            disabled={loading || rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={15} /> Download CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 shadow-xs"
          >
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Report Period Mode
            </label>
            <select
              value={periodType}
              onChange={(event) => {
                const nextType = event.target.value;
                setPeriodType(nextType);
                setPeriod(nextType === "month" ? getCurrentMonth() : getToday());
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            >
              <option value="month">Specific Month</option>
              <option value="date">Specific Single Date</option>
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {periodType === "month" ? "Select Month" : "Select Date"}
            </label>
            <input
              type={periodType}
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              onClick={loadReport}
              disabled={loading || !period}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Highlights */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <ShoppingCart size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase">Units Sold</span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{totalQuantity}</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase">Transactions</span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{history.length}</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5 sm:col-span-3 lg:col-span-1">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <DollarSign size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase">Total Revenue</span>
              <span className="text-xl sm:text-2xl font-extrabold text-blue-600 tracking-tight">₹{totalRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Report Table Card */}
      <section
        className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm"
        id="report-content"
      >
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600">
              <FileText size={18} />
              <span className="font-bold text-xs uppercase tracking-wider">Statement</span>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-800">
              {periodLabel}
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div>{history.length} sale transactions</div>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-xs sm:text-sm text-red-600 border border-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loading text="Loading sales report..." size="sm" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-medium text-slate-600">No products sold in this period</p>
            <p className="text-xs text-slate-400 mt-1">Select a different date or month to view history.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[500px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-3.5 py-3">Product Name</th>
                  <th className="px-3.5 py-3 text-right">Units Sold</th>
                  <th className="px-3.5 py-3 text-right">Transactions</th>
                  <th className="px-3.5 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr
                    key={row.name}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-3.5 py-3.5 font-semibold text-slate-800">
                      {row.name}
                    </td>
                    <td className="px-3.5 py-3.5 text-right font-medium text-slate-600">
                      {row.quantity}
                    </td>
                    <td className="px-3.5 py-3.5 text-right text-slate-500">
                      {row.transactions}
                    </td>
                    <td className="px-3.5 py-3.5 text-right font-bold text-slate-800">
                      ₹{row.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-extrabold text-slate-900 bg-slate-50/60">
                  <td className="px-3.5 py-3.5">Total</td>
                  <td className="px-3.5 py-3.5 text-right">{totalQuantity}</td>
                  <td className="px-3.5 py-3.5 text-right">{history.length}</td>
                  <td className="px-3.5 py-3.5 text-right text-blue-600 text-sm sm:text-base">
                    ₹{totalRevenue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default Report;

