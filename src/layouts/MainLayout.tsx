import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Bell,
    Mail,
    Waves,
    ChevronLeft,
    ChevronRight,
    Activity,
    Droplet,
    Leaf,
} from 'lucide-react';
import { useSeabinStore } from '../store/seabinStore';
import logoNav from '../assets/brand/SeaTong_Logo-transparent-2.png';

const SIDEBAR_STORAGE_KEY = 'seatong-sidebar-collapsed';

function readCollapsed(): boolean {
    try {
        return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}
function writeCollapsed(value: boolean) {
    try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? '1' : '0');
    } catch {
        /* ignore */
    }
}

const linkBase =
    'group flex items-center rounded-lg text-[0.88rem] transition-colors w-full min-w-0';

function itemClass(isActive: boolean, collapsed: boolean) {
    const state = isActive
        ? 'bg-teal-50 text-teal-700 font-medium ring-1 ring-teal-100'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50';
    if (collapsed) return `${linkBase} justify-center px-0 py-2.5 ${state}`;
    return `${linkBase} gap-3 px-3 py-2 ${state}`;
}

export default function MainLayout() {
    const seabins = useSeabinStore((s) => s.seabins);
    const [collapsed, setCollapsed] = useState(readCollapsed);

    useEffect(() => {
        writeCollapsed(collapsed);
    }, [collapsed]);

    const stats = useMemo(() => {
        const active = seabins.filter((s) => s.status === 'active').length;
        const paused = seabins.filter((s) => s.status === 'paused').length;
        const offline = seabins.filter((s) => s.status === 'inactive').length;
        const critical = seabins.filter(
            (s) => s.contamination_risk === 'critical',
        ).length;
        return { active, paused, offline, critical, total: seabins.length };
    }, [seabins]);

    return (
        <div className='flex h-screen bg-[#eef6f8] text-slate-800 overflow-hidden'>
            <aside
                className={`flex flex-col shrink-0 border-r border-slate-200/80 bg-white/95 backdrop-blur transition-[width] duration-300 ease-in-out ${
                    collapsed ? 'w-18' : 'w-64'
                }`}
                aria-label='Main navigation'
            >
                {/* Header */}
                <div
                    className={`flex shrink-0 border-b border-slate-200/80 ${
                        collapsed
                            ? 'flex-col items-center gap-2 px-2 py-3'
                            : 'min-h-0 flex-row items-center gap-2 pl-2.5 pr-2.5 py-3'
                    }`}
                >
                    {!collapsed && (
                        <div className='flex min-h-16 min-w-0 flex-1 items-center gap-2 pl-2'>
                            <img
                                src={logoNav}
                                alt=''
                                className='block h-16 w-auto max-w-[min(9rem,44%)] shrink-0 translate-y-0.5 object-contain object-left'
                                decoding='async'
                            />
                            <span className='shrink-0 text-[1.15rem] font-semibold tracking-tight text-teal-700'>
                                SeaTong
                            </span>
                        </div>
                    )}
                    {collapsed && (
                        <img
                            src={logoNav}
                            alt=''
                            className='h-10 w-10 shrink-0 object-contain'
                            decoding='async'
                        />
                    )}
                    <button
                        type='button'
                        onClick={() => setCollapsed((c) => !c)}
                        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700'
                        title={
                            collapsed ? 'Expand sidebar' : 'Collapse sidebar'
                        }
                        aria-expanded={!collapsed}
                        aria-label={
                            collapsed ? 'Expand sidebar' : 'Collapse sidebar'
                        }
                    >
                        {collapsed ? (
                            <ChevronRight size={18} />
                        ) : (
                            <ChevronLeft size={18} />
                        )}
                    </button>
                </div>

                {/* Nav */}
                <nav
                    className={`flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto py-3 ${
                        collapsed ? 'px-1.5' : 'px-2.5'
                    }`}
                >
                    {!collapsed && (
                        <div className='px-2.5 pb-1.5 pt-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-400'>
                            Overview
                        </div>
                    )}

                    <NavLink
                        to='/'
                        end
                        title={collapsed ? 'Dashboard' : undefined}
                        className={({ isActive }) =>
                            itemClass(isActive, collapsed)
                        }
                    >
                        <LayoutDashboard className='shrink-0' size={18} />
                        {!collapsed && (
                            <span className='truncate'>Dashboard</span>
                        )}
                    </NavLink>

                    <NavLink
                        to='/fleet'
                        title={collapsed ? 'Fleet' : undefined}
                        className={({ isActive }) =>
                            itemClass(isActive, collapsed)
                        }
                    >
                        <Waves className='shrink-0' size={18} />
                        {!collapsed && (
                            <span className='flex min-w-0 flex-1 items-center gap-2'>
                                <span className='truncate'>Fleet</span>
                                <span className='ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-500'>
                                    {stats.total}
                                </span>
                            </span>
                        )}
                    </NavLink>

                    <NavLink
                        to='/alerts'
                        title={collapsed ? 'Alerts' : undefined}
                        className={({ isActive }) =>
                            itemClass(isActive, collapsed)
                        }
                    >
                        <Bell className='shrink-0' size={18} />
                        {!collapsed && (
                            <span className='flex min-w-0 flex-1 items-center gap-2'>
                                <span className='truncate'>Alerts</span>
                                {stats.critical > 0 && (
                                    <span className='ml-auto rounded-full bg-red-50 px-1.5 py-0.5 text-[0.65rem] font-medium text-red-600 ring-1 ring-red-200'>
                                        {stats.critical}
                                    </span>
                                )}
                            </span>
                        )}
                    </NavLink>

                    {!collapsed && (
                        <div className='px-2.5 pb-1.5 pt-5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-400'>
                            Monitoring
                        </div>
                    )}
                    {collapsed && (
                        <div
                            className='my-1 h-px w-full shrink-0 bg-teal-100/80'
                            role='presentation'
                        />
                    )}

                    <NavLink
                        to='/water-quality'
                        title={collapsed ? 'Water Quality' : undefined}
                        className={({ isActive }) =>
                            itemClass(isActive, collapsed)
                        }
                    >
                        <Droplet className='shrink-0' size={18} />
                        {!collapsed && (
                            <span className='truncate'>Water Quality</span>
                        )}
                    </NavLink>

                    <NavLink
                        to='/plastic-credits'
                        title={collapsed ? 'Plastic Credits' : undefined}
                        className={({ isActive }) =>
                            itemClass(isActive, collapsed)
                        }
                    >
                        <Leaf className='shrink-0' size={18} />
                        {!collapsed && (
                            <span className='truncate'>Plastic Credits</span>
                        )}
                    </NavLink>

                    {/* Fleet status widget */}
                    {!collapsed && (
                        <>
                            <div className='px-2.5 pb-1.5 pt-5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-400'>
                                Fleet status
                            </div>
                            <div className='mx-1.5 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-2.5'>
                                <div className='flex items-center justify-between text-[0.7rem]'>
                                    <span className='inline-flex items-center gap-1.5 text-slate-600'>
                                        <span className='relative flex h-1.5 w-1.5'>
                                            <span className='absolute inset-0 rounded-full bg-teal-500' />
                                            <span className='absolute inset-0 animate-ping rounded-full bg-teal-500/60' />
                                        </span>
                                        Active
                                    </span>
                                    <span className='font-semibold tabular-nums text-slate-800'>
                                        {stats.active}
                                    </span>
                                </div>
                                <div className='mt-1.5 flex items-center justify-between text-[0.7rem]'>
                                    <span className='inline-flex items-center gap-1.5 text-slate-600'>
                                        <span className='h-1.5 w-1.5 rounded-full bg-amber-400' />
                                        Paused
                                    </span>
                                    <span className='font-semibold tabular-nums text-slate-800'>
                                        {stats.paused}
                                    </span>
                                </div>
                                <div className='mt-1.5 flex items-center justify-between text-[0.7rem]'>
                                    <span className='inline-flex items-center gap-1.5 text-slate-600'>
                                        <span className='h-1.5 w-1.5 rounded-full bg-slate-400' />
                                        Offline
                                    </span>
                                    <span className='font-semibold tabular-nums text-slate-800'>
                                        {stats.offline}
                                    </span>
                                </div>
                            </div>

                            <div className='mx-1.5 mt-2 flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-[0.7rem] text-teal-800'>
                                <Activity size={13} className='shrink-0' />
                                <span className='truncate'>
                                    Live feed · Port Klang
                                </span>
                            </div>
                        </>
                    )}
                </nav>

                {/* Footer */}
                <div
                    className={`shrink-0 border-t border-slate-200/80 ${
                        collapsed ? 'px-1.5 py-2.5 text-center' : 'px-4 py-3'
                    }`}
                >
                    {collapsed ? (
                        <span
                            className='block text-[0.6rem] font-medium leading-tight text-slate-400'
                            title='Port Klang, Malaysia'
                        >
                            PKL
                        </span>
                    ) : (
                        <NavLink
                            to='/contact'
                            className={({ isActive }) =>
                                `flex items-center gap-2 text-[0.72rem] transition-colors ${
                                    isActive
                                        ? 'text-teal-700'
                                        : 'text-slate-500 hover:text-teal-700'
                                }`
                            }
                        >
                            <Mail size={13} />
                            <span>Contact &amp; partnerships</span>
                        </NavLink>
                    )}
                </div>
            </aside>

            <main className='min-w-0 flex-1 overflow-y-auto'>
                <Outlet />
            </main>
        </div>
    );
}
