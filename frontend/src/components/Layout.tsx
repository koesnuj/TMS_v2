import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { FileText, PlayCircle, Settings } from 'lucide-react';

const Layout: React.FC = () => {
  const { user } = useAuth();

  const tabs = [
    { path: '/testcases', label: 'TEST CASES', icon: <FileText size={16} /> },
    { path: '/plans', label: 'TEST PLANS & RUNS', icon: <PlayCircle size={16} /> },
  ];

  if (user?.role === 'ADMIN') {
    tabs.push({ path: '/admin', label: 'ADMINISTRATION', icon: <Settings size={16} /> });
  }

  return (
    <div className="min-h-screen bg-[#f2f4f6] flex flex-col">
      <Navbar />
      
      {/* Secondary Navigation (Tabs) */}
      <div className="bg-white border-b border-[#d8d8d8] px-6 pt-2 shadow-sm">
        <div className="flex gap-2"> {/* Increased gap between tabs */}
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `
                px-6 py-3 font-bold text-sm border-t border-l border-r rounded-t-[4px] transition-all flex items-center gap-2
                ${isActive 
                  ? 'bg-[#f2f4f6] text-[#2b73b7] border-[#d8d8d8] border-b-[#f2f4f6] relative top-[1px]' 
                  : 'bg-white text-gray-500 border-transparent hover:bg-[#f9f9f9] hover:text-[#2b73b7]'}
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="bg-white border border-[#d8d8d8] rounded shadow-sm min-h-[600px] p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
