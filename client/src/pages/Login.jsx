import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { requestPasswordReset, resendRegistrationOtp } from '../api';
import kada from '../assets/kada.png';

const inputClass = 'w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';

const Login = () => {
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', confirmPassword: '',
        shopName: '', location: '', description: ''
    });
    const [registrationId, setRegistrationId] = useState('');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register, verifyRegistration } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const clearFeedback = () => { setError(''); setMessage(''); };
    const getError = (err) => err?.response?.data?.message || err?.message || String(err);

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearFeedback();
        setLoading(true);
        try {
            if (mode === 'login') {
                await login(formData.username, formData.password);
                navigate('/');
            } else if (mode === 'register') {
                if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
                const data = await register(formData);
                setRegistrationId(data.registrationId);
                setMode('verify');
                setMessage('A verification code was sent to your email.');
            } else if (mode === 'verify') {
                await verifyRegistration(registrationId, otp);
                navigate('/');
            } else {
                const data = await requestPasswordReset(formData.email);
                setMessage(data.message);
            }
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (nextMode) => {
        clearFeedback();
        setMode(nextMode);
        setOtp('');
    };

    const resendOtp = async () => {
        clearFeedback();
        try {
            await resendRegistrationOtp(registrationId);
            setMessage('A new verification code was sent.');
        } catch (err) {
            setError(getError(err));
        }
    };

    const title = mode === 'login' ? 'Welcome back!' : mode === 'register' ? 'Create your shop account' : mode === 'verify' ? 'Verify your email' : 'Reset your password';

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 overflow-hidden relative">
                <div className="p-4 flex flex-col items-center justify-center">
                    <img src={kada} alt="KADA" className="w-1/2 h-auto p-2 object-contain rounded-xl animate-[float_3s_ease-in-out_infinite] transition-transform duration-300 hover:scale-105" />
                    <p className="text-slate-500 mt-2">{title}</p>
                </div>

                {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
                {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 text-sm text-center">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'verify' ? (
                        <>
                            <p className="text-sm text-slate-600 text-center">Enter the six-digit code sent to {formData.email}.</p>
                            <input type="text" inputMode="numeric" maxLength="6" pattern="[0-9]{6}" name="otp" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className={inputClass} placeholder="Verification code" />
                        </>
                    ) : mode === 'forgot' ? (
                        <>
                            <label className="block text-sm font-medium text-slate-700">Email address</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} />
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                <input type="text" name="username" required value={formData.username} onChange={handleChange} className={inputClass} />
                            </div>
                            {mode === 'register' && <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} />
                            </div>}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input type="password" name="password" required minLength="8" value={formData.password} onChange={handleChange} className={inputClass} />
                            </div>
                            {mode === 'register' && <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
                                <input type="password" name="confirmPassword" required minLength="8" value={formData.confirmPassword} onChange={handleChange} className={inputClass} />
                            </div>}
                            {mode === 'register' && <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
                                    <input type="text" name="shopName" required value={formData.shopName} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>}
                        </>
                    )}
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors mt-6">
                        {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Send verification code' : mode === 'verify' ? 'Verify email' : 'Send reset link'}
                    </button>
                </form>

                {mode === 'verify' && <button onClick={resendOtp} className="w-full mt-3 text-blue-600 text-sm font-medium hover:underline">Resend code</button>}
                {mode === 'login' && <button onClick={() => switchMode('forgot')} className="w-full mt-4 text-blue-600 text-sm font-medium hover:underline">Forgot password?</button>}
                {mode === 'forgot' && <button onClick={() => switchMode('login')} className="w-full mt-4 text-blue-600 text-sm font-medium hover:underline">Back to login</button>}
                {mode === 'verify' && <button onClick={() => switchMode('register')} className="w-full mt-2 text-slate-500 text-sm hover:underline">Back to registration</button>}
                {(mode === 'login' || mode === 'register') && <div className="mt-6 text-center text-sm text-slate-500">
                    {mode === 'login' ? "Don't have a shop yet? " : 'Already have an account? '}
                    <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="text-blue-600 font-medium hover:underline">{mode === 'login' ? 'Sign up' : 'Log in'}</button>
                </div>}
            </motion.div>
        </div>
    );
};

export default Login;
