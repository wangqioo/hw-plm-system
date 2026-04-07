import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Database, ClipboardCheck, ShieldCheck, AlertTriangle, TrendingUp, CheckCircle, Clock, XCircle, ChevronRight, Package, Cpu } from 'lucide-react';
import { dashboardApi } from '../api/upload';
import { approvalsApi, type ApprovalRecord } from '../api/approvals';
import { qualityApi, type QualityFeedback } from '../api/quality';
import { projectsApi, type Project } from '../api/projects';
import { StatusBadge, QualityBadge } from '../components/Badge';

const QUALITY_COLORS: Record<string, string> = { A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' };

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<QualityFeedback[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.getStats(),
      approvalsApi.list({ status: 'pending' }),
      qualityApi.list({ status: 'open' }),
      projectsApi.list(),
    ]).then(([s, a, q, p]) => {
      setStats(s.data);
      setApprovals(a.data.slice(0, 4));
      setFeedbacks(q.data.slice(0, 3));
      setProjects(p.data.slice(0, 4));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
    </div>
  );

  const qualityPieData = Object.entries(stats?.quality_distribution || {}).map(([k, v]) => ({
    name: `${k}级`, value: v as number, color: QUALITY_COLORS[k] || '#94a3b8',
  }));

  const categoryData = Object.entries(stats?.category_distribution || {}).slice(0, 8).map(([k, v]) => ({
    name: k, count: v as number,
  }));

  const kpis = [
    { label: '物料总数', value: stats?.total_materials ?? 0, sub: '已入库物料', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '待审核', value: stats?.pending_approvals ?? 0, sub: '需要处理', icon: ClipboardCheck, color: 'text-orange-600', bg: 'bg-orange-50', alert: true },
    { label: '质量反馈', value: stats?.open_feedbacks ?? 0, sub: '待处理', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '停用物料', value: stats?.deprecated_materials ?? 0, sub: '需关注', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const stageMap: Record<string, { label: string; color: string }> = {
    schematic: { label: '原理图阶段', color: 'text-blue-600 bg-blue-50' },
    layout: { label: '布局阶段', color: 'text-purple-600 bg-purple-50' },
    prototype: { label: '样机阶段', color: 'text-yellow-600 bg-yellow-50' },
    pilot: { label: '小批量', color: 'text-orange-600 bg-orange-50' },
    mass_production: { label: '量产', color: 'text-green-600 bg-green-50' },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">仪表板</h1>
          <p className="text-sm text-gray-500 mt-0.5">硬件研发物料生命周期管理</p>
        </div>
        <Link to="/entry" className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors cursor-pointer">
          <Cpu size={15} /> 新增物料
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${kpi.alert ? 'border-orange-300' : 'border-gray-200'}`}>
            <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
              <kpi.icon size={20} className={kpi.color} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-sm text-gray-600 font-medium">{kpi.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">物料录入趋势（近6个月）</h3>
            <TrendingUp size={15} className="text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats?.monthly_entries || []} barSize={28}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} name="新增物料" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">质量等级分布</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={qualityPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" strokeWidth={2}>
                {qualityPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {qualityPieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-gray-600">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">物料类别统计</h3>
            <Package size={15} className="text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={categoryData} barSize={22}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="count" fill="#64748B" radius={[3, 3, 0, 0]} name="数量" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock size={15} className="text-orange-500" /> 待处理审核
            </h3>
            <Link to="/approval" className="text-xs text-[#F97316] hover:underline cursor-pointer flex items-center gap-0.5">查看全部 <ChevronRight size={13} /></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {approvals.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                <CheckCircle size={24} className="text-green-400" /> 暂无待处理审核
              </div>
            ) : approvals.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.priority === 'high' ? 'bg-red-400' : r.priority === 'medium' ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 font-medium truncate">{r.material_name}</div>
                  <div className="text-xs text-gray-400">{r.part_number} · {r.submitter_name}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Database size={15} className="text-blue-500" /> 进行中项目
            </h3>
            <Link to="/bom" className="text-xs text-[#F97316] hover:underline cursor-pointer flex items-center gap-0.5">查看全部 <ChevronRight size={13} /></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {projects.map(p => {
              const stage = stageMap[p.stage] || { label: p.stage, color: 'text-gray-600 bg-gray-50' };
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{p.code}</span>
                      <span>·</span>
                      <span>BOM {p.bom_count} 项</span>
                      {p.unconfirmed_count > 0 && <span className="text-orange-500">{p.unconfirmed_count} 待确认</span>}
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${stage.color}`}>{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {feedbacks.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-red-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" /> 质量预警
            </h3>
            <Link to="/quality" className="text-xs text-[#F97316] hover:underline cursor-pointer flex items-center gap-0.5">查看全部 <ChevronRight size={13} /></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {feedbacks.map(f => (
              <div key={f.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                <div className="mt-0.5">
                  {f.type === 'downgrade' ? <XCircle size={16} className="text-red-400" /> : <TrendingUp size={16} className="text-green-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 font-medium">{f.material_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{f.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <QualityBadge level={f.previous_level} />
                    {f.proposed_level && <><span className="text-gray-400 text-xs">→</span><QualityBadge level={f.proposed_level} /></>}
                    <span className="text-xs text-gray-400">{f.reporter_name}</span>
                  </div>
                </div>
                <StatusBadge status={f.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
