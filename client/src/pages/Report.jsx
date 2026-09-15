import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, LoaderCircle, Printer, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getHistory } from '../api';

const getToday = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const getCurrentMonth = () => getToday().slice(0, 7);

const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString();

const Report = () => {
    const { user } = useAuth();
    const [periodType, setPeriodType] = useState('month');
    const [period, setPeriod] = useState(getCurrentMonth);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const dateRange = useMemo(() => {
        if (periodType === 'date') {
            return { startDate: period, endDate: period };
        }

        const [year, month] = period.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        return {
            startDate: `${period}-01`,
            endDate: `${period}-${String(lastDay).padStart(2, '0')}`,
        };
    }, [period, periodType]);

    const loadReport = useCallback(async () => {
        if (!period || !user?.token) return;

        setLoading(true);
        setError('');
        try {
            const entries = await getHistory(dateRange);
            setHistory(entries.filter((entry) => entry.action === 'Sold Product'));
        } catch (requestError) {
            console.error('Error fetching report', requestError);
            setError('Unable to load the report. Please try again.');
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
            const key = entry.product?._id || entry.product?.name || 'unknown';
            const quantity = Number(entry.changes?.soldQuantity) || 0;
            const revenue = Number(entry.changes?.totalPrice) || 0;
            const existing = grouped.get(key);

            if (existing) {
                existing.quantity += quantity;
                existing.revenue += revenue;
                existing.transactions += 1;
            } else {
                grouped.set(key, {
                    name: entry.product?.name || 'Unknown product',
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
    const periodLabel = periodType === 'date'
        ? (period ? formatDate(period) : 'Select a date')
        : (period ? new Date(`${period}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Select a month');

    const downloadReport = () => {
        const csvRows = [
            ['Product', 'Units sold', 'Transactions', 'Revenue'],
            ...rows.map((row) => [row.name, row.quantity, row.transactions, row.revenue.toFixed(2)]),
            [],
            ['Total', totalQuantity, history.length, totalRevenue.toFixed(2)],
        ];
        const csv = csvRows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        link.download = `sales-report-${period}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Sales Report</h1>
                    <p className="mt-1 text-sm text-slate-500">Review products sold during a specific date or month.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={downloadReport} disabled={loading || rows.length === 0} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                        <Download size={17} /> Download CSV
                    </button>
                    <button onClick={() => window.print()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">
                        <Printer size={17} /> Print
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm print:hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <label className="flex flex-1 flex-col gap-2 text-sm font-semibold text-slate-600">
                        Report period
                        <select value={periodType} onChange={(event) => {
                            const nextType = event.target.value;
                            setPeriodType(nextType);
                            setPeriod(nextType === 'month' ? getCurrentMonth() : getToday());
                        }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                            <option value="month">Specific month</option>
                            <option value="date">Specific date</option>
                        </select>
                    </label>
                    <label className="flex flex-1 flex-col gap-2 text-sm font-semibold text-slate-600">
                        {periodType === 'month' ? 'Month' : 'Date'}
                        <input type={periodType} value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <button onClick={loadReport} disabled={loading || !period} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">
                        <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm" id="report-content">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600"><FileText size={20} /><span className="font-semibold">Sales report</span></div>
                        <h2 className="mt-2 text-2xl font-bold text-slate-800">{periodLabel}</h2>
                    </div>
                    <div className="hidden text-right text-sm text-slate-500 sm:block">
                        <div>Generated {new Date().toLocaleDateString()}</div>
                        <div>{history.length} sale transaction{history.length === 1 ? '' : 's'}</div>
                    </div>
                </div>

                {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-slate-500"><LoaderCircle size={20} className="animate-spin" /> Loading report...</div>
                ) : rows.length === 0 ? (
                    <p className="py-12 text-center text-slate-500">No products were sold during this period.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-sm">
                            <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3">Product</th><th className="px-3 py-3 text-right">Units sold</th><th className="px-3 py-3 text-right">Transactions</th><th className="px-3 py-3 text-right">Revenue</th></tr></thead>
                            <tbody>{rows.map((row) => <tr key={row.name} className="border-b border-slate-100 last:border-0"><td className="px-3 py-4 font-semibold text-slate-700">{row.name}</td><td className="px-3 py-4 text-right text-slate-600">{row.quantity}</td><td className="px-3 py-4 text-right text-slate-600">{row.transactions}</td><td className="px-3 py-4 text-right font-semibold text-slate-700">₹{row.revenue.toFixed(2)}</td></tr>)}</tbody>
                            <tfoot><tr className="border-t-2 border-slate-200 font-bold text-slate-800"><td className="px-3 py-4">Total</td><td className="px-3 py-4 text-right">{totalQuantity}</td><td className="px-3 py-4 text-right">{history.length}</td><td className="px-3 py-4 text-right text-blue-600">₹{totalRevenue.toFixed(2)}</td></tr></tfoot>
                        </table>
                    </div>
                )}
            </section>
        </motion.div>
    );
};

export default Report;
