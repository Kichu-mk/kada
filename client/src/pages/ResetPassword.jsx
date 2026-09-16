import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { resetPassword } from '../api';
import kada from '../assets/kada.png';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            await resetPassword(token, password, confirmPassword);
            navigate('/login', { state: { message: 'Password reset successful. You can now log in.' } });
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="flex justify-center"><img src={kada} alt="KADA" className="w-1/2 h-auto p-2 object-contain rounded-xl" /></div>
                <h1 className="text-xl font-semibold text-center text-slate-900 mt-3">Set a new password</h1>
                {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg my-6 text-sm text-center">{error}</div>}
                <form onSubmit={submit} className="space-y-4 mt-6">
                    <input type="password" required minLength="8" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="password" required minLength="8" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg">{loading ? 'Please wait...' : 'Reset password'}</button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
