"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Save, RefreshCw, Wallet, TrendingUp, TrendingDown, 
  Plus, Trash2, PieChart as PieIcon, Layers, CreditCard, AlertTriangle 
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format hiển thị tiền tệ (Có ký hiệu đ)
const formatVND = (amount: number) => 
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

// Format số lượng đơn thuần (Chỉ có dấu chấm phân cách: 1.000.000)
const formatNumberDots = (amount: number) => {
  return new Intl.NumberFormat("vi-VN").format(amount);
};

// --- SUPABASE CONFIG ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- TYPES ---
interface Item {
  id: number;
  name: string;
  amount: number;
}

interface Allocation {
  living: number;
  invest: number;
  savings: number;
  play: number;
}

interface FinanceData {
  cash: number;
  bank_accounts: Item[];
  salary: number;
  other_income: number;
  fixed_expenses: Item[];
  allocation_settings: Allocation;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State mặc định
  const [data, setData] = useState<FinanceData>({
    cash: 0,
    bank_accounts: [],
    salary: 0,
    other_income: 0,
    fixed_expenses: [],
    allocation_settings: { living: 40, invest: 30, savings: 20, play: 10 }
  });

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dbData, error } = await supabase
      .from("finance_tracker")
      .select("*")
      .eq("user_identifier", "default_user")
      .single();

    if (!error && dbData) {
      setData({
        cash: dbData.cash || 0,
        bank_accounts: Array.isArray(dbData.bank_accounts) ? dbData.bank_accounts : [],
        salary: dbData.salary || 0,
        other_income: dbData.other_income || 0,
        fixed_expenses: Array.isArray(dbData.fixed_expenses) ? dbData.fixed_expenses : [],
        allocation_settings: dbData.allocation_settings || { living: 40, invest: 30, savings: 20, play: 10 }
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await supabase.from("finance_tracker").update({
      ...data,
      updated_at: new Date(),
    }).eq("user_identifier", "default_user");
    setTimeout(() => setIsSaving(false), 800);
  };

  // --- LOGIC UPDATE ---
  const handleBasicChange = (field: keyof FinanceData, value: number) => setData(prev => ({ ...prev, [field]: value }));
  
  const updateList = (field: 'bank_accounts' | 'fixed_expenses', id: number, key: 'name' | 'amount', value: any) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].map(item => item.id === id ? { ...item, [key]: value } : item)
    }));
  };

  const addItem = (field: 'bank_accounts' | 'fixed_expenses') => {
    const newItem: Item = { id: Date.now(), name: field === 'bank_accounts' ? 'NH Mới' : 'Khoản chi mới', amount: 0 };
    setData(prev => ({ ...prev, [field]: [...prev[field], newItem] }));
  };

  const removeItem = (field: 'bank_accounts' | 'fixed_expenses', id: number) => {
    setData(prev => ({ ...prev, [field]: prev[field].filter(item => item.id !== id) }));
  };

  const updateAllocation = (key: keyof Allocation, value: number) => {
    setData(prev => ({
      ...prev,
      allocation_settings: { ...prev.allocation_settings, [key]: value }
    }));
  };

  // Calculations
  const totalBank = data.bank_accounts.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalAssets = (Number(data.cash) || 0) + totalBank;
  const totalIncome = (Number(data.salary) || 0) + (Number(data.other_income) || 0);
  const totalExpense = data.fixed_expenses.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const remaining = totalIncome - totalExpense;
  const safeRemaining = remaining > 0 ? remaining : 0;

  // Allocation Logic
  const alloc = data.allocation_settings;
  const totalPercent = alloc.living + alloc.invest + alloc.savings + alloc.play;
  
  const allocationData = [
    { name: "Sinh hoạt", key: "living", value: safeRemaining * (alloc.living / 100), percent: alloc.living, color: "#3b82f6" }, 
    { name: "Đầu tư", key: "invest", value: safeRemaining * (alloc.invest / 100), percent: alloc.invest, color: "#10b981" },    
    { name: "Tiết kiệm", key: "savings", value: safeRemaining * (alloc.savings / 100), percent: alloc.savings, color: "#f59e0b" }, 
    { name: "Giải trí", key: "play", value: safeRemaining * (alloc.play / 100), percent: alloc.play, color: "#8b5cf6" }, 
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* --- NAVBAR --- */}
      <nav className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">FinTrack Pro</span>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchData} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition-all shadow-lg",
                isSaving ? "bg-slate-700 text-slate-300 cursor-wait" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 hover:shadow-blue-600/40"
              )}
            >
              <Save size={16} /> {isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet size={80} /></div>
            <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2"><Wallet size={16} className="text-blue-400" /> Tổng Tài Sản</p>
            {/* Sử dụng font-mono cho số liệu */}
            <h2 className="text-3xl font-bold text-white tracking-tight font-mono">{formatVND(totalAssets)}</h2>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="px-2 py-1 bg-slate-700/50 rounded text-slate-300 font-mono">Tiền mặt: {formatNumberDots(data.cash)}</span>
              <span className="px-2 py-1 bg-slate-700/50 rounded text-slate-300 font-mono">Bank: {formatNumberDots(totalBank)}</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl relative overflow-hidden">
            <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2"><TrendingUp size={16} className="text-green-400" /> Dòng Tiền (Net Cashflow)</p>
            <h2 className={cn("text-3xl font-bold tracking-tight font-mono", remaining >= 0 ? "text-green-400" : "text-red-400")}>
              {remaining > 0 ? "+" : ""}{formatVND(remaining)}
            </h2>
            <p className="text-xs text-slate-500 mt-2">Số tiền khả dụng sau chi phí</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl relative overflow-hidden">
             <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2"><TrendingDown size={16} className="text-red-400" /> Chi Cố Định</p>
            <h2 className="text-3xl font-bold text-white tracking-tight font-mono">{formatVND(totalExpense)}</h2>
            <div className="w-full bg-slate-700 h-1.5 mt-4 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min((totalExpense / (totalIncome || 1)) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-right font-mono">Chiếm {Math.round((totalExpense / (totalIncome || 1)) * 100)}% Thu nhập</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: INPUTS (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-semibold text-slate-200">Quản Lý Tài Sản</h3>
                <button onClick={() => addItem('bank_accounts')} className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition flex items-center gap-1"><Plus size={14} /> Thêm NH</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50">
                   <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><Wallet size={20} /></div>
                   <div className="flex-1">
                      <label className="text-xs text-slate-500 font-medium uppercase">Tiền mặt thực tế</label>
                      {/* Dùng Component nhập liệu thông minh */}
                      <MoneyInput 
                        value={data.cash} 
                        onChange={val => handleBasicChange('cash', val)} 
                        className="text-lg"
                      />
                   </div>
                </div>
                <div className="space-y-3">
                   {data.bank_accounts.map(bank => (
                      <div key={bank.id} className="group flex items-center gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50 hover:border-slate-700 transition">
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><CreditCard size={20} /></div>
                        <div className="flex-1">
                          <input className="w-full bg-transparent text-sm font-medium text-slate-300 outline-none focus:text-blue-400 mb-1" value={bank.name} onChange={e => updateList('bank_accounts', bank.id, 'name', e.target.value)} placeholder="Tên ngân hàng" />
                           {/* Dùng Component nhập liệu thông minh */}
                           <MoneyInput 
                            value={bank.amount} 
                            onChange={val => updateList('bank_accounts', bank.id, 'amount', val)} 
                          />
                        </div>
                        <button onClick={() => removeItem('bank_accounts', bank.id)} className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={18} /></button>
                      </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
               <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-semibold text-slate-200">Thu & Chi</h3>
                <button onClick={() => addItem('fixed_expenses')} className="text-xs bg-red-600/20 text-red-400 px-3 py-1.5 rounded-full hover:bg-red-600 hover:text-white transition flex items-center gap-1"><Plus size={14} /> Thêm Chi Phí</button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nguồn thu nhập</label>
                    <div className="space-y-3">
                       <InputCard label="Lương cứng" value={data.salary} onChange={v => handleBasicChange('salary', v)} />
                       <InputCard label="Thu nhập khác" value={data.other_income} onChange={v => handleBasicChange('other_income', v)} />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Chi cố định tháng</label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                       {data.fixed_expenses.map(item => (
                          <div key={item.id} className="flex items-center gap-2 bg-slate-800/30 p-2 rounded-lg border border-slate-800 group hover:border-red-500/30 transition">
                             <input className="w-1/2 bg-transparent text-sm text-slate-300 outline-none" value={item.name} onChange={e => updateList('fixed_expenses', item.id, 'name', e.target.value)} placeholder="Khoản chi..." />
                             
                             {/* Dùng Component nhập liệu thông minh */}
                             <div className="w-1/2">
                                <MoneyInput 
                                  value={item.amount} 
                                  onChange={val => updateList('fixed_expenses', item.id, 'amount', val)} 
                                  className="text-right text-sm"
                                />
                             </div>
                             
                             <button onClick={() => removeItem('fixed_expenses', item.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ALLOCATION (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-24">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                      <PieIcon size={18} className="text-purple-400" /> Phân Bổ Dòng Tiền
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Tự chỉnh tỷ lệ % theo ý muốn</p>
                 </div>
                 <div className={cn("px-3 py-1 rounded-full text-xs font-bold border", totalPercent === 100 ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20")}>
                    Tổng: {totalPercent}%
                 </div>
              </div>
              
              <div className="h-[220px] w-full relative">
                {safeRemaining > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => formatVND(value)} 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} 
                        itemStyle={{ color: '#fff', fontFamily: 'monospace' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm">Chưa có dòng tiền dương</div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-xs text-slate-500">Dư</span>
                   <span className="font-bold text-white text-lg font-mono">{formatVND(safeRemaining)}</span>
                </div>
              </div>

              {/* LEGEND */}
              <div className="mt-6 space-y-3">
                 {allocationData.map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition border border-transparent hover:border-slate-700">
                       <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}></div>
                          <span className="text-sm text-slate-300 font-medium w-20">{item.name}</span>
                          <div className="relative group">
                            <input 
                              type="number"
                              value={item.percent}
                              onChange={(e) => updateAllocation(item.key as keyof Allocation, Number(e.target.value))}
                              className="w-12 text-center bg-slate-800 border border-slate-700 rounded text-xs font-bold text-white focus:border-blue-500 outline-none p-1 font-mono"
                            />
                            <span className="absolute -right-3 top-1 text-xs text-slate-500">%</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-sm font-bold text-white font-mono">{formatVND(item.value)}</div>
                       </div>
                    </div>
                 ))}
              </div>

              {totalPercent !== 100 && (
                 <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={16} className="text-yellow-500" />
                    <span className="text-xs text-yellow-200">Tổng tỷ lệ: <strong>{totalPercent}%</strong>. Hãy chỉnh về 100%.</span>
                 </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- NEW COMPONENT: MONEY INPUT (Tự động thêm dấu chấm) ---
function MoneyInput({ value, onChange, className }: { value: number, onChange: (val: number) => void, className?: string }) {
  // Hàm xử lý khi user nhập
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Lấy giá trị raw từ input (vd: "1.000a")
    const rawValue = e.target.value;
    
    // 2. Xóa hết các ký tự không phải số (giữ lại số 0-9)
    const cleanValue = rawValue.replace(/[^0-9]/g, '');

    // 3. Trả về số cho Parent Component update state
    onChange(Number(cleanValue));
  };

  return (
    <input
      type="text" // Dùng type text để có thể hiển thị dấu chấm
      value={value === 0 ? '' : formatNumberDots(value)} // Nếu 0 thì để trống cho đẹp, khác 0 thì format
      onChange={handleChange}
      className={cn(
        "w-full bg-transparent text-white font-mono font-bold outline-none placeholder-slate-600",
        className
      )}
      placeholder="0"
    />
  );
}

// --- COMPONENT: INPUT CARD ---
function InputCard({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) {
   return (
      <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800 hover:border-slate-700 transition">
         <label className="text-xs text-slate-500 block mb-1">{label}</label>
         <MoneyInput 
            value={value} 
            onChange={onChange} 
            className="text-lg"
         />
      </div>
   )
}