import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer } from 'recharts';
import Marquee from "react-fast-marquee";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function Portfolio() {

  const [stockInput, setStockInput] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [period, setPeriod] = useState("2y");
  const [isLoading, setIsLoading] = useState(false);
  const [livePrices, setLivePrices] = useState([]);

  const [portfolioData, setPortfolioData] = useState([
    { name: 'Belum ada data', value: 100 }
  ]);

  const [actionPlan, setActionPlan] = useState([]);

  const [metrics, setMetrics] = useState({
    expectedReturn: 0,
    varValue: 0,
    varPercentage: 0,
    riskLevel: '-'
  });
    
useEffect(() => {

  const fetchLivePrices = () => {

    fetch("http://localhost:8000/api/live-prices")
      .then(res => res.json())
      .then(data => {
        setLivePrices(data);
      })
      .catch(err => {
        console.error(err);
      });

  };

  fetchLivePrices();

  const interval = setInterval(
    fetchLivePrices,
    10000
  );

  return () => clearInterval(interval);

}, []);
  
  const handleSimulate = async () => {
    if (!stockInput || !budgetInput) { alert("Masukkan kode saham dan budget."); return; }
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/simulate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stocks: stockInput, budget: parseFloat(budgetInput), period: period })
      });
      const data = await response.json();
      if (response.ok) {
        setPortfolioData(data.chartData); setActionPlan(data.actionPlan || []); setMetrics(data.metrics);
      } else { alert("Error dari server: " + data.detail); }
    } catch (error) { alert("Gagal terhubung ke backend Python."); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-2">Dashboard Portfolio</h2>
      <div className="bg-[#0b1121] border-y border-slate-800 py-2">

        <Marquee
          speed={20}
          gradient={false}
          pauseOnHover={true}
        >

          {livePrices.map((stock, index) => (

            <div
              key={index}
              className="mx-6 flex items-center gap-2"
            >

              <span className="font-bold text-white">
                {stock.stock}
              </span>

              <span className="text-slate-300">
                Rp {Number(stock.price).toLocaleString("id-ID")}
              </span>

              <span
                className={
                  stock.change >= 0
                    ? "text-emerald-400 font-bold"
                    : "text-red-400 font-bold"
                }
              >
                {stock.change >= 0 ? "▲" : "▼"}
                {Math.abs(stock.change)}%
              </span>

              <span className="text-slate-600">
                |
              </span>

            </div>

          ))}

        </Marquee>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

  <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700">
    <div className="text-slate-400 text-sm uppercase">
      Total Nilai Simulasi
    </div>

    <div className="text-4xl font-bold text-white mt-2">
      Rp {Number(budgetInput || 0).toLocaleString("id-ID")}
    </div>
  </div>

  <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700">
    <div className="text-slate-400 text-sm uppercase">
      Expected Return
    </div>

    <div className="text-4xl font-bold text-emerald-400 mt-2">
      {metrics.expectedReturn}%
    </div>

    <div className="text-xs text-slate-500 mt-2">
      Rata-rata
    </div>
  </div>

  <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700">
    <div className="text-slate-400 text-sm uppercase">
      Risk Level (AI)
    </div>

    <div className="text-4xl font-bold text-indigo-400 mt-2">
      {metrics.riskLevel}
    </div>

    <div className="text-xs text-slate-500 mt-2">
      Berdasarkan Volatilitas
    </div>
  </div>

  <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700">
    <div className="text-slate-400 text-sm uppercase">
      Value at Risk (95%)
    </div>

    <div className="text-4xl font-bold text-orange-400 mt-2">
      {metrics.varPercentage}%
    </div>

    <div className="text-xs text-slate-500 mt-2">
      Rp {Number(metrics.varValue).toLocaleString("id-ID")}
    </div>
  </div>

</div>

      {/* 2. AREA TENGAH: GRAFIK & INPUT SIMULASI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Input Simulasi */}
        <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col h-[400px]">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-emerald-500"></span> Parameter
          </h3>
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Ticker Saham (.JK)</label>
              <input 
                type="text" 
                value={stockInput} 
                onChange={(e) => setStockInput(e.target.value)} 
                placeholder="Contoh: BBCA, TLKM, ADRO" 
                className="w-full p-3 bg-[#0b1121] border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Total Budget (Rp)</label>
              <input 
                type="number" 
                value={budgetInput} 
                onChange={(e) => setBudgetInput(e.target.value)} 
                placeholder="Contoh: 10000000" 
                className="w-full p-3 bg-[#0b1121] border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
              />
            </div>
            <div className="mt-5">

              <label className="block text-sm text-slate-400 mb-2">
                PERIODE HISTORIS
              </label>

              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="
                  w-full
                  bg-[#0b1121]
                  border border-slate-700
                  rounded-lg
                  px-4 py-3
                  text-white
                  focus:outline-none
                  focus:border-emerald-400
                "
              >
                <option value="6mo">6 Bulan</option>
                <option value="1y">1 Tahun</option>
                <option value="2y">2 Tahun</option>
                <option value="3y">3 Tahun</option>
              </select>

            </div>
          </div>
          <button 
            onClick={handleSimulate} 
            disabled={isLoading} 
            className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 font-bold py-3 rounded-lg hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 mt-4"
          >
            {isLoading ? "Memproses Data..." : "Optimalisasi (Markowitz)"}
          </button>
        </div>

        {/* Kolom Tengah & Kanan: Alokasi Portfolio (Donut Chart) */}
        <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg md:col-span-2 h-[400px] flex flex-col">
          <h3 className="font-bold text-white mb-2">Alokasi Optimal (AI Markowitz)</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={portfolioData} 
                  innerRadius={90} 
                  outerRadius={120} 
                  paddingAngle={5} 
                  dataKey="value"
                  stroke="none"
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <PieTooltip 
                  contentStyle={{ backgroundColor: '#0b1121', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Teks di tengah Donat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-slate-400 text-xs">Total</span>
              <span className="text-2xl font-bold text-white">100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DRILL-DOWN ANALYTICS (ACTION PLAN) */}
      {actionPlan.length > 0 && (
        <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="font-bold text-white mb-4">Analisis & Metrik Individu (Per Saham)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actionPlan.map((plan, index) => (
              <div key={index} className="bg-[#0b1121] p-4 rounded-lg border border-slate-800 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <strong className="text-lg text-white">{plan.stock}</strong>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${plan.color === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : plan.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                    {plan.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">{plan.desc}</p>
                
                <div className="mt-auto grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wider">
                  <div className="bg-[#131b2f] p-2 rounded border border-slate-800">
                    <div className="text-slate-500 mb-1">Return</div>
                    <div className="bg-[#131b2f] p-2 rounded border border-slate-800">
                    <div
                      className={`font-bold ${
                        Number(plan.indReturn) >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {Number(plan.indReturn) >= 0 ? "↑" : "↓"}
                      {" "}
                      {Math.abs(Number(plan.indReturn))}%
                    </div>
                  </div>
                  </div>
                  <div className="bg-[#131b2f] p-2 rounded border border-slate-800">
                    <div className="text-slate-500 mb-1">VaR</div>

                    <div className="bg-[#131b2f] p-2 rounded border border-slate-800">
                      <div className="font-bold text-orange-400">
                        ⚠️ {plan.indVar}%
                      </div>
                    </div>
                </div>

                <div className="bg-[#131b2f] p-2 rounded border border-slate-800">
                  <div className="text-slate-500 mb-1">Risiko</div>

                  <div className="bg-[#131b2f] p-2 rounded border border-slate-800">
                    <div className="font-bold text-indigo-400">
                      {plan.indRisk}
                    </div>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}