import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Bell, Mail, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSeabinStore } from '../store/seabinStore'
import logoNav from '../assets/logo/SeaTong_Logo-transparent-2.png'

const SIDEBAR_STORAGE_KEY = 'seatong-sidebar-collapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

const linkBase = 'flex items-center rounded-lg text-sm transition-colors w-full min-w-0'

function itemClass(isActive: boolean, collapsed: boolean) {
  const state = isActive
    ? 'bg-teal-100 text-teal-700 font-medium'
    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
  if (collapsed) {
    return `${linkBase} justify-center px-0 py-2.5 ${state}`
  }
  return `${linkBase} gap-3 px-3 py-2 ${state}`
}

export default function MainLayout() {
  const seabins = useSeabinStore((s) => s.seabins)
  const [collapsed, setCollapsed] = useState(readCollapsed)

  useEffect(() => {
    writeCollapsed(collapsed)
  }, [collapsed])

  return (
    <div className="flex h-screen bg-[#e8f4f8] text-[#1e3a4a] overflow-hidden">
      <aside
        className={`flex flex-col shrink-0 border-r border-teal-200 bg-white shadow-sm transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-18' : 'w-60'
        }`}
        aria-label="Main navigation"
      >
        <div
          className={`flex shrink-0 border-b border-teal-200 ${
            collapsed
              ? 'flex-col items-center gap-2 px-2 py-3'
              : 'min-h-0 flex-row items-center gap-2 pl-2.5 pr-2.5 py-3.5'
          }`}
        >
          {!collapsed && (
            <div className="flex min-h-18 min-w-0 flex-1 items-center pl-3">
              <img
                src={logoNav}
                alt=""
                className="block h-18 w-auto max-w-[min(10.5rem,46%)] shrink-0 translate-y-1 object-contain object-left"
                decoding="async"
              />
              <span className="shrink-0 text-[1.125rem] font-bold leading-none tracking-wide text-teal-700">
                SeaTong
              </span>
            </div>
          )}
          {collapsed && (
            <img
              src={logoNav}
              alt=""
              className="h-10 w-10 shrink-0 object-contain"
              decoding="async"
            />
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav
          className={`flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto py-3 ${
            collapsed ? 'px-1.5' : 'px-2.5'
          }`}
        >
          <NavLink
            to="/"
            end
            title={collapsed ? 'Dashboard' : undefined}
            className={({ isActive }) => itemClass(isActive, collapsed)}
          >
            <LayoutDashboard className="shrink-0" size={18} />
            {!collapsed && <span className="truncate">Dashboard</span>}
          </NavLink>

          <div
            className={`pt-2 ${
              collapsed
                ? 'my-1 h-px w-full shrink-0 bg-teal-100/80'
                : 'px-2.5 pb-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-slate-400'
            }`}
            role="presentation"
          >
            {!collapsed && 'Seabins'}
          </div>
          {seabins.map((sb) => (
            <NavLink
              key={sb.id}
              to={`/seabin/${sb.id}`}
              title={collapsed ? sb.name : undefined}
              className={({ isActive }) => itemClass(isActive, collapsed)}
            >
              <MapPin className="shrink-0" size={17} />
              {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{sb.name}</span>}
              {!collapsed && (
                <span
                  className={`ml-auto h-2 w-2 shrink-0 rounded-full ${
                    sb.status === 'active'
                      ? 'bg-teal-500'
                      : sb.status === 'paused'
                        ? 'bg-yellow-400'
                        : 'bg-slate-300'
                  }`}
                />
              )}
              {collapsed && (
                <span
                  className="sr-only"
                >{`${sb.name} (${sb.status})`}</span>
              )}
            </NavLink>
          ))}

          <div
            className={`pt-2 ${
              collapsed
                ? 'my-1 h-px w-full shrink-0 bg-teal-100/80'
                : 'px-2.5 pb-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-slate-400'
            }`}
            role="presentation"
          >
            {!collapsed && 'System'}
          </div>
          <NavLink
            to="/alerts"
            title={collapsed ? 'Alerts' : undefined}
            className={({ isActive }) => itemClass(isActive, collapsed)}
          >
            <Bell className="shrink-0" size={18} />
            {!collapsed && <span className="truncate">Alerts</span>}
          </NavLink>
          <NavLink
            to="/contact"
            title={collapsed ? 'Contact Us' : undefined}
            className={({ isActive }) => itemClass(isActive, collapsed)}
          >
            <Mail className="shrink-0" size={18} />
            {!collapsed && <span className="truncate">Contact Us</span>}
          </NavLink>
        </nav>

        <div
          className={`shrink-0 border-t border-teal-200 text-[0.7rem] leading-snug text-slate-400 ${
            collapsed ? 'px-1.5 py-2.5 text-center' : 'px-4 py-3.5'
          }`}
        >
          {collapsed ? (
            <span className="block text-[0.6rem] leading-tight" title="Port Klang, Malaysia">
              PKL
            </span>
          ) : (
            'Port Klang, Malaysia'
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
