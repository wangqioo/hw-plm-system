import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Database, FilePlus2, ClipboardCheck,
  ShieldCheck, BookOpen, Menu, X, ChevronDown, Bell,
  Cpu, ChevronRight, LogOut, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: '仪表板', icon: LayoutDashboard, exact: true },
  { to: '/materials', label: '物料库', icon: Database },
  { to: '/entry', label: '物料录入', icon: FilePlus2 },
  { to: '/approval', label: '审核流程', icon: ClipboardCheck },
  { to: '/quality', label: '质量管理', icon: ShieldCheck },
  { to: '/bom', label: 'BOM 管理', icon: BookOpen },
];

const roleColors: Record<string, string> = {
  engineer: 'bg-blue-100 text-blue-700',
  reviewer: 'bg-purple-100 text-purple-700',
  admin: 'bg-orange-100 text-orange-700',
  procurement: 'bg-green-100 text-green-700',
};
const roleLabels: Record<string, string> = {
  engineer: '硬件工程师',
  reviewer: '审核工程师',
  admin: '系统管理员',
  procurement: '采购专员',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans">
      <aside className={clsx('flex flex-col bg-[#1E293B] text-white transition-all duration-300 flex-shrink-0', sidebarOpen ? 'w-56' : 'w-16')}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center flex-shrink-0">
            <Cpu size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-sm font-semibold leading-tight">PLM系统</div>
              <div className="text-[10px] text-slate-400 leading-tight">物料研发管理</div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 cursor-pointer',
                isActive ? 'bg-[#F97316] text-white font-medium' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>
        {sidebarOpen && user && (
          <div className="px-3 py-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                <User size={14} />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-sm font-medium truncate">{user.full_name}</div>
                <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', roleColors[user.role])}>
                  {roleLabels[user.role]}
                </span>
              </div>
              <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-white cursor-pointer transition-colors" title="退出登录">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <span className="text-gray-600 font-medium">硬件研发物料管理系统</span>
            <ChevronRight size={14} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setNotifOpen(v => !v)} className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer transition-colors">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F97316] rounded-full" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm text-gray-700">待办通知</div>
                  {[
                    { text: '有新的物料待审核', time: '刚刚', dot: 'bg-orange-400' },
                    { text: '质量反馈待处理', time: '1小时前', dot: 'bg-red-400' },
                    { text: 'BOM确认请求', time: '昨天', dot: 'bg-blue-400' },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.dot}`} />
                      <div>
                        <div className="text-sm text-gray-700">{n.text}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {user && (
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
                  <User size={13} className="text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">{user.full_name}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
