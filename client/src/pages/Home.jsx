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
import { Package, Activity, AlertTriangle, Store, X, CheckCircle2 } from "lucide-react";
import { changePassword, getDashboardSummary } from "../api";
import Loading from "../components/Loading";

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
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const dashboardData = await getDashboardSummary();
        if (isMounted) {
          setSummary(dashboardData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    if (user?.token) {
      fetchDashboard();
    }

    return () => {
      isMounted = false;
    };
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

  if (!summary) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loading text="Loading dashboard overview..." size="md" />
      </div>
    );
  }

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
      {/* Header with Title and Shop Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time inventory metrics and stock performance
          </p>
        </div>

        <button
          type="button"
          onClick={openShopProfile}
          aria-label="View shop profile"
          className="self-start sm:self-auto flex items-center space-x-2.5 group bg-white pr-3.5 pl-1 py-1 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm text-white">
            <Store className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Store
            </span>
            <span className="black-ops-one-regular text-sm sm:text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors block truncate max-w-[150px] sm:max-w-[200px]">
              {user.shop?.name || "My Shop"}
            </span>
          </div>
        </button>
      </div>

      {/* Shop Profile Modal */}
      {showShopProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowShopProfile(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-7 shadow-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Shop & Account Settings
                </h2>
                <p className="text-xs text-slate-500">Manage your business profile and credentials</p>
              </div>
              <button
                type="button"
                onClick={() => setShowShopProfile(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close profile modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-3 flex gap-1 sm:gap-2 border-b border-slate-200 overflow-x-auto pb-0.5">
              {[
                ["details", "Details"],
                ["edit", "Edit Profile"],
                ["password", "Change Password"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setProfileMode(mode);
                    setProfileError("");
                    setProfileMessage("");
                  }}
                  className={`border-b-2 px-3 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    profileMode === mode
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pt-4 pr-1">
              {profileError && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-600 border border-red-200">
                  {profileError}
                </div>
              )}
              {profileMessage && (
                <div className="mb-4 rounded-xl bg-green-50 p-3 text-xs sm:text-sm text-green-700 border border-green-200 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{profileMessage}</span>
                </div>
              )}

              {profileMode === "details" && (
                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-xs">Shop Name</span>
                    <span className="anonymous-pro-bold text-slate-800 font-medium text-sm mt-0.5 block">{user?.shop?.name || "Not set"}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-xs">Location</span>
                    <span className="text-slate-800 font-medium text-sm mt-0.5 block">{user?.shop?.location || "Not set"}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-xs">Description</span>
                    <span className="text-slate-800 font-medium text-sm mt-0.5 block">{user?.shop?.description || "Not set"}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-500 block text-xs">Username</span>
                      <span className="text-slate-800 font-medium text-sm mt-0.5 block">{user?.username || "Not set"}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-500 block text-xs">Email</span>
                      <span className="text-slate-800 font-medium text-sm mt-0.5 block truncate">{user?.email || "Not set"}</span>
                    </div>
                  </div>
                </div>
              )}

              {profileMode === "edit" && (
                <form onSubmit={saveProfile} className="space-y-3 sm:space-y-4">
                  {[
                    ["shopName", "Shop Name", "text"],
                    ["username", "Username", "text"],
                    ["email", "Email Address", "email"],
                    ["location", "Location", "text"],
                  ].map(([name, label, type]) => (
                    <label key={name} className="block text-xs sm:text-sm font-medium text-slate-700">
                      {label}
                      <input
                        type={type}
                        name={name}
                        required={name !== "location"}
                        value={profileForm[name] || ""}
                        onChange={handleProfileChange}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  ))}
                  <label className="block text-xs sm:text-sm font-medium text-slate-700">
                    Description
                    <textarea
                      name="description"
                      rows="3"
                      value={profileForm.description || ""}
                      onChange={handleProfileChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60 text-sm shadow-md shadow-blue-600/20"
                  >
                    {profileLoading ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}

              {profileMode === "password" && (
                <form onSubmit={savePassword} className="space-y-3 sm:space-y-4">
                  {[
                    ["currentPassword", "Current Password"],
                    ["newPassword", "New Password (min 8 chars)"],
                    ["confirmPassword", "Confirm New Password"],
                  ].map(([name, label]) => (
                    <label key={name} className="block text-xs sm:text-sm font-medium text-slate-700">
                      {label}
                      <input
                        type="password"
                        name={name}
                        required
                        minLength="8"
                        value={passwordForm[name]}
                        onChange={handlePasswordChange}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  ))}
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60 text-sm shadow-md shadow-blue-600/20"
                  >
                    {profileLoading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center space-x-4 transition-all"
        >
          <div className="p-3.5 sm:p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Package size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Total Products</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {summary.totalProducts}
            </h2>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center space-x-4 transition-all"
        >
          <div className="p-3.5 sm:p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <Activity size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Updates Today</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {summary.activity.today}
            </h2>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center space-x-4 sm:col-span-2 lg:col-span-1 transition-all"
        >
          <div className="p-3.5 sm:p-4 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Low Stock Alerts</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {summary.alerts.length}
            </h2>
          </div>
        </motion.div>
      </div>

      {/* Activity Overview and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Activity Overview
              </h3>
              <p className="text-xs text-slate-400">Total inventory transactions & updates</p>
            </div>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="changes" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Box */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center">
              <AlertTriangle className="mr-2 text-amber-500" size={20} />
              Alerts
            </h3>
            {summary.alerts.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                {summary.alerts.length} need attention
              </span>
            )}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-72 pr-1">
            {summary.alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center text-slate-400">
                <CheckCircle2 size={36} className="text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-medium text-slate-600">All good!</p>
                <p className="text-xs text-slate-400">No low stock alerts at this time.</p>
              </div>
            ) : (
              summary.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs sm:text-sm text-slate-700 flex items-start gap-2.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                  <div className="flex-1">{alert.message}</div>
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
