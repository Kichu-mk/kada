import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Package, Activity, AlertTriangle } from "lucide-react";
import { changePassword, getDashboardSummary } from "../api";
import { Store } from "lucide-react";

const Home = () => {
  const { user, updateProfile } = useAuth();
  const [summary, setSummary] = useState(null);
  const [showShopProfile, setShowShopProfile] = useState(false);
  const [profileMode, setProfileMode] = useState("details");
  const [profileForm, setProfileForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardData = await getDashboardSummary();
        setSummary(dashboardData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    if (user?.token) {
      fetchDashboard();
    }
  }, [user?.token]);

  const openShopProfile = () => {
    setProfileForm({
      username: user?.username || "",
      email: user?.email || "",
      shopName: user?.shop?.name || "",
      location: user?.shop?.location || "",
      description: user?.shop?.description || "",
    });
    setProfileMode("details");
    setProfileError("");
    setProfileMessage("");
    setShowShopProfile(true);
  };

  const handleProfileChange = (event) => {
    setProfileForm({ ...profileForm, [event.target.name]: event.target.value });
  };

  const handlePasswordChange = (event) => {
    setPasswordForm({ ...passwordForm, [event.target.name]: event.target.value });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setProfileLoading(true);
    try {
      await updateProfile(profileForm);
      setProfileMessage("Profile updated successfully.");
      setProfileMode("details");
    } catch (error) {
      setProfileError(error?.response?.data?.message || error?.message || String(error));
    } finally {
      setProfileLoading(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setProfileLoading(true);
    try {
      const data = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      setProfileMessage(data.message);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setProfileMode("details");
    } catch (error) {
      setProfileError(error?.response?.data?.message || error?.message || String(error));
    } finally {
      setProfileLoading(false);
    }
  };

  if (!summary) return <div>Loading dashboard...</div>;

  const chartData = [
    { name: "Today", changes: summary.activity.today },
    { name: "This Month", changes: summary.activity.month },
    { name: "This Year", changes: summary.activity.year },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <button
          type="button"
          onClick={openShopProfile}
          aria-label="View shop profile"
          className="flex items-center space-x-2 group bg-blue-50/50 pr-4 rounded-xl border border-blue-300 transition duration-300 hover:bg-blue-100 hover:shadow-lg hover:shadow-amber-200/20"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20 transition duration-300 group-hover:-translate-y-1 group-hover:rotate-3">
            <Store className="h-6 w-6 text-white" />
          </div>
          <h1 className="luckiest-guy bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-400 bg-clip-text text-3xl font-black tracking-tight text-transparent transition-all duration-500 group-hover:tracking-wide">
            {user.shop?.name || "User"}
          </h1>
        </button>
      </div>

      {showShopProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowShopProfile(false);
        }}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Shop and user details</h2>
              <button type="button" onClick={() => setShowShopProfile(false)} className="text-2xl text-slate-400 hover:text-slate-700" aria-label="Close profile">×</button>
            </div>
            <div className="mt-4 flex gap-2 border-b border-slate-200">
              {[
                ["details", "Details"],
                ["edit", "Edit details"],
                ["password", "Change password"],
              ].map(([mode, label]) => (
                <button key={mode} type="button" onClick={() => { setProfileMode(mode); setProfileError(""); setProfileMessage(""); }} className={`border-b-2 px-3 py-2 text-sm font-medium ${profileMode === mode ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}>
                  {label}
                </button>
              ))}
            </div>

            {profileError && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{profileError}</div>}
            {profileMessage && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{profileMessage}</div>}

            {profileMode === "details" && (
              <div className="mt-5 space-y-3 text-sm">
                <div><span className="font-semibold text-slate-500">Shop name:</span> {user?.shop?.name || "Not set"}</div>
                <div><span className="font-semibold text-slate-500">Location:</span> {user?.shop?.location || "Not set"}</div>
                <div><span className="font-semibold text-slate-500">Description:</span> {user?.shop?.description || "Not set"}</div>
                <div><span className="font-semibold text-slate-500">Username:</span> {user?.username || "Not set"}</div>
                <div><span className="font-semibold text-slate-500">Email:</span> {user?.email || "Not set"}</div>
              </div>
            )}

            {profileMode === "edit" && (
              <form onSubmit={saveProfile} className="mt-5 space-y-4">
                {[
                  ["shopName", "Shop name", "text"],
                  ["username", "Username", "text"],
                  ["email", "Email", "email"],
                  ["location", "Location", "text"],
                ].map(([name, label, type]) => (
                  <label key={name} className="block text-sm font-medium text-slate-700">{label}
                    <input type={type} name={name} required={name !== "location"} value={profileForm[name] || ""} onChange={handleProfileChange} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                  </label>
                ))}
                <label className="block text-sm font-medium text-slate-700">Description
                  <textarea name="description" rows="3" value={profileForm.description || ""} onChange={handleProfileChange} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
                <button type="submit" disabled={profileLoading} className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60">{profileLoading ? "Saving..." : "Save changes"}</button>
              </form>
            )}

            {profileMode === "password" && (
              <form onSubmit={savePassword} className="mt-5 space-y-4">
                {[
                  ["currentPassword", "Current password"],
                  ["newPassword", "New password"],
                  ["confirmPassword", "Confirm new password"],
                ].map(([name, label]) => (
                  <label key={name} className="block text-sm font-medium text-slate-700">{label}
                    <input type="password" name={name} required minLength="8" value={passwordForm[name]} onChange={handlePasswordChange} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                  </label>
                ))}
                <button type="submit" disabled={profileLoading} className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60">{profileLoading ? "Changing..." : "Change password"}</button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4"
        >
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Products</p>
            <h2 className="text-3xl font-bold text-slate-800">
              {summary.totalProducts}
            </h2>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4"
        >
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Updates Today</p>
            <h2 className="text-3xl font-bold text-slate-800">
              {summary.activity.today}
            </h2>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4"
        >
          <div className="p-4 bg-orange-50 text-orange-500 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Alerts</p>
            <h2 className="text-3xl font-bold text-slate-800">
              {summary.alerts.length}
            </h2>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col justify-center gap-6 mt-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">
            Activity Overview
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8" }}
                />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="changes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <AlertTriangle className="mr-2 text-orange-500" size={20} />
            Alerts
          </h3>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
            {summary.alerts.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                All good! No active alerts.
              </p>
            ) : (
              summary.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="p-4 bg-orange-50/50 border border-orange-300 rounded-xl text-sm text-slate-700"
                >
                  {alert.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
