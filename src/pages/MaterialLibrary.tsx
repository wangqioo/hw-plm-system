import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, ChevronRight, Star, ExternalLink, ArrowUpDown, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { materialsApi } from '../api/materials';
import type { Material } from '../api/materials';
import { QualityBadge, StatusBadge } from '../components/Badge';

const CATEGORY_LABELS: Record<string, string> = {
  ic_mcu: '主控芯片',
  ic_power: '电源管理',
  ic_driver: '驱动芯片',
  passive_r: '电阻',
  passive_c: '电容',
  passive_l: '电感',
  connector: '连接器',
  sensor: '传感器',
  module: '模组',
  mechanical: '结构件',
  other: '其他',
};

const CATEGORIES = ['all', ...Object.keys(CATEGORY_LABELS)];

export default function MaterialLibrary() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedQuality, setSelectedQuality] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selected, setSelected] = useState<Material | null>(null);
  const [sortBy, setSortBy] = useState('preferred_rank');

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await materialsApi.list({
        search: search || undefined,
        category: selectedCat !== 'all' ? selectedCat : undefined,
        quality_level: selectedQuality !== 'all' ? selectedQuality : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        sort_by: sortBy,
        page_size: 200,
      });
      setMaterials(res.data.items);
      setTotal(res.data.total);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCat, selectedQuality, selectedStatus, sortBy]);

  useEffect(() => {
    const timer = setTimeout(fetchMaterials, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchMaterials, search]);

  return (
    <div className="flex gap-5 h-full">
      {/* Left Panel */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">物料库</h1>
            <p className="text-sm text-gray-500 mt-0.5">共 {total} 条物料</p>
          </div>
          <Link
            to="/entry"
            className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            新增物料
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索物料名称、料号、厂商..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/20"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-gray-400" />
              <span className="text-xs text-gray-500">筛选:</span>
            </div>
            <select
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="all">全部类别</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={selectedQuality}
              onChange={e => setSelectedQuality(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="all">全部等级</option>
              <option value="A">A级 优选</option>
              <option value="B">B级 备选</option>
              <option value="C">C级 限制</option>
              <option value="D">D级 禁用</option>
            </select>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="active">在用</option>
              <option value="pending">待审</option>
              <option value="deprecated">停用</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="preferred_rank">优选排名</option>
              <option value="quality_level">质量等级</option>
              <option value="name">名称</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={clsx(
                  'px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer',
                  selectedCat === cat
                    ? 'bg-[#1E293B] text-white border-[#1E293B]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                )}
              >
                {cat === 'all' ? '全部' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700" onClick={() => setSortBy('preferred_rank')}>
                        排名 <ArrowUpDown size={11} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">物料信息</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">类别</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">质量等级</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">库存</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">单价</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {materials.map(m => (
                    <tr
                      key={m.id}
                      onClick={() => setSelected(m)}
                      className={clsx(
                        'hover:bg-orange-50/40 cursor-pointer transition-colors',
                        selected?.id === m.id && 'bg-orange-50/60',
                        m.status === 'deprecated' && 'opacity-60'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {m.preferred_rank <= 1 && <Star size={13} className="text-yellow-400 fill-yellow-400" />}
                          <span className="text-xs font-mono text-gray-500">#{m.preferred_rank}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{m.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono">{m.part_number}</span>
                          <span className="text-gray-300">·</span>
                          <span>{m.manufacturer} {m.manufacturer_pn}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {CATEGORY_LABELS[m.category] || m.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <QualityBadge level={m.quality_level} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {m.stock?.toLocaleString() ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {m.unit_price != null ? `¥${m.unit_price}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(m); }}
                          className="text-xs text-[#F97316] hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          详情 <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {materials.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                        未找到匹配的物料
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-auto">
          <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{selected.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{selected.part_number}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none">×</button>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <QualityBadge level={selected.quality_level} />
              <StatusBadge status={selected.status} />
              {selected.preferred_rank <= 1 && (
                <span className="flex items-center gap-1 text-[11px] text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" /> 优先推荐
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">基本信息</h4>
              {[
                { label: '厂商', value: selected.manufacturer },
                { label: '厂商料号', value: selected.manufacturer_pn },
                { label: '类别', value: CATEGORY_LABELS[selected.category] || selected.category },
                { label: '优选排名', value: `#${selected.preferred_rank}` },
                { label: '单价', value: selected.unit_price != null ? `¥${selected.unit_price}` : '-' },
                { label: '库存', value: selected.stock?.toLocaleString() ?? '-' },
                { label: '货期', value: selected.lead_time_days ? `${selected.lead_time_days} 天` : '-' },
                { label: '创建人', value: selected.creator_name || '-' },
                { label: '创建时间', value: selected.created_at ? new Date(selected.created_at).toLocaleDateString('zh-CN') : '-' },
                { label: '更新时间', value: selected.updated_at ? new Date(selected.updated_at).toLocaleDateString('zh-CN') : '-' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start text-xs gap-2">
                  <span className="text-gray-400 flex-shrink-0">{row.label}</span>
                  <span className="text-gray-700 font-medium text-right">{row.value}</span>
                </div>
              ))}
            </div>

            {selected.parameters && selected.parameters.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">核心参数</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  {selected.parameters.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-500">{p.key}</span>
                      <span className="font-mono font-medium text-gray-700">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.description && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">描述</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{selected.description}</p>
              </div>
            )}

            {selected.notes && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-700 font-medium">注意</p>
                <p className="text-xs text-red-600 mt-1">{selected.notes}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {selected.datasheet_url ? (
                <a
                  href={selected.datasheet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#F97316] text-white py-2 rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} />
                  查看数据手册
                </a>
              ) : (
                <button disabled className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-2 rounded-lg text-xs font-medium cursor-not-allowed">
                  <ExternalLink size={13} />
                  暂无数据手册
                </button>
              )}
              <Link
                to="/quality"
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                提交质量反馈
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
