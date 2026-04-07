import { useState } from 'react';
import {
  Upload, Sparkles, FileText, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Plus, Trash2, Loader2, RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';
import { categoryLabels } from '../data/mockData';
import type { MaterialCategory } from '../types';

type AiState = 'idle' | 'extracting' | 'done' | 'error';

const DEMO_EXTRACTED = {
  name: 'STM32G431CBU6 微控制器',
  category: 'ic_mcu' as MaterialCategory,
  manufacturer: 'ST',
  manufacturerPN: 'STM32G431CBU6',
  description: 'ARM Cortex-M4, 170MHz, 128KB Flash, 32KB RAM, UFQFPN-48',
  parameters: [
    { key: '内核', value: 'ARM Cortex-M4' },
    { key: '主频', value: '170MHz' },
    { key: 'Flash', value: '128KB' },
    { key: 'RAM', value: '32KB' },
    { key: '封装', value: 'UFQFPN-48' },
    { key: '工作电压', value: '1.71~3.6V' },
    { key: '工作温度', value: '-40~+85°C' },
    { key: 'ADC', value: '12-bit, 4通道' },
    { key: 'DAC', value: '12-bit, 3通道' },
    { key: 'UART', value: '3路' },
    { key: 'SPI', value: '3路' },
    { key: 'I2C', value: '2路' },
    { key: 'CAN', value: 'FDCAN x1' },
    { key: 'USB', value: 'USB 2.0 FS' },
  ],
};

interface Param { key: string; value: string }

export default function MaterialEntry() {
  const [aiState, setAiState] = useState<AiState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [form, setForm] = useState({
    name: '',
    partNumber: '',
    category: '' as MaterialCategory | '',
    manufacturer: '',
    manufacturerPN: '',
    description: '',
    qualityLevel: 'B',
    preferredRank: '2',
    unitPrice: '',
    leadTime: '',
    notes: '',
  });
  const [params, setParams] = useState<Param[]>([{ key: '', value: '' }]);
  const [submitted, setSubmitted] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setFileName(file.name); triggerExtract(); }
  };

  const triggerExtract = () => {
    setAiState('extracting');
    setTimeout(() => {
      const d = DEMO_EXTRACTED;
      setForm(f => ({
        ...f,
        name: d.name,
        category: d.category,
        manufacturer: d.manufacturer,
        manufacturerPN: d.manufacturerPN,
        description: d.description,
      }));
      setParams(d.parameters);
      setAiState('done');
      setStep(2);
    }, 2800);
  };

  const addParam = () => setParams(p => [...p, { key: '', value: '' }]);
  const removeParam = (i: number) => setParams(p => p.filter((_, idx) => idx !== i));
  const updateParam = (i: number, field: 'key' | 'value', val: string) =>
    setParams(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
    setSubmitted(true);
  };

  const reset = () => {
    setAiState('idle');
    setFileName('');
    setStep(1);
    setSubmitted(false);
    setForm({ name: '', partNumber: '', category: '', manufacturer: '', manufacturerPN: '', description: '', qualityLevel: 'B', preferredRank: '2', unitPrice: '', leadTime: '', notes: '' });
    setParams([{ key: '', value: '' }]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">物料录入</h1>
        <p className="text-sm text-gray-500 mt-0.5">上传数据手册，AI自动提取核心参数，工程师人工审核确认</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-0">
        {[
          { n: 1, label: '上传数据手册' },
          { n: 2, label: '填写/确认参数' },
          { n: 3, label: '提交审核' },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center">
            <div className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              step === n ? 'bg-[#F97316] text-white' :
              step > n ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-400'
            )}>
              {step > n ? <CheckCircle size={15} /> : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">{n}</span>}
              {label}
            </div>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 3 Success */}
      {submitted && (
        <div className="bg-white rounded-xl border border-green-300 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">提交成功！</h2>
          <p className="text-sm text-gray-500 mt-2">物料 <strong>{form.name}</strong> 已提交至审核流程</p>
          <p className="text-xs text-gray-400 mt-1">审核工程师将在1-2个工作日内完成审核，请关注消息通知</p>
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={reset}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <RotateCcw size={14} />
              继续录入
            </button>
            <button className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 cursor-pointer transition-colors">
              查看审核进度
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {!submitted && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-[#F97316]" />
            第一步：上传元器件数据手册（Datasheet）
          </h2>

          <div
            className={clsx(
              'border-2 border-dashed rounded-xl p-8 text-center transition-all',
              dragOver ? 'border-[#F97316] bg-orange-50' :
              aiState === 'done' ? 'border-green-300 bg-green-50' :
              'border-gray-200 hover:border-gray-300'
            )}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {aiState === 'extracting' ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={36} className="text-[#F97316] animate-spin" />
                <div>
                  <p className="text-sm font-medium text-gray-700">AI 正在提取参数...</p>
                  <p className="text-xs text-gray-400 mt-1">正在解析数据手册，识别核心技术规格</p>
                </div>
                <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-[#F97316] rounded-full animate-pulse" style={{ width: '65%' }} />
                </div>
              </div>
            ) : aiState === 'done' ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={36} className="text-green-500" />
                <p className="text-sm font-medium text-gray-700">解析完成！已提取 {DEMO_EXTRACTED.parameters.length} 项参数</p>
                <p className="text-xs text-gray-400">{fileName || 'STM32G431CBU6_datasheet.pdf'}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={36} className="text-gray-300" />
                <div>
                  <p className="text-sm font-medium text-gray-700">拖拽 PDF 数据手册到此处</p>
                  <p className="text-xs text-gray-400 mt-1">支持 PDF、Word、TXT 格式</p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setFileName(f.name); triggerExtract(); }
                    }}
                  />
                  <span className="inline-flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                    <Upload size={14} />
                    选择文件
                  </span>
                </label>
              </div>
            )}
          </div>

          {aiState === 'idle' && (
            <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Sparkles size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                <strong>AI 辅助提取：</strong>上传数据手册后，AI 将自动识别电气参数、封装信息、工作条件等核心规格，
                工程师只需对提取结果进行审核确认，大幅提升录入效率。
              </p>
            </div>
          )}

          {aiState === 'idle' && (
            <div className="mt-3">
              <button
                onClick={() => { setFileName('Demo_Datasheet.pdf'); triggerExtract(); }}
                className="text-xs text-[#F97316] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Sparkles size={12} /> 演示：使用示例数据手册
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Form */}
      {!submitted && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles size={16} className="text-[#F97316]" />
                第二步：确认/填写物料信息
              </h2>
              {aiState === 'done' && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded">
                  <CheckCircle size={12} /> AI已预填充
                </span>
              )}
              {aiState === 'idle' && (
                <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded">
                  <AlertCircle size={12} /> 请上传手册或手动填写
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">物料名称 *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/20"
                  placeholder="如：STM32F103C8T6 微控制器"
                />
              </div>
              {/* Part Number */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">内部料号</label>
                <input
                  value={form.partNumber}
                  onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316]"
                  placeholder="自动生成或手动填写"
                />
              </div>
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">物料类别 *</label>
                <select
                  required
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as MaterialCategory }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] cursor-pointer"
                >
                  <option value="">请选择类别</option>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {/* Manufacturer */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">制造商 *</label>
                <input
                  required
                  value={form.manufacturer}
                  onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316]"
                  placeholder="如：ST、TDK、村田"
                />
              </div>
              {/* MPN */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">制造商型号（MPN）*</label>
                <input
                  required
                  value={form.manufacturerPN}
                  onChange={e => setForm(f => ({ ...f, manufacturerPN: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316]"
                  placeholder="如：STM32F103C8T6"
                />
              </div>
              {/* Quality Level */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">质量等级</label>
                <select
                  value={form.qualityLevel}
                  onChange={e => setForm(f => ({ ...f, qualityLevel: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] cursor-pointer"
                >
                  <option value="A">A级 - 优选</option>
                  <option value="B">B级 - 备选</option>
                  <option value="C">C级 - 限制使用</option>
                  <option value="D">D级 - 禁止使用</option>
                </select>
              </div>
              {/* Preferred Rank */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">优选排名</label>
                <input
                  type="number"
                  min="1"
                  value={form.preferredRank}
                  onChange={e => setForm(f => ({ ...f, preferredRank: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316]"
                  placeholder="1 = 首选"
                />
              </div>
              {/* Unit Price */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">单价（元）</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.unitPrice}
                  onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316]"
                  placeholder="0.00"
                />
              </div>
              {/* Lead Time */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">货期（天）</label>
                <input
                  type="number"
                  value={form.leadTime}
                  onChange={e => setForm(f => ({ ...f, leadTime: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316]"
                  placeholder="14"
                />
              </div>
              {/* Description */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">描述</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] resize-none"
                  placeholder="物料简要描述"
                />
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">核心技术参数</h3>
              <button
                type="button"
                onClick={addParam}
                className="flex items-center gap-1 text-xs text-[#F97316] hover:underline cursor-pointer"
              >
                <Plus size={13} /> 添加参数
              </button>
            </div>
            <div className="space-y-2">
              {params.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={p.key}
                    onChange={e => updateParam(i, 'key', e.target.value)}
                    placeholder="参数名"
                    className="w-1/3 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316]"
                  />
                  <input
                    value={p.value}
                    onChange={e => updateParam(i, 'value', e.target.value)}
                    placeholder="参数值"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316]"
                  />
                  <button
                    type="button"
                    onClick={() => removeParam(i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">备注 / 工程师说明</h3>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F97316] resize-none"
              placeholder="填写使用注意事项、替代物料建议、测试备注等..."
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400">
              提交后将进入审核流程，审核通过后正式入库
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                重置
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm bg-[#F97316] text-white rounded-lg hover:bg-orange-600 cursor-pointer transition-colors font-medium"
              >
                提交审核
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
