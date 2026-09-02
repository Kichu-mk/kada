import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, History, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <Home size={20} /> },
        { name: 'Products', path: '/products', icon: <Package size={20} /> },
        { name: 'History', path: '/history', icon: <History size={20} /> },
    ];

    return (
        <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col transition-all duration-300">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-white tracking-wider">KADA.</h1>
                <p className="text-xs text-slate-500 mt-1">Store Management</p>
            </div>

            <nav className="flex-1 mt-6">
                <ul className="space-y-2 px-4">
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                                        isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'hover:bg-slate-800 hover:text-white'
                                    }`
                                }
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors duration-200"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
