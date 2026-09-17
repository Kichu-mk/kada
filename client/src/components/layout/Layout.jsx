import React, { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import { Menu, Store } from "lucide-react";
import kada from "../../assets/kada.png";

import Loading from "../Loading";

const Layout = () => {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Map pathnames to readable title
  const getPageTitle = (pathname) => {
    if (pathname === "/") return "Dashboard";
    if (pathname.startsWith("/products/")) return "Product Details";
    if (pathname.startsWith("/products")) return "Products";
    if (pathname.startsWith("/history")) return "Activity History";
    if (pathname.startsWith("/report")) return "Sales Report";
    return "KADA";
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-300">
        <Loading text="Loading Kada System..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar (Desktop pinned + Mobile/Tablet drawer) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile / Tablet Top Header Bar */}
        <header className="lg:hidden shrink-0 bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between z-30 print:hidden shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 -ml-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu size={22} />
            </button>

            <div className="flex items-center gap-2">
              <img src={kada} alt="KADA" className="w-7 h-7 object-contain" />
              <span className="font-bold text-sm tracking-wide text-white">
                {getPageTitle(location.pathname)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 max-w-[140px] truncate">
              <Store size={14} className="text-blue-400 shrink-0" />
              <span className="anonymous-pro-bold truncate">{user?.shop?.name || "Shop"}</span>
            </div>
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
