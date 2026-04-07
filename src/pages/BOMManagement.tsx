import { useState } from 'react';
import { clsx } from 'clsx';
import {
  CheckCircle, AlertCircle, Download, ChevronDown,
  Package, Cpu, User, Calendar, ArrowRight, Search,
  FileText, CheckCheck
} from 'lucide-react';
import { projects } from '../data/mockData';
import type { BOMItem, Project } from '../types';
import { QualityBadge, StatusBadge } from '../components/Badge';

const stageConfig: Record<Project['stage'], { label: string; step: number; color: string }> = {
  schematic: { label: '原理图阶段', step: 1, color: 'bg-blue-500' },
  layout: { label: 'PCB布局阶段', step: 2, color: 'bg-purple-500' },
  prototype: { label: '样机验证', step: 3, color: 'bg-yellow-500' },
  pilot: { label: '小批量试产', step: 4, color: 'bg-orange-500' },
  mass_production: { label: '量产', step: 5, color: 'bg-green-500' },
};
const stages: Project['stage'][] = ['schematic', 'layout', 'prototype', 'pilot', 'mass_production'];

export default function BOMManagement() {
  const [selectedProject, setSelectedProject] = useState<Project>(projects[0]);
  const [searchBom, setSearchBom] = useState('');
  const [confirmedItems, setConfirmedItems] = useState<Record<string, boolean>>({});
  const [allConfirmed, setAllConfirmed] = useState(false);

  const bomItems = selectedProject.bomItems.filter(b => {
    if (!searchBom) return true;
    const q = searchBom.toLowerCase();
    return b.material.name.toLowerCase().includes(q) ||
      b.material.partNumber.toLowerCase().includes(q) ||
      b.designator.toLowerCase().includes(q);
  });

  const confirmedCount = bomItems.filter(b =>
    b.confirmedBy || confirmedItems[b.id]
  ).length;

  const handleConfirmItem = (id: string) => {
    setConfirmedItems(prev => ({ ...prev, [id]: true }));
  };

  const handleConfirmAll = () => {
    const newConfirmed: Record<string, boolean> = {};
    bomItems.forEach(b => { newConfirmed[b.id] = true; });
    setConfirmedItems(newConfirmed);
    setAllConfirmed(true);
  };

  const stage = stageConfig[selectedProject.stage];
  const currentStepIndex = stages.indexOf(selectedProject.stage);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">BOM 管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">项目物料清单审核与量产确认</p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(p => {
          const s = stageConfig[p.stage];
          const unconfirmed = p.bomItems.filter(b => !b.confirmedBy).length;
          return (
            <button
              key={p.id}
              onClick={() => { setSelectedProject(p); setConfirmedItems({}); setAllConfirmed(false); }}
              className={clsx(
                'text-left bg-white rounded-xl border p-4 transition-all cursor-pointer',
                selectedProject.id === p.id
                  ? 'border-[#F97316] ring-2 ring-[#F97316]/20 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{p.code}</div>
                </div>
                <span className={`text-xs font-medium text-white px-2 py-0.5 rounded ${s.color}`}>
                  {s.label}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><User size={11} /> {p.manager}</span>
                <span className="flex items-center gap-1"><Package size={11} /> {p.bomItems.length} 项物料</span>
                {unconfirmed > 0 && (
                  <span className="flex items-center gap-1 text-orange-500">
                    <AlertCircle size={11} /> {unconfirmed} 项待确认
                  </span>
                )}
                {unconfirmed === 0 && (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle size={11} /> 全部已确认
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Cpu size={15} className="text-[#F97316]" />
          项目阶段：{selectedProject.name}
        </h3>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {stages.map((s, i) => {
            const cfg = stageConfig[s];
            const isPast = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div key={s} className="flex items-center">
                <div className={clsx(
                  'flex flex-col items-center gap-1.5 px-3',
                )}>
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                    isPast ? 'bg-green-500 border-green-500 text-white' :
                    isCurrent ? `${cfg.color} border-transparent text-white shadow-lg` :
                    'bg-white border-gray-200 text-gray-400'
                  )}>
                    {isPast ? <CheckCircle size={14} /> : cfg.step}
                  </div>
                  <span className={clsx(
                    'text-[10px] text-center leading-tight whitespace-nowrap',
                    isCurrent ? 'text-gray-900 font-semibold' : 'text-gray-400'
                  )}>
                    {cfg.label}
                  </span>
                </div>
                {i < stages.length - 1 && (
                  <div className={clsx(
                    'w-12 h-0.5 flex-shrink-0 mb-5',
                    isPast ? 'bg-green-400' : 'bg-gray-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOM Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">BOM 清单</span>
            <span className="text-xs text-gray-400">共 {selectedProject.bomItems.length} 项</span>
            {confirmedCount > 0 && (
              <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                {confirmedCount}/{bomItems.length} 已确认
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchBom}
                onChange={e => setSearchBom(e.target.value)}
                placeholder="搜索位号/物料"
                className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] w-40"
              />
            </div>
            <button
              onClick={handleConfirmAll}
              disabled={allConfirmed || bomItems.every(b => b.confirmedBy || confirmedItems[b.id])}
              className="flex items-center gap-1.5 text-xs bg-[#F97316] text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <CheckCheck size={13} />
              全部确认
            </button>
            <button className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Download size={13} />
              导出 BOM
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">位号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">物料</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">数量</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">质量等级</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">确认状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bomItems.map(item => {
                const isConfirmed = item.confirmedBy || confirmedItems[item.id];
                const hasIssue = item.material.status === 'deprecated' || item.material.qualityLevel === 'C' || item.material.qualityLevel === 'D';
                return (
                  <tr
                    key={item.id}
                    className={clsx(
                      'hover:bg-gray-50 transition-colors',
                      item.dnp && 'opacity-50',
                      hasIssue && 'bg-red-50/30'
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {item.designator}
                      </span>
                      {item.dnp && (
                        <span className="ml-2 text-[10px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">DNP</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        {hasIssue && <AlertCircle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />}
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{item.material.name}</div>
                          <div className="text-xs text-gray-400 font-mono">{item.material.partNumber}</div>
                          <div className="text-xs text-gray-400">{item.material.manufacturer} {item.material.manufacturerPN}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-700">{item.quantity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <QualityBadge level={item.material.qualityLevel} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.material.status} />
                    </td>
                    <td className="px-4 py-3">
                      {isConfirmed ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-600">
                          <CheckCircle size={13} />
                          <span>{item.confirmedBy || '张工'}</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-orange-500">
                          <AlertCircle size={13} />
                          待确认
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!isConfirmed && (
                        <button
                          onClick={() => handleConfirmItem(item.id)}
                          className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2.5 py-1 rounded cursor-pointer transition-colors"
                        >
                          确认
                        </button>
                      )}
                      {hasIssue && (
                        <span className="text-[11px] ml-1 text-orange-500">需关注</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BOM Summary */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>总价值估算：
                <strong className="text-gray-900 ml-1">
                  ¥{selectedProject.bomItems.reduce((sum, b) => {
                    return sum + (b.material.unitPrice ?? 0) * b.quantity;
                  }, 0).toFixed(2)}
                </strong>
              </span>
              <span>·</span>
              <span>停用物料：
                <strong className={clsx('ml-1', selectedProject.bomItems.filter(b => b.material.status === 'deprecated').length > 0 ? 'text-red-500' : 'text-gray-900')}>
                  {selectedProject.bomItems.filter(b => b.material.status === 'deprecated').length} 项
                </strong>
              </span>
              <span>·</span>
              <span>C/D级物料：
                <strong className={clsx('ml-1', selectedProject.bomItems.filter(b => ['C', 'D'].includes(b.material.qualityLevel)).length > 0 ? 'text-orange-500' : 'text-gray-900')}>
                  {selectedProject.bomItems.filter(b => ['C', 'D'].includes(b.material.qualityLevel)).length} 项
                </strong>
              </span>
            </div>
            <button
              disabled={confirmedCount < bomItems.length && !allConfirmed}
              className="flex items-center gap-2 text-xs bg-[#1E293B] text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ArrowRight size={13} />
              提交量产确认
            </button>
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      {selectedProject.bomItems.some(b => b.material.status === 'deprecated' || ['C','D'].includes(b.material.qualityLevel)) && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-orange-800">BOM 风险提示</h4>
              <div className="mt-2 space-y-1">
                {selectedProject.bomItems.filter(b => b.material.status === 'deprecated').map(b => (
                  <p key={b.id} className="text-xs text-orange-700">
                    · <strong>{b.designator}</strong> ({b.material.name}) 已被标记为停用，建议替换为同类可用物料
                  </p>
                ))}
                {selectedProject.bomItems.filter(b => b.material.qualityLevel === 'C').map(b => (
                  <p key={b.id} className="text-xs text-orange-700">
                    · <strong>{b.designator}</strong> ({b.material.name}) 为C级限制使用物料，需经质量负责人批准
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
