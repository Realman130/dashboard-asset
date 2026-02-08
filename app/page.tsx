"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Save, RefreshCw, Wallet, TrendingUp, AlertCircle, 
  Plus, Trash2, PiggyBank, Building2, Gamepad2, Coins 
} from "lucide-react";

// --- CẤU HÌNH SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- KIỂU DỮ LIỆU ---
interface Item {
  id: number;
  name: string;
  amount: number;
}

interface FinanceData {
  cash: number;
  bank_accounts: Item[];
  salary: number;
  other_income: number;
  fixed_expenses: Item[];
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State quản lý dữ liệu
  const [data, setData] = useState<FinanceData>({
    cash: 0,
    bank_accounts: [],
    salary: 0,
    other_income: 0,
    fixed_expenses: [],
  });

  // --- LOAD DATA ---
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

    if (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } else if (dbData) {
      setData({
        cash: dbData.cash || 0,
        bank_accounts: dbData.bank_accounts || [],
        salary: dbData.salary || 0,
        other_income: dbData.other_income || 0,
        fixed_expenses: dbData.fixed_expenses || [],
      });
    }
    setLoading(false);
  };

  // --- SAVE DATA ---
  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("finance_tracker")
      .update({
        cash: data.cash,
        salary: data.salary,
        other_income: data.other_income,
        bank_accounts: data.bank_accounts,
        fixed_expenses: data.fixed_expenses,
        updated_at: new Date(),
      })
      .eq("user_identifier", "default_user");

    if (error) {
      alert("Lỗi khi lưu!");
      console.error(error);
    } 
    // Giả lập delay một chút cho mượt
    setTimeout(() => setIsSaving(false), 500);
  };

  // --- XỬ LÝ NHẬP LIỆU CƠ BẢN ---
  const handleBasicChange = (field: keyof FinanceData, value: number) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // --- XỬ LÝ DANH SÁCH ĐỘNG (NGÂN HÀNG / CHI PHÍ) ---
  const updateItem = (field: 'bank_accounts' | 'fixed_expenses', id: number, key: 'name' | 'amount', value: any) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].map(item => item.id === id ? { ...item, [key]: value } : item)
    }));
  };

  const addItem = (field: 'bank_accounts' | 'fixed_expenses') => {
    const newItem: Item = { id: Date.now(), name: field === 'bank_accounts' ? 'Ngân hàng mới' : 'Khoản chi mới', amount: 0 };
    setData(prev => ({ ...prev, [field]: [...prev[field], newItem] }));
  };

  const removeItem = (field: 'bank_accounts' | 'fixed_expenses', id: number) => {
    setData(prev => ({ ...prev, [field]: prev[field].filter(item => item.id !== id) }));
  };

  // --- TÍNH TOÁN TỔNG ---
  const totalBank = data.bank_accounts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalAssets = (Number(data.cash) || 0) + totalBank;
  
  const totalIncome = (Number(data.salary) || 0) + (Number(data.other_income) || 0);
  const totalExpense = data.fixed_expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  
  const remaining = totalIncome - totalExpense;

  // --- PHÂN BỔ GIỎ (Trên số dư) ---
  const safeRemaining = remaining > 0 ? remaining : 0;
  const jarLiving = safeRemaining * 0.4;
  const jarInvest = safeRemaining * 0.3;
  const jarSavings = safeRemaining * 0.2;
  const jarPlay = safeRemaining * 0.1;

  const formatVND = (amount: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Coins size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Finance Dashboard</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Quản lý dòng tiền cá nhân</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition" title="Làm mới">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition shadow-sm
                ${isSaving ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
              `}
            >
              <Save size={18} /> {isSaving ? "Đang lưu..." : "Lưu dữ liệu"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* GRID LAYOUT: 12 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT 1: TÀI SẢN (Chiếm 4 phần) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-700 flex items-center gap-2">
                  <Wallet className="text-blue-500" size={20} /> Tài Sản Hiện Có
                </h2>
                <span className="text-blue-600 font-bold">{formatVND(totalAssets)}</span>
              </div>
              
              <div className="p-5 space-y-4">
                {/* Tiền mặt */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Tiền mặt</label>
                  <input 
                    type="number" 
                    value={data.cash}
                    onChange={(e) => handleBasicChange('cash', Number(e.target.value))}
                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>

                {/* Danh sách Ngân hàng */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Tài khoản ngân hàng</label>
                    <button onClick={() => addItem('bank_accounts')} className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                      <Plus size={14} /> Thêm bank
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {data.bank_accounts.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center group">
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={(e) => updateItem('bank_accounts', item.id, 'name', e.target.value)}
                          className="w-1/3 p-2 text-sm bg-white border border-slate-200 rounded-md focus:border-blue-500 outline-none"
                          placeholder="Tên NH"
                        />
                        <input 
                          type="number" 
                          value={item.amount}
                          onChange={(e) => updateItem('bank_accounts', item.id, 'amount', Number(e.target.value))}
                          className="flex-1 p-2 text-sm font-mono bg-white border border-slate-200 rounded-md focus:border-blue-500 outline-none text-right"
                        />
                        <button 
                          onClick={() => removeItem('bank_accounts', item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT 2: THU & CHI (Chiếm 4 phần) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Thu Nhập */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-100 bg-green-50/50 flex justify-between items-center">
                <h2 className="font-bold text-green-800 flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={20} /> Thu Nhập
                </h2>
                <span className="text-green-700 font-bold">{formatVND(totalIncome)}</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-xs font-semibold text-slate-400">Lương cứng</label>
                      <input 
                        type="number" value={data.salary} 
                        onChange={(e) => handleBasicChange('salary', Number(e.target.value))}
                        className="w-full p-2 border rounded-md text-right font-mono" 
                      />
                   </div>
                   <div>
                      <label className="text-xs font-semibold text-slate-400">Thu nhập khác</label>
                      <input 
                        type="number" value={data.other_income} 
                        onChange={(e) => handleBasicChange('other_income', Number(e.target.value))}
                        className="w-full p-2 border rounded-md text-right font-mono" 
                      />
                   </div>
                </div>
              </div>
            </div>

            {/* Chi Phí Cố Định */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1">
              <div className="p-4 border-b border-slate-100 bg-red-50/50 flex justify-between items-center">
                <h2 className="font-bold text-red-800 flex items-center gap-2">
                  <AlertCircle className="text-red-600" size={20} /> Chi Cố Định
                </h2>
                <span className="text-red-700 font-bold">{formatVND(totalExpense)}</span>
              </div>
              
              <div className="p-5">
                 <div className="flex justify-between items-end mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Danh sách khoản chi</label>
                    <button onClick={() => addItem('fixed_expenses')} className="text-xs flex items-center gap-1 text-red-600 hover:underline">
                      <Plus size={14} /> Thêm khoản chi
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {data.fixed_expenses.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center group">
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={(e) => updateItem('fixed_expenses', item.id, 'name', e.target.value)}
                          className="w-1/3 p-2 text-sm bg-white border border-slate-200 rounded-md focus:border-red-500 outline-none"
                          placeholder="Khoản chi..."
                        />
                        <input 
                          type="number" 
                          value={item.amount}
                          onChange={(e) => updateItem('fixed_expenses', item.id, 'amount', Number(e.target.value))}
                          className="flex-1 p-2 text-sm font-mono bg-white border border-slate-200 rounded-md focus:border-red-500 outline-none text-right"
                        />
                        <button 
                          onClick={() => removeItem('fixed_expenses', item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
              </div>
            </div>

          </div>

          {/* CỘT 3: TỔNG KẾT & PHÂN BỔ (Chiếm 4 phần) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card Tổng Kết */}
            <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Coins size={100} />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">DÒNG TIỀN DƯ (Cashflow)</p>
              <div className={`text-4xl font-bold mb-4 ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatVND(remaining)}
              </div>
              
              <div className="h-1 w-full bg-slate-700 rounded-full mb-4">
                 <div 
                  className="h-1 bg-green-500 rounded-full transition-all duration-500" 
                  style={{ width: totalIncome > 0 ? `${(remaining/totalIncome)*100}%` : '0%' }}
                 ></div>
              </div>
              <p className="text-xs text-slate-400">
                *Số tiền này đã trừ hết chi phí cố định, sẵn sàng để phân bổ.
              </p>
            </div>

            {/* Card Phân Bổ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Kế Hoạch Phân Bổ</h3>
              <div className="grid grid-cols-1 gap-4">
                
                <JarRow 
                  icon={<Wallet className="text-yellow-500" />} 
                  color="bg-yellow-100 text-yellow-700"
                  label="Sinh hoạt phí (40%)" 
                  value={jarLiving} 
                />
                <JarRow 
                  icon={<Building2 className="text-blue-500" />} 
                  color="bg-blue-100 text-blue-700"
                  label="Đầu tư (30%)" 
                  value={jarInvest} 
                />
                <JarRow 
                  icon={<PiggyBank className="text-pink-500" />} 
                  color="bg-pink-100 text-pink-700"
                  label="Tiết kiệm (20%)" 
                  value={jarSavings} 
                />
                <JarRow 
                  icon={<Gamepad2 className="text-purple-500" />} 
                  color="bg-purple-100 text-purple-700"
                  label="Giải trí (10%)" 
                  value={jarPlay} 
                />

              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

// Sub-component cho dòng phân bổ
function JarRow({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <span className="font-bold text-slate-800 font-mono">
        {new Intl.NumberFormat("vi-VN").format(value)} đ
      </span>
    </div>
  );
}