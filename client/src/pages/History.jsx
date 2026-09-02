import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { getHistory } from '../api';

const History = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);

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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Activity History</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="relative border-l-2 border-slate-200 ml-3 md:ml-6 space-y-8">
                    {history.length === 0 ? (
                        <p className="text-slate-500 pl-6">No history found.</p>
                    ) : (
                        history.map((item, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={item._id}
                                className="relative pl-6 md:pl-8"
                            >
                                <span className="absolute -left-[11px] top-1 bg-white border-2 border-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                </span>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800">
                                            {item.product ? item.product.name : 'Unknown Product'} - {item.action}
                                        </h3>
                                        <div className="flex items-center text-xs text-slate-400 font-medium bg-white px-2 py-1 rounded-lg border border-slate-100">
                                            <Clock size={12} className="mr-1" />
                                            {new Date(item.date).toLocaleString()}
                                        </div>
                                    </div>

                                    {item.changes && Object.keys(item.changes).length > 0 && (
                                        <div className="text-sm text-slate-600 mt-2 bg-white p-3 rounded-lg border border-slate-100 inline-block">
                                            {Object.entries(item.changes).map(([key, val]) => (
                                                <div key={key} className="flex space-x-2">
                                                    <span className="font-medium text-slate-700">{key}:</span>
                                                    <span>{String(val)}</span>
                                                </div>
                                            ))}
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
