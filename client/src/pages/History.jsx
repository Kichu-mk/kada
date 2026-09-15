import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Clock, Calendar, X } from 'lucide-react';
import { getHistory } from '../api';

const History = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const historyData = await getHistory();
                setHistory(historyData);
            } catch (error) {
                console.error('Error fetching history', error);
            }
        };

        if (user?.token) {
            fetchHistory();
        }
    }, [user?.token]);

    // Filter history by selected date
    const filteredHistory = selectedDate
        ? history.filter((item) => {
              const date = new Date(item.date);

              const itemDate =
                  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

              return itemDate === selectedDate;
          })
        : history;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold text-slate-800">
                    Activity History
                </h1>

                {/* Date Search */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* Clear date */}
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate('')}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-red-500"
                            title="Clear date"
                        >
                            <X size={17} />
                        </button>
                    )}
                </div>
            </div>

            {/* History */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="relative ml-3 space-y-8 border-l-2 border-slate-200 md:ml-6">

                    {filteredHistory.length === 0 ? (
                        <div className="py-6 pl-6">
                            <p className="text-slate-500">
                                {selectedDate
                                    ? 'No history found for this date.'
                                    : 'No history found.'}
                            </p>
                        </div>
                    ) : (
                        filteredHistory.map((item, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={item._id}
                                className="relative pl-6 md:pl-8"
                            >
                                {/* Timeline dot */}
                                <span className="absolute -left-[11px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-500 bg-white">
                                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                </span>

                                {/* History card */}
                                <div className="rounded-xl border border-slate-100 bg-slate-200 p-4">
                                    <div className="mb-2 flex items-start justify-between gap-4">
                                        <h3 className="font-bold text-slate-800">
                                            {item.product
                                                ? item.product.name
                                                : 'Unknown Product'}{' '}
                                            - {item.action}
                                        </h3>

                                        <div className="flex shrink-0 items-center rounded-lg border border-slate-100 bg-white px-2 py-1 text-xs font-medium text-slate-400">
                                            <Clock size={12} className="mr-1" />
                                            {new Date(item.date).toLocaleString()}
                                        </div>
                                    </div>

                                    {item.changes &&
                                        Object.keys(item.changes).length > 0 && (
                                            <div className="mt-2 inline-block rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-600">
                                                {Object.entries(item.changes).map(
                                                    ([key, val]) => (
                                                        <div
                                                            key={key}
                                                            className="flex space-x-2"
                                                        >
                                                            <span className="font-medium text-slate-700">
                                                                {key}:
                                                            </span>

                                                            <span>
                                                                {String(val)}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default History;