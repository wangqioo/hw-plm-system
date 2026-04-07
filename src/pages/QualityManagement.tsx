import { useState } from 'react';
import { clsx } from 'clsx';
import {
  ShieldCheck, TrendingDown, TrendingUp, AlertTriangle,
  Eye, Plus, Star, ArrowDown, ArrowUp, ChevronRight,
  CheckCircle, Clock
} from 'lucide-react';
import { materials, qualityFeedbacks as initial, categoryLabels } from '../data/mockData';
import type { QualityFeedback } from '../types';
import { QualityBadge, StatusBadge } from '../components/Badge';

const typeConfig = {
  downgrade: { label: '降级申请', icon: TrendingDown, color: 'text-red-600 bg-red-50 border-red-200' },
  upgrade: { label: '升级申请', icon: TrendingUp, color: 'text-green-600 bg-green-50 border-green-200' },
  ban: { label: '禁用申请', icon: AlertTriangle, color: 'text-red-700 bg-red-100 border-red-300' },
  observation: { label: '质量观察', icon: Eye, color: 'text-blue-600 bg-blue-50 border-blue-200' },
};

const sourceLabels: Record<string, string> = {
  test: '实验室测试',
  manufacturer: '厂商通知',
  field: '现场反馈',
  engineer: '工程师评审',
};

// Group materials by category for ranking view
const rankedByCategory = Object.entries(
  materials.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, typeof materials>)
).map(([cat, mats]) => ({
  category: cat,
  label: categoryLabels[cat] || cat,
  materials: mats.sort((a, b) => a.preferredRank - b.preferredRank),
}));

