import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', label: '管理员' },
  { username: 'engineer1', password: 'eng123', label: '硬件工程师' },
  { username: 'reviewer', password: 'rev123', label: '审核工程师' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(username, password);
      login(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc: { username: string; password: string }) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#F97316] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <Cpu size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">PLM 物料管理系统</h1>
          <p className="text-slate-400 mt-1 text-sm">硬件研发物料生命周期管理</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="请输入用户名"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="请输入密码"
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2">
                <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-orange-600 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={17} />
              )}
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-xs text-slate-400 mb-3 text-center">演示账号（点击快速填入）</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.username}
                  onClick={() => fillDemo(acc)}
                  className="px-2 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 cursor-pointer transition-colors text-center"
                >
                  <div className="font-medium">{acc.label}</div>
                  <div className="text-slate-500 mt-0.5">{acc.username}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          硬件研发物料管理系统 v1.0
        </p>
      </div>
    </div>
  );
}
