import { useState } from 'react';
import { clsx } from 'clsx';
import {
  CheckCircle, XCircle, Clock, Eye, MessageSquare,
  Filter, ChevronRight, AlertTriangle, FileCheck,
  User, Calendar, Package
} from 'lucide-react';
import { approvalRecords as initial } from '../data/mockData';
import type { ApprovalRecord } from '../types';
import { StatusBadge } from '../components/Badge';

type FilterStatus = 'all' | 'pending' | 'reviewing' | 'approved' | 'rejected';
type FilterType = 'all' | 'new_entry' | 'quality_change' | 'bom_confirm' | 'deprecate';

const typeLabels: Record<string, string> = {
  new_entry: '新物料入库',
  quality_change: '质量等级变更',
  bom_confirm: 'BOM确认',
  deprecate: '物料停用',
};
const typeColors: Record<string, string> = {
  new_entry: 'bg-blue-50 text-blue-700 border-blue-200',
  quality_change: 'bg-orange-50 text-orange-700 border-orange-200',
  bom_confirm: 'bg-purple-50 text-purple-700 border-purple-200',
  deprecate: 'bg-red-50 text-red-700 border-red-200',
};
const priorityColors: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-yellow-400',
  low: 'bg-gray-300',
};
const priorityLabels: Record<string, string> = {
  high: '紧急',
  medium: '一般',
  low: '低优先',
};

