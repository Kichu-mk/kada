import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Clock, Calendar, X, History as HistoryIcon, ArrowRight, Tag } from "lucide-react";
import { getHistory } from "../api";
import Loading from "../components/Loading";

const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const historyData = await getHistory();
      setHistory(historyData || []);
    } catch (error) {
      console.error("Error fetching history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchHistory();
    }
  }, [user?.token]);

  // Filter history by selected date
  const filteredHistory = selectedDate
    ? history.filter((item) => {
        const date = new Date(item.date);
        const itemDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        return itemDate === selectedDate;
      })
    : history;

  const getActionBadgeClass = (action) => {
    switch (action) {
      case "Created":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "Sold Product":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "Updated Quantity":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Deleted":
        return "bg-red-50 text-red-700 border-red-200/60";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Activity History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit log of all inventory sales, additions, and quantity modifications
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative flex items-center">
            <Calendar
              size={16}
              className="absolute left-3 text-slate-400 pointer-events-none"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-700 shadow-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-red-500"
              title="Clear date filter"
              aria-label="Clear date filter"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* History Timeline */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loading text="Loading activity history..." size="md" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <HistoryIcon size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">No activity found</p>
            <p className="text-xs text-slate-400 mt-1">
              {selectedDate
                ? "No recorded events for this specific date."
                : "Your inventory activity logs will appear here."}
            </p>
          </div>
        ) : (
          <div className="relative ml-2 sm:ml-4 space-y-6 border-l-2 border-slate-200">
            {filteredHistory.map((item, index) => (
              <div key={item._id} className="relative pl-5 sm:pl-7">
                {/* Dot */}
                <span className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                </span>

                {/* Timeline Card */}
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3.5 sm:p-4 hover:border-slate-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getActionBadgeClass(
                          item.action
                        )}`}
                      >
                        {item.action}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-slate-800">
                        {item.product?.name || "Inventory Item"}
                      </h3>
                    </div>

                    <div className="flex items-center text-[11px] font-medium text-slate-400">
                      <Clock size={12} className="mr-1 shrink-0" />
                      <span>{new Date(item.date).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Changes Summary Pill Box */}
                  {item.changes && Object.keys(item.changes).length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                      {item.changes.soldQuantity !== undefined && (
                        <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                          <span className="text-slate-400 font-medium">Sold:</span>
                          <strong className="text-blue-600 font-bold">{item.changes.soldQuantity} units</strong>
                        </div>
                      )}

                      {item.changes.totalPrice !== undefined && (
                        <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                          <span className="text-slate-400 font-medium">Revenue:</span>
                          <strong className="text-emerald-600 font-bold">₹{Number(item.changes.totalPrice).toFixed(2)}</strong>
                        </div>
                      )}

                      {item.changes.oldQuantity !== undefined && item.changes.newQuantity !== undefined && (
                        <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                          <span className="text-slate-400 font-medium">Qty:</span>
                          <span>{item.changes.oldQuantity}</span>
                          <ArrowRight size={12} className="text-slate-400" />
                          <strong className="text-slate-900 font-bold">{item.changes.newQuantity}</strong>
                        </div>
                      )}

                      {item.changes.initialQuantity !== undefined && (
                        <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                          <span className="text-slate-400 font-medium">Initial Qty:</span>
                          <strong>{item.changes.initialQuantity}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default History;