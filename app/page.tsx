"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Save, RefreshCw, Wallet, Building2, TrendingUp, PiggyBank, Gamepad2, AlertCircle } from "lucide-react";

// --- CẤU HÌNH SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- KIỂU DỮ LIỆU ---
interface FinanceData {
  cash: number;
  bank_balance: number;
  salary: number;
  other_income: number;
  rent_cost: number;
  phone_cost: number;
  debt_interest: number;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FinanceData>({
    cash: 0,
    bank_balance: 0,
    salary: 0,
    other_income: 0,
    rent_cost: 0,
    phone_cost: 0,
    debt_interest: 0,
  });

  // --- HÀM LOAD DỮ LIỆU ---
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
        bank_balance: dbData.bank_balance || 0,
        salary: dbData.salary || 0,
        other_income: dbData.other_income || 0,
        rent_cost: dbData.rent_cost || 0,
        phone_cost: dbData.phone_cost || 0,
        debt_interest: dbData.debt_interest || 0,
      });
    }
    setLoading(false);
  };

  // --- HÀM LƯU DỮ LIỆU ---
  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("finance_tracker")
      .update(data)
      .eq("user_identifier", "default_user");

    if (error) {
      alert("Lưu thất bại!");
      console.error(error);
    } else {
      alert("Đã cập nhật dữ liệu thành công!");
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // --- LOGIC TÍNH TOÁN ---
  const totalAssets = data.cash + data.bank_balance;
  const totalIncome = data.salary + data.other_income;
  const totalFixedExpense = data.rent_cost + data.phone_cost + data.debt_interest;
  const remaining = totalIncome - totalFixedExpense;

  // --- PHÂN BỔ GIỎ (Dựa trên số tiền còn lại sau khi trừ chi phí cố định) ---
  // Logic tham khảo: 
  // - 40% cho Chi tiêu sinh hoạt (Ăn uống, đi lại...)
  // - 30% cho Đầu tư
  // - 20% cho Tiết kiệm dài hạn
  // - 10% cho Giải trí
  const jarLiving = remaining > 0 ? remaining * 0.4 : 0;
  const jarInvest = remaining > 0 ? remaining * 0.3 : 0;
  const jarSavings = remaining > 0 ? remaining * 0.2 : 0;
  const jarPlay = remaining > 0 ? remaining * 0.1 : 0;

  // Format tiền tệ VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        
        {/* HEADER */}
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Quản Lý Tài Chính</h1>
            <p className="text-blue-100 text-sm opacity-90">Cập nhật realtime trên mọi thiết bị</p>
          </div>
          <button 
            onClick={fetchData} 
            className="p-2 bg-blue-500 rounded-full hover:bg-blue-400 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* PHẦN 1: TÀI SẢN HIỆN CÓ */}
          <section className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Tổng Tài Sản Hiện Tại
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputGroup label="Tiền mặt" name="cash" value={data.cash} onChange={handleChange} />
              <InputGroup label="Tài khoản Ngân hàng" name="bank_balance" value={data.bank_balance} onChange={handleChange} />
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-center">
              <span className="font-medium text-blue-900">Tổng tài sản:</span>
              <span className="text-xl font-bold text-blue-700">{formatVND(totalAssets)}</span>
            </div>
          </section>

          {/* PHẦN 2: THU NHẬP & CHI CỐ ĐỊNH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* THU NHẬP */}
            <section className="bg-green-50 p-5 rounded-xl border border-green-100">
              <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Thu Nhập Tháng
              </h2>
              <div className="space-y-3">
                <InputGroup label="Lương cố định" name="salary" value={data.salary} onChange={handleChange} />
                <InputGroup label="Khoản thu khác" name="other_income" value={data.other_income} onChange={handleChange} />
              </div>
              <div className="mt-4 text-right font-bold text-green-700">{formatVND(totalIncome)}</div>
            </section>

            {/* CHI CỐ ĐỊNH */}
            <section className="bg-red-50 p-5 rounded-xl border border-red-100">
              <h2 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Chi Phí Cố Định
              </h2>
              <div className="space-y-3">
                <InputGroup label="Tiền nhà" name="rent_cost" value={data.rent_cost} onChange={handleChange} />
                <InputGroup label="Tiền điện thoại/Net" name="phone_cost" value={data.phone_cost} onChange={handleChange} />
                <InputGroup label="Lãi trả nợ" name="debt_interest" value={data.debt_interest} onChange={handleChange} />
              </div>
              <div className="mt-4 text-right font-bold text-red-700">{formatVND(totalFixedExpense)}</div>
            </section>
          </div>

          {/* PHẦN 3: KẾT QUẢ & PHÂN BỔ */}
          <section className="bg-gray-800 text-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center border-b border-gray-600 pb-4 mb-4">
              <span className="text-gray-300">Dòng tiền còn lại (Thu - Chi):</span>
              <span className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatVND(remaining)}
              </span>
            </div>

            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Gợi ý phân bổ chi tiêu (Dựa trên số dư)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <JarItem 
                icon={<Wallet className="text-yellow-400" />} 
                label="Sinh hoạt phí (40%)" 
                value={jarLiving} 
                sub="Ăn uống, xăng xe, chợ búa"
              />
              <JarItem 
                icon={<PiggyBank className="text-pink-400" />} 
                label="Tiết kiệm (20%)" 
                value={jarSavings} 
                sub="Quỹ dự phòng, mục tiêu lớn"
              />
              <JarItem 
                icon={<Building2 className="text-blue-400" />} 
                label="Đầu tư (30%)" 
                value={jarInvest} 
                sub="Chứng khoán, Vàng, Coin"
              />
              <JarItem 
                icon={<Gamepad2 className="text-purple-400" />} 
                label="Giải trí (10%)" 
                value={jarPlay} 
                sub="Cafe, mua sắm cá nhân"
              />
            </div>
          </section>

          {/* BUTTON SAVE */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition transform active:scale-95 flex justify-center items-center gap-2"
          >
            {loading ? "Đang lưu..." : <><Save size={20} /> CẬP NHẬT DỮ LIỆU</>}
          </button>

        </div>
      </div>
    </div>
  );
}

// --- COMPONENTS CON ---
function InputGroup({ label, name, value, onChange }: { label: string, name: string, value: number, onChange: any }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right font-mono"
        placeholder="0"
      />
    </div>
  );
}

function JarItem({ icon, label, value, sub }: { icon: any, label: string, value: number, sub: string }) {
  return (
    <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-semibold text-sm">{label}</span>
      </div>
      <div className="text-lg font-bold text-white mb-1">
        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)}
      </div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  );
}