export default function ApprovalWorkflow() {
  const [records, setRecords] = useState<ApprovalRecord[]>(initial);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selected, setSelected] = useState<ApprovalRecord | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = records.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchType = filterType === 'all' || r.type === filterType;
    return matchStatus && matchType;
  });

  const counts = {
    pending: records.filter(r => r.status === 'pending').length,
    reviewing: records.filter(r => r.status === 'reviewing').length,
    approved: records.filter(r => r.status === 'approved').length,
    rejected: records.filter(r => r.status === 'rejected').length,
  };

  const handleAction = (id: string, action: 'approve' | 'reject' | 'review') => {
    setProcessing(id);
    setTimeout(() => {
      setRecords(prev => prev.map(r => {
        if (r.id !== id) return r;
        return {
          ...r,
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reviewing',
          reviewedBy: '李审核',
          reviewedAt: new Date().toLocaleString('zh-CN'),
          comment: comment || r.comment,
        };
      }));
      if (selected?.id === id) {
        setSelected(prev => prev ? {
          ...prev,
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reviewing',
          reviewedBy: '李审核',
          reviewedAt: new Date().toLocaleString('zh-CN'),
          comment: comment || prev.comment,
        } : null);
      }
      setProcessing(null);
      setComment('');
    }, 600);
  };

  return (
    <div className="flex gap-5 h-full">
      {/* Left */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">审核流程</h1>
          <p className="text-sm text-gray-500 mt-0.5">物料生命周期各阶段的审批管理</p>
        </div>

        {/* Stat Tabs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'all', label: '全部', count: records.length, color: 'border-gray-300 bg-gray-50 text-gray-700', active: 'border-[#1E293B] bg-[#1E293B] text-white' },
            { key: 'pending', label: '待审核', count: counts.pending, color: 'border-orange-200 bg-orange-50 text-orange-700', active: 'border-orange-500 bg-orange-500 text-white' },
            { key: 'reviewing', label: '审核中', count: counts.reviewing, color: 'border-purple-200 bg-purple-50 text-purple-700', active: 'border-purple-500 bg-purple-500 text-white' },
            { key: 'approved', label: '已通过', count: counts.approved, color: 'border-green-200 bg-green-50 text-green-700', active: 'border-green-500 bg-green-500 text-white' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key as FilterStatus)}
              className={clsx(
                'flex flex-col items-center py-3 rounded-xl border text-center transition-colors cursor-pointer',
                filterStatus === tab.key ? tab.active : `${tab.color} hover:opacity-80`
              )}
            >
              <span className="text-xl font-bold">{tab.count}</span>
              <span className="text-xs mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">类型：</span>
          {(['all', 'new_entry', 'quality_change', 'bom_confirm', 'deprecate'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={clsx(
                'px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer',
                filterType === t ? 'bg-[#1E293B] text-white border-[#1E293B]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
              )}
            >
              {t === 'all' ? '全部类型' : typeLabels[t]}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1">
          <div className="overflow-auto">
            {filtered.map(record => (
              <div
                key={record.id}
                onClick={() => setSelected(record)}
                className={clsx(
                  'flex items-start gap-3 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors',
                  selected?.id === record.id && 'bg-orange-50/50'
                )}
              >
                {/* Priority dot */}
                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColors[record.priority]}`} title={priorityLabels[record.priority]} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{record.materialName}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${typeColors[record.type]}`}>
                      {typeLabels[record.type]}
                    </span>
                    {record.priority === 'high' && (
                      <span className="flex items-center gap-0.5 text-[11px] text-red-600">
                        <AlertTriangle size={11} /> 紧急
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">{record.partNumber}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><User size={11} /> {record.submittedBy}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {record.submittedAt}</span>
                    {record.projectRef && (
                      <span className="flex items-center gap-1"><Package size={11} /> {record.projectRef}</span>
                    )}
                  </div>
                  {record.comment && (
                    <div className="mt-1.5 text-xs text-gray-500 flex items-start gap-1">
                      <MessageSquare size={11} className="flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{record.comment}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={record.status} />
                  {(record.status === 'pending' || record.status === 'reviewing') && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={e => { e.stopPropagation(); handleAction(record.id, 'approve'); }}
                        disabled={!!processing}
                        className="flex items-center gap-1 text-[11px] bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle size={11} /> 通过
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleAction(record.id, 'reject'); }}
                        disabled={!!processing}
                        className="flex items-center gap-1 text-[11px] bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <XCircle size={11} /> 驳回
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <FileCheck size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">没有符合条件的审核记录</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Detail */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{selected.materialName}</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{selected.partNumber}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg">×</button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={selected.status} />
              <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${typeColors[selected.type]}`}>
                {typeLabels[selected.type]}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${selected.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' : selected.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {priorityLabels[selected.priority]}
              </span>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">审核历程</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={11} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-700">提交申请</div>
                    <div className="text-xs text-gray-400">{selected.submittedBy} · {selected.submittedAt}</div>
                  </div>
                </div>
                {(selected.status === 'approved' || selected.status === 'rejected' || selected.status === 'reviewing') && (
                  <div className="flex items-start gap-2.5">
                    <div className={clsx(
                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      selected.status === 'approved' ? 'bg-green-100' : selected.status === 'rejected' ? 'bg-red-100' : 'bg-purple-100'
                    )}>
                      {selected.status === 'approved' ? <CheckCircle size={11} className="text-green-600" /> :
                       selected.status === 'rejected' ? <XCircle size={11} className="text-red-600" /> :
                       <Eye size={11} className="text-purple-600" />}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-700">
                        {selected.status === 'approved' ? '审核通过' : selected.status === 'rejected' ? '已驳回' : '审核中'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {selected.reviewedBy} {selected.reviewedAt && `· ${selected.reviewedAt}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">申请详情</h4>
              {[
                { label: '申请类型', value: typeLabels[selected.type] },
                { label: '关联项目', value: selected.projectRef || '-' },
                { label: '优先级', value: priorityLabels[selected.priority] },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-gray-400">{row.label}</span>
                  <span className="text-gray-700 font-medium">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Comment */}
            {selected.comment && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-500 mb-1.5">备注说明</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{selected.comment}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {(selected.status === 'pending' || selected.status === 'reviewing') && (
            <div className="border-t border-gray-100 p-4 space-y-3">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                placeholder="审核意见（可选）"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] resize-none"
              />
              <div className="flex gap-2">
                {selected.status === 'pending' && (
                  <button
                    onClick={() => handleAction(selected.id, 'review')}
                    disabled={!!processing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Eye size={13} /> 开始审核
                  </button>
                )}
                <button
                  onClick={() => handleAction(selected.id, 'approve')}
                  disabled={!!processing}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={13} /> 审核通过
                </button>
                <button
                  onClick={() => handleAction(selected.id, 'reject')}
                  disabled={!!processing}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <XCircle size={13} /> 驳回
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
