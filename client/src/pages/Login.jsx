import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { requestPasswordReset, resendRegistrationOtp } from "../api";
import {
  Eye,
  EyeOff,
  Store,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import kada from "../assets/kada.png";

const inputClass =
  "w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white text-slate-800 placeholder-slate-400";

const Login = () => {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    location: "",
    description: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [registrationId, setRegistrationId] = useState("");
  const [otp, setOtp] = useState("");
  const locationState = useLocation().state;
  const [message, setMessage] = useState(locationState?.message || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, verifyRegistration } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const clearFeedback = () => {
    setError("");
    setMessage("");
  };
  const getError = (err) =>
    err?.response?.data?.message || err?.message || String(err);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(formData.username.trim(), formData.password);
        navigate("/");
      } else if (mode === "register") {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        const data = await register({
          ...formData,
          username: formData.username.trim(),
          email: formData.email.trim(),
          shopName: formData.shopName.trim(),
        });
        setRegistrationId(data.registrationId);
        setMode("verify");
        setMessage("A 6-digit verification code was sent to your email.");
      } else if (mode === "verify") {
        await verifyRegistration(registrationId, otp.trim());
        navigate("/");
      } else {
        const data = await requestPasswordReset(formData.email.trim());
        setMessage(data.message || "Password reset instructions sent.");
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
    setOtp("");
  };

  const resendOtp = async () => {
    clearFeedback();
    try {
      await resendRegistrationOtp(registrationId);
      setMessage("A new verification code was sent to your email.");
    } catch (err) {
      setError(getError(err));
    }
  };

  const title =
    mode === "login"
      ? "Welcome back to KADA"
      : mode === "register"
        ? "Create your Store Account"
        : mode === "verify"
          ? "Verify your Email"
          : "Reset your Password";

  const subtitle =
    mode === "login"
      ? "Sign in to manage inventory & sales"
      : mode === "register"
        ? "Set up your business in under a minute"
        : mode === "verify"
          ? `Enter the code sent to ${formData.email}`
          : "We will email you a password reset link";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 overflow-hidden relative border border-slate-800/40 my-auto"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center pb-5">
          <img
            src={kada}
            alt="KADA Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl drop-shadow-md mb-2"
          />
          <span className="black-ops-one-regular text-4xl sm:text-5xl text-slate-900 tracking-widest leading-none">
            KADA
          </span>
          <h1 className="text-sm sm:text-base font-bold text-slate-600 tracking-tight mt-1.5">
            {title}
          </h1>
          <p className="anonymous-pro-regular text-xs text-slate-400 mt-0.5 max-w-xs">
            {subtitle}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3.5 rounded-xl mb-5 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3.5 rounded-xl mb-5 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          {mode === "verify" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                pattern="[0-9]{6}"
                name="otp"
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className={`${inputClass} text-center text-xl font-bold tracking-widest`}
                placeholder="------"
              />
            </div>
          ) : mode === "forgot" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                autoFocus
                placeholder="owner@example.com"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          ) : (
            <>
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="e.g. john_store"
                  value={formData.username}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              {/* Email (Registration only) */}
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="shop@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              )}

              {/* Password with Eye toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength="8"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register only) */}
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    minLength="8"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              )}

              {/* Shop info (Register only) */}
              {mode === "register" && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shop / Store Name
                    </label>
                    <input
                      type="text"
                      name="shopName"
                      required
                      placeholder="e.g. Kada Electronics"
                      value={formData.shopName}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Location / City (Optional)
                    </label>
                    <input
                      type="text"
                      name="location"
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={formData.location}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 text-xs sm:text-sm mt-4 cursor-pointer"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : mode === "register"
                  ? "Send Verification Code"
                  : mode === "verify"
                    ? "Verify & Continue"
                    : "Send Reset Link"}
          </button>
        </form>

        {/* Footer Navigation Links */}
        <div className="mt-5 space-y-2 text-center text-xs">
          {mode === "verify" && (
            <button
              onClick={resendOtp}
              className="text-blue-600 font-semibold hover:underline block w-full py-1"
            >
              Didn't receive code? Resend Code
            </button>
          )}

          {mode === "login" && (
            <button
              onClick={() => switchMode("forgot")}
              className="text-blue-600 font-medium hover:underline block w-full py-1"
            >
              Forgot your password?
            </button>
          )}

          {mode === "forgot" && (
            <button
              onClick={() => switchMode("login")}
              className="text-blue-600 font-medium hover:underline block w-full py-1"
            >
              ← Back to Sign In
            </button>
          )}

          {mode === "verify" && (
            <button
              onClick={() => switchMode("register")}
              className="text-slate-500 hover:underline block w-full py-1"
            >
              ← Back to registration
            </button>
          )}

          {(mode === "login" || mode === "register") && (
            <div className="pt-3 border-t border-slate-100 text-slate-500">
              {mode === "login"
                ? "Don't have a shop account yet? "
                : "Already have an account? "}
              <button
                onClick={() =>
                  switchMode(mode === "login" ? "register" : "login")
                }
                className="text-blue-600 font-bold hover:underline"
              >
                {mode === "login" ? "Create Account" : "Sign In"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
