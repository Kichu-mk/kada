import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Package,
  History,
  FileText,
  LogOut,
  X,
  Store,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import kada from "../../assets/kada.png";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/", icon: <Home size={20} /> },
    { name: "Products", path: "/products", icon: <Package size={20} /> },
    { name: "History", path: "/history", icon: <History size={20} /> },
    { name: "Report", path: "/report", icon: <FileText size={20} /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Brand & Logo Section */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <img
            src={kada}
            alt="KADA"
            className="w-14 h-14 object-contain rounded-xl shadow-md"
          />
          <div className="flex flex-col justify-end ">
            <h2 className="black-ops-one-regular text-white text-4xl -mb-4 ">
              KADA
            </h2>
            <p className="anonymous-pro-bold-italic text-sm pt-2 pb-0 pl-1 text-slate-400 truncate tracking-wide ">
              {user?.shop?.name || "Smart Inventory"}
            </p>
          </div>
        </div>

        {/* Close button on mobile/tablet */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 mt-4 px-3 overflow-y-auto space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Menu
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="px-3 py-2 mb-2 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {user?.username || "Shop Owner"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.shop?.name || user?.email || "Manager"}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-200 text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 h-dvh flex-col border-r border-slate-800 print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile/Tablet Sliding Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex print:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
          />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[85vw] h-dvh shadow-2xl z-10 transition-transform duration-300 transform translate-x-0">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
