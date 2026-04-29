import { useLocation } from 'react-router-dom';
import { Bell, Search, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Header() {
  const location = useLocation();
  const { role } = useAuth();
  const path = location.pathname;
  
  let title = 'Dashboard';
  if (path.includes('/create')) title = 'Create Shipment';
  else if (path.includes('/upload')) title = 'Upload Documents';
  else if (path.includes('/tracking')) title = 'Live Tracking';
  else if (path.includes('/timeline')) title = 'Shipment Timeline';
  else if (path.includes('/alerts')) title = 'Alerts';
  else if (path.includes('/verify')) title = 'Final Verification';
  else if (path.includes('/analytics')) title = 'Analytics & Audit';

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search shipments..." 
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-64 bg-gray-50"
          />
        </div>
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 border-l pl-6 border-gray-200 cursor-pointer">
          <UserCircle className="w-8 h-8 text-teal-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 leading-tight">{role || 'Guest'}</span>
            <span className="text-xs text-gray-500">System User</span>
          </div>
        </div>
      </div>
    </header>
  );
}
