import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, History, AlertTriangle, Menu, X, Database, Truck, Clock } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Inventory', path: '/products', icon: Package },
  { name: 'Stock Manager', path: '/stock-manager', icon: Truck },
  { name: 'Time Travel', path: '/time-travel', icon: Clock },
  { name: 'Transactions', path: '/transactions', icon: History },
  { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { name: 'Raw Explorer', path: '/raw', icon: Database },
];

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 z-50",
        isSidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {isSidebarOpen && <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">InventoryX</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-white/10 rounded">
            {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
        
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 transition-colors relative group",
                  isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={20} className={cn(isSidebarOpen ? "mr-3" : "mx-auto")} />
                {isSidebarOpen && <span>{item.name}</span>}
                {!isSidebarOpen && (
                  <div className="absolute left-16 bg-slate-800 text-white px-2 py-1 rounded text-xs invisible group-hover:visible whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-16"
      )}>
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-40">
          <h1 className="font-semibold text-lg text-slate-800">
            {navItems.find(i => i.path === location.pathname)?.name || 'HBase Real-Time Inventory'}
          </h1>
          <div className="flex items-center space-gap-4">
             <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                HBase Connected
             </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