export default function QualityManagement() {
  const [feedbacks, setFeedbacks] = useState<QualityFeedback[]>(initial);
  const [tab, setTab] = useState<'ranking' | 'feedback'>('ranking');
  const [showForm, setShowForm] = useState(false);
  const [selectedFb, setSelectedFb] = useState<QualityFeedback | null>(null);
  const [formData, setFormData] = useState({
    materialId: '',
    type: 'downgrade' as QualityFeedback['type'],
    source: 'test' as QualityFeedback['source'],
    description: '',
    proposedLevel: 'B' as string,
  });

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const mat = materials.find(m => m.id === formData.materialId);
    if (!mat) return;
    const newFb: QualityFeedback = {
      id: `qf${Date.now()}`,
      materialId: formData.materialId,
      materialName: mat.name,
      type: formData.type,
      source: formData.source,
      description: formData.description,
      reportedBy: '张工',
      reportedAt: new Date().toLocaleString('zh-CN'),
      status: 'open',
      previousLevel: mat.qualityLevel,
      proposedLevel: formData.type !== 'observation' ? formData.proposedLevel as 'A'|'B'|'C'|'D' : undefined,
    };
    setFeedbacks(prev => [newFb, ...prev]);
    setShowForm(false);
    setFormData({ materialId: '', type: 'downgrade', source: 'test', description: '', proposedLevel: 'B' });
    setTab('feedback');
  };

  const handleProcess = (id: string, status: 'processing' | 'resolved') => {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    if (selectedFb?.id === id) setSelectedFb(prev => prev ? { ...prev, status } : null);
  };

  const qualityCounts = {
    A: materials.filter(m => m.qualityLevel === 'A').length,
    B: materials.filter(m => m.qualityLevel === 'B').length,
    C: materials.filter(m => m.qualityLevel === 'C').length,
    D: materials.filter(m => m.qualityLevel === 'D').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">质量管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">物料优选排名与质量等级管理</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors cursor-pointer"
        >
          <Plus size={15} />
          提交质量反馈
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { level: 'A', label: 'A级 优选', count: qualityCounts.A, color: 'border-green-200 bg-green-50', text: 'text-green-700' },
          { level: 'B', label: 'B级 备选', count: qualityCounts.B, color: 'border-blue-200 bg-blue-50', text: 'text-blue-700' },
          { level: 'C', label: 'C级 限制', count: qualityCounts.C, color: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-700' },
          { level: 'D', label: 'D级 禁用', count: qualityCounts.D, color: 'border-red-200 bg-red-50', text: 'text-red-700' },
        ].map(card => (
          <div key={card.level} className={`rounded-xl border p-4 ${card.color}`}>
            <div className={`text-3xl font-bold ${card.text}`}>{card.count}</div>
            <div className={`text-sm font-medium mt-1 ${card.text}`}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {([
          { key: 'ranking', label: '优选排名' },
          { key: 'feedback', label: `质量反馈 (${feedbacks.filter(f => f.status !== 'resolved').length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Ranking Tab */}
      {tab === 'ranking' && (
        <div className="space-y-4">
          {rankedByCategory.map(({ category, label, materials: mats }) => (
            <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
                <span className="text-xs text-gray-400">{mats.length} 种物料</span>
              </div>
              <div className="divide-y divide-gray-100">
                {mats.map((m, idx) => (
                  <div key={m.id} className={clsx(
                    'flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors',
                    m.status === 'deprecated' && 'opacity-50'
                  )}>
                    {/* Rank indicator */}
                    <div className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : '#f9fafb',
                        border: idx === 0 ? '1px solid #fbbf24' : '1px solid #e2e8f0'
                      }}
                    >
                      {idx === 0 ? (
                        <Star size={13} className="text-yellow-500 fill-yellow-400" />
                      ) : (
                        <span className="text-xs font-bold text-gray-400">#{m.preferredRank}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{m.name}</span>
                        {idx === 0 && <span className="text-[11px] text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">首选推荐</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {m.manufacturer} {m.manufacturerPN} · <span className="font-mono">{m.partNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <QualityBadge level={m.qualityLevel} />
                      <StatusBadge status={m.status} />
                      {m.leadTime && (
                        <span className="text-xs text-gray-400">货期 {m.leadTime}天</span>
                      )}
                      {m.unitPrice != null && (
                        <span className="text-xs font-medium text-gray-600">¥{m.unitPrice}</span>
                      )}
                      <div className="flex gap-1">
                        <button className="p-1 hover:bg-gray-100 rounded cursor-pointer" title="上移">
                          <ArrowUp size={13} className="text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded cursor-pointer" title="下移">
                          <ArrowDown size={13} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Tab */}
      {tab === 'feedback' && (
        <div className="flex gap-5">
          <div className="flex-1 min-w-0 space-y-3">
            {feedbacks.map(fb => {
              const cfg = typeConfig[fb.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={fb.id}
                  onClick={() => setSelectedFb(fb)}
                  className={clsx(
                    'bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all',
                    selectedFb?.id === fb.id ? 'border-[#F97316] ring-1 ring-[#F97316]/20' : 'border-gray-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.color}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{fb.materialName}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <StatusBadge status={fb.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{fb.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        <span>{sourceLabels[fb.source]}</span>
                        <span>·</span>
                        <span>{fb.reportedBy}</span>
                        <span>·</span>
                        <span>{fb.reportedAt}</span>
                        {fb.proposedLevel && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <QualityBadge level={fb.previousLevel} />
                              <ChevronRight size={11} />
                              <QualityBadge level={fb.proposedLevel} />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {fb.status === 'open' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleProcess(fb.id, 'processing'); }}
                        className="text-[11px] bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors cursor-pointer flex-shrink-0"
                      >
                        开始处理
                      </button>
                    )}
                    {fb.status === 'processing' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleProcess(fb.id, 'resolved'); }}
                        className="text-[11px] bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors cursor-pointer flex-shrink-0"
                      >
                        标记解决
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail */}
          {selectedFb && (
            <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 space-y-4 overflow-auto h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">反馈详情</h3>
                <button onClick={() => setSelectedFb(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">×</button>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: '物料', value: selectedFb.materialName },
                  { label: '反馈类型', value: typeConfig[selectedFb.type].label },
                  { label: '来源', value: sourceLabels[selectedFb.source] },
                  { label: '提交人', value: selectedFb.reportedBy },
                  { label: '提交时间', value: selectedFb.reportedAt },
                  { label: '当前等级', value: <QualityBadge level={selectedFb.previousLevel} /> },
                  ...(selectedFb.proposedLevel ? [{ label: '建议等级', value: <QualityBadge level={selectedFb.proposedLevel} /> }] : []),
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center gap-2">
                    <span className="text-gray-400">{row.label}</span>
                    <span className="text-gray-700 font-medium text-right">{row.value as string}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 leading-relaxed">{selectedFb.description}</p>
              </div>
              <div className="flex gap-2">
                {selectedFb.status === 'open' && (
                  <button onClick={() => handleProcess(selectedFb.id, 'processing')} className="flex-1 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">开始处理</button>
                )}
                {selectedFb.status === 'processing' && (
                  <button onClick={() => handleProcess(selectedFb.id, 'resolved')} className="flex-1 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer">标记解决</button>
                )}
                {selectedFb.status === 'resolved' && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle size={13} /> 已解决
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">提交质量反馈</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl">×</button>
            </div>
            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">选择物料 *</label>
                <select
                  required
                  value={formData.materialId}
                  onChange={e => setFormData(f => ({ ...f, materialId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] cursor-pointer"
                >
                  <option value="">请选择物料</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.partNumber})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">反馈类型</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(f => ({ ...f, type: e.target.value as QualityFeedback['type'] }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] cursor-pointer"
                  >
                    {Object.entries(typeConfig).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">信息来源</label>
                  <select
                    value={formData.source}
                    onChange={e => setFormData(f => ({ ...f, source: e.target.value as QualityFeedback['source'] }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] cursor-pointer"
                  >
                    {Object.entries(sourceLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              {formData.type !== 'observation' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">建议调整为</label>
                  <select
                    value={formData.proposedLevel}
                    onChange={e => setFormData(f => ({ ...f, proposedLevel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] cursor-pointer"
                  >
                    <option value="A">A级 - 优选</option>
                    <option value="B">B级 - 备选</option>
                    <option value="C">C级 - 限制使用</option>
                    <option value="D">D级 - 禁止使用</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">问题描述 *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="详细描述问题现象、测试条件、影响范围..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer">
                  取消
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-[#F97316] text-white rounded-lg hover:bg-orange-600 cursor-pointer font-medium">
                  提交反馈
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
