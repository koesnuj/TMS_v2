import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PlayCircle, 
  Settings, 
  LogOut, 
  CheckSquare,
  BarChart2,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group mb-0.5
      ${active 
        ? 'bg-indigo-50 text-indigo-700' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
  >
    <Icon className={`mr-3 h-5 w-5 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
    {label}
  </Link>
);

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col z-20 h-screen fixed left-0 top-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">TMS v2.0</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
        
        {/* Section: Main */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Project
          </div>
          <nav className="space-y-1">
            <SidebarItem 
              to="/" 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={isActive('/')} 
            />
            <SidebarItem 
              to="/testcases" 
              icon={FileText} 
              label="Test Cases" 
              active={isActive('/testcases')} 
            />
            <SidebarItem 
              to="/plans" 
              icon={PlayCircle} 
              label="Test Plans & Runs" 
              active={isActive('/plans')} 
            />
            <SidebarItem 
              to="/reports" 
              icon={BarChart2} 
              label="Reports" 
              active={isActive('/reports')} 
            />
          </nav>
        </div>

        {/* Section: System */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            System
          </div>
          <nav className="space-y-1">
            {user?.role === 'ADMIN' && (
              <SidebarItem 
                to="/admin" 
                icon={Users} 
                label="Administration" 
                active={isActive('/admin')} 
              />
            )}
            <SidebarItem 
              to="/settings" 
              icon={Settings} 
              label="Settings" 
              active={isActive('/settings')} 
            />
          </nav>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center w-full p-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer group relative">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="text-sm font-medium text-slate-700 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          
          {/* Logout Button (visible on hover or managed via dropdown in future) */}
          <button 
            onClick={logout}
            className="absolute right-2 p-1 text-slate-400 hover:text-rose-600 bg-white rounded-full shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};


