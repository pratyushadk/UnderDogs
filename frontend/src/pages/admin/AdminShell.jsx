import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Map, Users, CreditCard, AlertTriangle, Zap, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminOverview     from './AdminOverview.jsx';
import AdminZones        from './AdminZones.jsx';
import AdminUsers        from './AdminUsers.jsx';
import AdminTransactions from './AdminTransactions.jsx';
import AdminFraud        from './AdminFraud.jsx';

const NAV = [
  { to: '/admin/overview',      icon: LayoutDashboard, label: 'Overview'     },
  { to: '/admin/zones',         icon: Map,             label: 'Zones'        },
  { to: '/admin/users',         icon: Users,           label: 'Users'        },
  { to: '/admin/transactions',  icon: CreditCard,      label: 'Transactions' },
  { to: '/admin/fraud',         icon: AlertTriangle,   label: 'Fraud Log'    },
];

export default function AdminShell() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">WorkSafe</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Admin Portal</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-950">
        <Routes>
          <Route path="overview"     element={<AdminOverview />}     />
          <Route path="zones"        element={<AdminZones />}        />
          <Route path="users"        element={<AdminUsers />}        />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="fraud"        element={<AdminFraud />}        />
          <Route path="*"            element={<AdminOverview />}     />
        </Routes>
      </main>
    </div>
  );
}
