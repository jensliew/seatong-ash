import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Bell, Mail, Waves, MapPin } from 'lucide-react'
import { useSeabinStore } from '../store/seabinStore'

export default function MainLayout() {
  const seabins = useSeabinStore((s) => s.seabins)

  return (
    <div className="flex h-screen bg-[#e8f4f8] text-[#1e3a4a] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-teal-200 flex flex-col shrink-0 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-teal-200">
          <Waves className="text-teal-500" size={22} />
          <span className="text-teal-700 font-bold text-lg tracking-wide">SeaTong</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-teal-100 text-teal-700 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>

          <div className="pt-3 pb-1 px-3 text-xs text-slate-400 uppercase tracking-wider">Seabins</div>
          {seabins.map((sb) => (
            <NavLink
              key={sb.id}
              to={`/seabin/${sb.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-teal-100 text-teal-700 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <MapPin size={14} />
              <span className="truncate">{sb.name}</span>
              <span
                className={`ml-auto w-2 h-2 rounded-full shrink-0 ${
                  sb.status === 'active' ? 'bg-teal-500' : sb.status === 'paused' ? 'bg-yellow-400' : 'bg-slate-300'
                }`}
              />
            </NavLink>
          ))}

          <div className="pt-3 pb-1 px-3 text-xs text-slate-400 uppercase tracking-wider">System</div>
          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-teal-100 text-teal-700 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            <Bell size={16} />
            Alerts
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-teal-100 text-teal-700 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            <Mail size={16} />
            Contact Us
          </NavLink>
        </nav>

        <div className="px-5 py-4 border-t border-teal-200 text-xs text-slate-400">
          Port Klang, Malaysia
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
