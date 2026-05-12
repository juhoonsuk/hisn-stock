/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  ClipboardList, 
  Search, 
  Plus, 
  X, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Maximize2,
  Tag,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryEntry, EntryType, Stats } from './types';
import { SEED_STOCK, LS_KEY_STOCK } from './constants';

export default function App() {
  // State
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [currentTab, setCurrentTab] = useState<EntryType>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [surfaceFilter, setSurfaceFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    model: '',
    colorNo: '',
    surface: '哑面',
    size: '300*600',
    brand: 'MITO',
    area: 1.44,
    boxes: 0,
    memo: ''
  });

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY_STOCK);
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      setEntries(SEED_STOCK);
    }
    setLastUpdate(new Date().toLocaleString('ko-KR'));
  }, []);

  // Save Data
  const saveToLocal = (newEntries: InventoryEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(LS_KEY_STOCK, JSON.stringify(newEntries));
    setLastUpdate(new Date().toLocaleString('ko-KR'));
  };

  // Derived Data
  const stats: Stats = useMemo(() => {
    const src = entries.filter(e => e.type === currentTab);
    return {
      totalBoxes: src.reduce((acc, curr) => acc + curr.boxes, 0),
      totalM2: src.reduce((acc, curr) => acc + (curr.boxes * curr.area), 0),
      kinds: new Set(src.map(e => `${e.model}-${e.colorNo}`)).size,
      lowStock: entries.filter(e => e.type === 'stock' && e.boxes <= 100).length
    };
  }, [entries, currentTab]);

  const filteredEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return entries
      .filter(e => e.type === currentTab)
      .filter(e => {
        const matchesSearch = !q || 
          e.model.toLowerCase().includes(q) || 
          e.colorNo.includes(q) || 
          e.memo.toLowerCase().includes(q);
        const matchesSurface = !surfaceFilter || e.surface === surfaceFilter;
        const matchesColor = !colorFilter || e.colorNo === colorFilter;
        return matchesSearch && matchesSurface && matchesColor;
      })
      .sort((a, b) => b.id - a.id);
  }, [entries, currentTab, searchTerm, surfaceFilter, colorFilter]);

  const colorOptions = useMemo(() => {
    const src = entries.filter(e => e.type === currentTab);
    return Array.from(new Set(src.map(e => e.colorNo))).sort();
  }, [entries, currentTab]);

  // Actions
  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
      model: '',
      colorNo: '',
      surface: '哑面',
      size: '300*600',
      brand: 'MITO',
      area: 1.44,
      boxes: 0,
      memo: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: InventoryEntry) => {
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      model: entry.model,
      colorNo: entry.colorNo,
      surface: entry.surface,
      size: entry.size,
      brand: entry.brand,
      area: entry.area,
      boxes: entry.boxes,
      memo: entry.memo
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.model || !formData.colorNo || formData.boxes <= 0) {
      alert('품번, 색호, 수량을 정확히 입력하세요.');
      return;
    }

    let newEntries: InventoryEntry[];
    if (editingId !== null) {
      newEntries = entries.map(e => e.id === editingId ? { ...e, ...formData } : e);
    } else {
      const nextId = Math.max(0, ...entries.map(e => e.id)) + 1;
      newEntries = [{
        ...formData,
        id: nextId,
        type: currentTab
      }, ...entries];
    }
    
    saveToLocal(newEntries);
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('삭제하시겠습니까?')) {
      const newEntries = entries.filter(e => e.id !== id);
      saveToLocal(newEntries);
    }
  };

  const handleConfirmReceive = (entry: InventoryEntry) => {
    if (window.confirm(`입고 확인: ${entry.model} ${entry.boxes}BOX를 재고로 이동합니까?`)) {
      const newEntries = entries.map(e => 
        e.id === entry.id ? { ...e, type: 'stock' as EntryType, date: new Date().toISOString().slice(0, 10).replace(/-/g, '/') } : e
      );
      saveToLocal(newEntries);
    }
  };

  return (
    <div className="min-h-screen pb-12 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 md:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold tracking-tight">MITO 库存联合利华 <span className="text-[var(--text2)] font-normal ml-1">재고장</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-[var(--text3)]" />
              <p className="text-[10px] text-[var(--text2)]">{lastUpdate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button 
              onClick={openAddModal}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--text)] text-[var(--bg)] rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {currentTab === 'stock' ? '입고 등록/入库' : '발주 등록/订购'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="총 수량 / 总数" value={stats.totalBoxes} unit="BOX" icon={<Package className="w-4 h-4 text-blue-500" />} />
          <StatCard label="총 면적 / 面积" value={Math.round(stats.totalM2)} unit="㎡" icon={<Maximize2 className="w-4 h-4 text-emerald-500" />} />
          <StatCard label="품목 수 / 品种" value={stats.kinds} unit="종류" icon={<Layers className="w-4 h-4 text-amber-500" />} />
          <StatCard 
            label="부족 재고 / 缺货" 
            value={stats.lowStock} 
            unit="100박스 이하" 
            icon={<AlertCircle className="w-4 h-4 text-rose-500" />} 
            isWarning={stats.lowStock > 0 && currentTab === 'stock'}
          />
        </div>

        {/* Tabs & Filters */}
        <div className="space-y-4">
          <div className="flex items-center p-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl w-fit">
            <button 
              onClick={() => setCurrentTab('stock')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-semibold transition-all ${currentTab === 'stock' ? 'bg-[var(--text)] text-[var(--bg)] shadow-md' : 'text-[var(--text2)] hover:bg-[var(--bg2)]'}`}
            >
              <Package className="w-4 h-4" />
              재고현황 / 库存
            </button>
            <button 
              onClick={() => setCurrentTab('order')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-semibold transition-all ${currentTab === 'order' ? 'bg-[var(--text)] text-[var(--bg)] shadow-md' : 'text-[var(--text2)] hover:bg-[var(--bg2)]'}`}
            >
              <ClipboardList className="w-4 h-4" />
              발주현황 / 订单
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)] group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="모델명, 색호, 메모 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[var(--text3)]"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={surfaceFilter}
                onChange={(e) => setSurfaceFilter(e.target.value)}
                className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all"
              >
                <option value="">전체 표면</option>
                <option value="亮光">亮光 (유광)</option>
                <option value="哑面">哑面 (무광)</option>
              </select>
              <select 
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all"
              >
                <option value="">전체 색호</option>
                {colorOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          {/* Mobile Cards (shown on small screens) */}
          <div className="grid grid-cols-1 md:hidden gap-4">
             {filteredEntries.map(entry => (
                <InventoryCard 
                  key={entry.id} 
                  entry={entry} 
                  onEdit={() => openEditModal(entry)}
                  onDelete={() => handleDelete(entry.id)}
                  onConfirm={() => handleConfirmReceive(entry)}
                />
             ))}
             {filteredEntries.length === 0 && <EmptyState />}
          </div>

          {/* Desktop Table (shown on medium+ screens) */}
          <div className="hidden md:block overflow-hidden bg-[var(--bg)] rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg2)] text-[var(--text2)] text-[10px] uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3">생산일/품번</th>
                    <th className="px-4 py-3">표면/사이즈</th>
                    <th className="px-4 py-3">색호</th>
                    <th className="px-4 py-3 text-right">수량 (BOX)</th>
                    <th className="px-4 py-3 text-right">합계 (㎡)</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-[var(--bg2)]/50 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[var(--text3)] mb-0.5">{entry.date}</span>
                          <span className="text-sm font-bold">{entry.model}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs">{entry.surface === '亮光' ? '유광(亮光)' : '무광(哑面)'}</span>
                          <span className="text-[10px] text-[var(--text2)]">{entry.size}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 bg-[var(--bg2)] rounded text-[11px] font-mono font-medium">#{entry.colorNo}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-sm font-bold ${entry.type === 'stock' && entry.boxes <= 100 ? 'text-red-500' : ''}`}>
                          {entry.boxes.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-xs text-[var(--text2)] font-medium">{(entry.boxes * entry.area).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge type={entry.type} boxes={entry.boxes} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {entry.type === 'order' && (
                            <button 
                              onClick={() => handleConfirmReceive(entry)}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="입고 완료"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => openEditModal(entry)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredEntries.length === 0 && <EmptyState />}
          </div>
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--bg)] rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="text-base font-bold">
                  {editingId ? '기록 수정 / 编辑' : currentTab === 'stock' ? '입고 등록 / 入库登记' : '발주 등록 / 订单添加'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--bg2)] rounded-full transition-colors">
                  <X className="w-5 h-5 text-[var(--text2)]" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[var(--text2)] uppercase flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> 날짜 / 生产时间
                    </label>
                    <input 
                      type="date" 
                      value={formData.date.replace(/\//g, '-')}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value.replace(/-/g, '/') })}
                      className="w-full bg-[var(--bg2)] px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[var(--text2)] uppercase flex items-center gap-1.5">
                      <Tag className="w-3 h-3" /> 모델명 / 型号
                    </label>
                    <input 
                      type="text" 
                      placeholder="ABD1045"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value.toUpperCase() })}
                      className="w-full bg-[var(--bg2)] px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[var(--text2)] uppercase flex items-center gap-1.5">
                      <Layers className="w-3 h-3" /> 표면 / 表面
                    </label>
                    <select 
                      value={formData.surface}
                      onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                      className="w-full bg-[var(--bg2)] px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="亮光">亮光 (유광)</option>
                      <option value="哑面">哑面 (무광)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[var(--text2)] uppercase flex items-center gap-1.5">
                      <Maximize2 className="w-3 h-3" /> 사이즈 / 尺寸
                    </label>
                    <input 
                      type="text" 
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full bg-[var(--bg2)] px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                 <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[var(--text2)] uppercase flex items-center gap-1.5">
                       색호 / 色号
                    </label>
                    <input 
                      type="text" 
                      placeholder="03"
                      value={formData.colorNo}
                      onChange={(e) => setFormData({ ...formData, colorNo: e.target.value })}
                      className="w-full bg-[var(--bg2)] px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[var(--text2)] uppercase flex items-center gap-1.5">
                      브랜드 / 品牌
                    </label>
                    <input 
                      type="text" 
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-[var(--bg2)] px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[var(--text2)] uppercase flex items-center gap-1.5">
                      박스당 면적 (㎡)
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) })}
                      className="w-full bg-[var(--bg2)] px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[var(--text2)] uppercase flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                      수량 (BOX) *
                    </label>
                    <input 
                      type="number" 
                      value={formData.boxes || ''}
                      onChange={(e) => setFormData({ ...formData, boxes: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[var(--bg2)] px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[var(--text2)] uppercase flex items-center gap-1.5">
                    비고 / 备注
                  </label>
                  <textarea 
                    rows={2}
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    className="w-full bg-[var(--bg2)] px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    placeholder="특이사항 입력..."
                  />
                </div>
              </div>

              <div className="p-6 bg-[var(--bg2)]/50 border-t border-[var(--border)] flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl text-xs font-bold text-[var(--text2)] hover:bg-[var(--border)] transition-colors"
                >
                  취소 / 取消
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-[var(--text)] text-[var(--bg)] rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-lg active:scale-[0.98]"
                >
                  저장하기 / 保存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponents
function StatCard({ label, value, unit, icon, isWarning = false }: { label: string, value: number, unit: string, icon: React.ReactNode, isWarning?: boolean }) {
  return (
    <div className={`bg-[var(--bg)] border border-[var(--border)] p-4 rounded-2xl shadow-sm space-y-2 transition-all ${isWarning ? 'animate-pulse bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900' : ''}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isWarning ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text2)]'}`}>{label}</span>
        <div className={`p-1.5 rounded-lg ${isWarning ? 'bg-rose-100 dark:bg-rose-900/40' : 'bg-[var(--bg2)]'}`}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-xl md:text-2xl font-black ${isWarning ? 'text-rose-600 dark:text-rose-400' : ''}`}>{value.toLocaleString()}</span>
        <span className={`text-[10px] font-semibold ${isWarning ? 'text-rose-500 dark:text-rose-500' : 'text-[var(--text3)]'}`}>{unit}</span>
      </div>
    </div>
  );
}

function StatusBadge({ type, boxes }: { type: EntryType, boxes: number }) {
  if (type === 'order') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--blue-bg)] text-[var(--blue-text)] rounded-full text-[10px] font-bold">
        <Clock className="w-3 h-3" /> 발주중 / 订购
      </span>
    );
  }
  if (boxes <= 100) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--red-bg)] text-[var(--red-text)] rounded-full text-[10px] font-bold">
        <AlertCircle className="w-3 h-3" /> 부족 / 缺货
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--green-bg)] text-[var(--green-text)] rounded-full text-[10px] font-bold">
      <CheckCircle2 className="w-3 h-3" /> 양호 / 正常
    </span>
  );
}

function InventoryCard({ entry, onEdit, onDelete, onConfirm }: { entry: InventoryEntry, onEdit: () => void, onDelete: () => void, onConfirm: () => void }) {
  const sqm = (entry.boxes * entry.area).toFixed(2);
  const progress = Math.min(100, Math.round((entry.boxes / 2000) * 100));
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-4 hover:border-[var(--border2)] transition-colors overflow-hidden relative ${entry.type === 'stock' && entry.boxes <= 100 ? 'border-l-4 border-l-rose-500' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black">{entry.model}</h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--bg2)] rounded font-medium text-[var(--text2)]">#{entry.colorNo}</span>
          </div>
          <p className="text-[10px] text-[var(--text2)] leading-tight">
            {entry.surface}({entry.surface === '亮光' ? '유광' : '무광'}) • {entry.size} • {entry.brand}<br/>
            {entry.date} {entry.memo && `• ${entry.memo}`}
          </p>
        </div>
        <StatusBadge type={entry.type} boxes={entry.boxes} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold text-[var(--text3)] uppercase">박스수 / 箱数</div>
          <div className={`text-base font-black ${entry.type === 'stock' && entry.boxes <= 100 ? 'text-rose-500' : ''}`}>
            {entry.boxes.toLocaleString()} <span className="text-[10px] font-normal text-[var(--text3)] ml-0.5">BOX</span>
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold text-[var(--text3)] uppercase">면적 / 面积</div>
          <div className="text-base font-black">
            {parseFloat(sqm).toLocaleString()} <span className="text-[10px] font-normal text-[var(--text3)] ml-0.5">㎡</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text3)]">
          <span>재고 상태</span>
          <span>{entry.boxes} / 2000 BOX</span>
        </div>
        <div className="h-1.5 w-full bg-[var(--bg2)] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full rounded-full ${entry.boxes <= 100 ? 'bg-rose-500' : entry.boxes <= 400 ? 'bg-amber-500' : 'bg-emerald-500'}`}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
        {entry.type === 'order' && (
          <button 
            onClick={onConfirm}
            className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm active:scale-95 transition-all"
          >
            입고확인
          </button>
        )}
        <button 
          onClick={onEdit}
          className="flex-1 py-2 bg-[var(--bg2)] text-[var(--text)] rounded-lg text-[10px] font-bold active:scale-95 transition-all"
        >
          수정
        </button>
        <button 
          onClick={onDelete}
          className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold active:scale-95 transition-all"
        >
          삭제
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="bg-[var(--bg)] p-6 rounded-full border border-[var(--border)] shadow-sm mb-4">
        <FileText className="w-10 h-10 text-[var(--text3)]" />
      </div>
      <h3 className="text-sm font-bold text-[var(--text2)]">데이터가 없습니다 / 无数据</h3>
      <p className="text-xs text-[var(--text3)] mt-1">검색어를 수정하거나 새로운 항목을 추가해보세요.</p>
    </div>
  );
}
