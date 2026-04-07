import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Database, ClipboardCheck, ShieldCheck, AlertTriangle,
  TrendingUp, CheckCircle, Clock, XCircle, ChevronRight,
  Package, Cpu
} from 'lucide-react';
import { materials, approvalRecords, qualityFeedbacks, projects } from '../data/mockData';
import { StatusBadge, QualityBadge } from '../components/Badge';

const categoryData = [
  { name: '电阻', count: 12 },
  { name: '电容', count: 18 },
  { name: '电感', count: 6 },
  { name: '连接器', count: 9 },
  { name: 'IC', count: 24 },
  { name: '晶振', count: 4 },
  { name: '其他', count: 8 },
];

const qualityPieData = [
  { name: 'A级 优选', value: 38, color: '#22c55e' },
  { name: 'B级 备选', value: 29, color: '#3b82f6' },
  { name: 'C级 限制', value: 11, color: '#f59e0b' },
  { name: 'D级 禁用', value: 3, color: '#ef4444' },
];

const monthlyEntries = [
  { month: '10月', count: 8 },
  { month: '11月', count: 12 },
  { month: '12月', count: 6 },
  { month: '1月', count: 15 },
  { month: '2月', count: 9 },
  { month: '3月', count: 18 },
];

const pendingApprovals = approvalRecords.filter(r => r.status === 'pending' || r.status === 'reviewing');
const openFeedbacks = qualityFeedbacks.filter(f => f.status === 'open' || f.status === 'processing');

const kpis = [
  {
    label: '物料总数',
    value: 81,
    sub: '较上月 +5',
    icon: Database,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    label: '待审核',
    value: pendingApprovals.length,
    sub: '需要处理',
    icon: ClipboardCheck,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    alert: true,
  },
  {
    label: '质量反馈',
    value: openFeedbacks.length,
    sub: '待处理',
    icon: ShieldCheck,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    label: '停用物料',
    value: materials.filter(m => m.status === 'deprecated').length,
    sub: '需关注',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">仪表板</h1>
          <p className="text-sm text-gray-500 mt-0.5">硬件研发物料生命周期管理 · 2026年4月7日</p>
        </div>
        <Link
          to="/entry"
          className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors cursor-pointer"
        >
          <Cpu size={15} />
          新增物料
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${kpi.alert ? 'border-orange-300 shadow-sm' : 'border-gray-200'}`}
          >
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Entry Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">物料录入趋势（近6个月）</h3>
            <TrendingUp size={15} className="text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyEntries} barSize={28}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} name="新增物料数" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quality Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">物料质量等级分布</h3>
            <ShieldCheck size={15} className="text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie
                data={qualityPieData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={58}
                dataKey="value"
                strokeWidth={2}
              >
                {qualityPieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
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

      {/* Category Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">物料类别统计</h3>
          <Package size={15} className="text-gray-400" />
        </div>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={categoryData} barSize={22} layout="horizontal">
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="count" fill="#64748B" radius={[3, 3, 0, 0]} name="数量" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock size={15} className="text-orange-500" />
              待处理审核
            </h3>
            <Link to="/approval" className="text-xs text-[#F97316] hover:underline cursor-pointer flex items-center gap-0.5">
              查看全部 <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingApprovals.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.priority === 'high' ? 'bg-red-400' : r.priority === 'medium' ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 font-medium truncate">{r.materialName}</div>
                  <div className="text-xs text-gray-400">{r.partNumber} · {r.submittedBy} · {r.submittedAt}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
            {pendingApprovals.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                <CheckCircle size={24} className="text-green-400" />
                暂无待处理审核
              </div>
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Database size={15} className="text-blue-500" />
              进行中项目 BOM
            </h3>
            <Link to="/bom" className="text-xs text-[#F97316] hover:underline cursor-pointer flex items-center gap-0.5">
              查看全部 <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {projects.map(p => {
              const stageMap: Record<string, { label: string; color: string }> = {
                schematic: { label: '原理图阶段', color: 'text-blue-600 bg-blue-50' },
                layout: { label: '布局阶段', color: 'text-purple-600 bg-purple-50' },
                prototype: { label: '样机阶段', color: 'text-yellow-600 bg-yellow-50' },
                pilot: { label: '小批量', color: 'text-orange-600 bg-orange-50' },
                mass_production: { label: '量产', color: 'text-green-600 bg-green-50' },
              };
              const stage = stageMap[p.stage];
              const unconfirmed = p.bomItems.filter(b => !b.confirmedBy).length;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{p.code}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500">BOM {p.bomItems.length} 项</span>
                      {unconfirmed > 0 && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-orange-500">{unconfirmed} 项待确认</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${stage.color}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quality Alerts */}
      {openFeedbacks.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-red-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              质量预警
            </h3>
            <Link to="/quality" className="text-xs text-[#F97316] hover:underline cursor-pointer flex items-center gap-0.5">
              查看全部 <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {openFeedbacks.map(f => (
              <div key={f.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                <div className="mt-0.5">
                  {f.type === 'downgrade' ? (
                    <XCircle size={16} className="text-red-400" />
                  ) : f.type === 'upgrade' ? (
                    <TrendingUp size={16} className="text-green-400" />
                  ) : (
                    <AlertTriangle size={16} className="text-yellow-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 font-medium">{f.materialName}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{f.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <QualityBadge level={f.previousLevel} />
                    {f.proposedLevel && (
                      <>
                        <span className="text-gray-400 text-xs">→</span>
                        <QualityBadge level={f.proposedLevel} />
                      </>
                    )}
                    <span className="text-xs text-gray-400">{f.reportedBy} · {f.reportedAt.split(' ')[0]}</span>
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
