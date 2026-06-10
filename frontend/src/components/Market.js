import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Legend, ResponsiveContainer } from 'recharts';
import Marquee from "react-fast-marquee";

export default function Market() {
  const [livePrices, setLivePrices] = useState([]);
  const [marketData, setMarketData] = useState({ topGainers: [], topLosers: [], trendData: [] });
  const [isMarketLoading, setIsMarketLoading] = useState(true);

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
    const interval = setInterval(fetchLivePrices, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/api/market-movers')
      .then(res => res.json())
      .then(data => {

        console.log("MARKET DATA =", data);

        setMarketData(data);
        setIsMarketLoading(false);
      })
      .catch(err => {
        console.error("Gagal mengambil data market:", err);
        setIsMarketLoading(false);
      });
  }, []);

  if (isMarketLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-[#131b2f] rounded-xl border border-slate-800">
        <div className="text-emerald-500 font-bold text-xl animate-pulse flex flex-col items-center gap-3">
          <span className="text-4xl">⏳</span>
          Memuat Data & Menjalankan Algoritma ARIMA...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-white">Market Movers</h2>
        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30">
          ● Live Market Data
        </span>
      </div>

    <div className="bg-[#131b2f] p-3 rounded-xl border border-slate-700 overflow-hidden">

      <Marquee
        speed={40}
        gradient={false}
        pauseOnHover={true}
      >

        {livePrices.map((stock) => (

          <div
            key={stock.stock}
            className="flex items-center gap-2 mx-8"
          >

            <span className="font-bold text-white">
              {stock.stock}
            </span>

            <span className="text-slate-300">
              Rp {Number(stock.price).toLocaleString('id-ID')}
            </span>

            <span
              className={
                stock.change >= 0
                  ? "text-emerald-400 font-bold"
                  : "text-red-400 font-bold"
              }
            >
              {stock.change >= 0 ? "▲" : "▼"}
              {stock.change}%
            </span>

            <span className="text-slate-600">
              |
            </span>

          </div>

        ))}

      </Marquee>

    </div>

      {/* 1. TOP GAINERS & LOSERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Kolom Top Gainers */}
        <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3 flex justify-between items-center">
            TOP GAINERS
            <span className="text-emerald-500 text-xs font-normal bg-emerald-500/10 px-2 py-1 rounded">AI Detected</span>
          </h3>
          <div className="space-y-3">
            {marketData.topGainers.map((stock, index) => (
              <div key={index} className="bg-[#0b1121] p-4 rounded-lg border border-slate-800 flex justify-between items-center hover:border-emerald-500/50 transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 font-bold rounded-full flex items-center justify-center text-lg border border-emerald-500/30">
                    {stock.code.charAt(0)}
                  </div>
                  <div>
                    <strong className="text-lg text-white block">{stock.code}</strong> 
                    <span className="text-slate-500 text-xs">{stock.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold text-lg bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">↑ {stock.change}</div>
                  <div className="text-slate-400 text-xs mt-1 font-mono">{stock.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Top Losers */}
        <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3 flex justify-between items-center">
            TOP LOSERS
            <span className="text-red-500 text-xs font-normal bg-red-500/10 px-2 py-1 rounded">AI Detected</span>
          </h3>
          <div className="space-y-3">
            {marketData.topLosers.map((stock, index) => (
              <div key={index} className="bg-[#0b1121] p-4 rounded-lg border border-slate-800 flex justify-between items-center hover:border-red-500/50 transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 text-red-400 font-bold rounded-full flex items-center justify-center text-lg border border-red-500/30">
                    {stock.code.charAt(0)}
                  </div>
                  <div>
                    <strong className="text-lg text-white block">{stock.code}</strong> 
                    <span className="text-slate-500 text-xs">{stock.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold text-lg bg-red-500/10 px-3 py-1 rounded border border-red-500/20">↓ {stock.change}</div>
                  <div className="text-slate-400 text-xs mt-1 font-mono">{stock.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. GRAFIK TREN & PREDIKSI ARIMA */}
      <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-white text-lg">Tren Harga Saham & Prediksi (ARIMA Model)</h3>
          <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded border border-indigo-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            AI Forecasting Active
          </span>
        </div>
        
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={marketData.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              {/* Grid Line Redup ala Dark Mode */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              
              <XAxis 
                dataKey="month" 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                axisLine={{ stroke: '#475569' }}
                tickLine={false}
              />
              <YAxis 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                domain={['auto', 'auto']} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
              />
              
              {/* Tooltip Premium */}
              <LineTooltip 
                contentStyle={{ backgroundColor: '#0b1121', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              {/* Garis Saham Neon */}
              {
  Object.keys(marketData.trendData?.[0] || {})
    .filter(key => key !== "month")
    .map((stock, index) => {

      const colors = [
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#ef4444",
        "#14b8a6"
      ];

      return (
        <Line
          key={stock}
          type="monotone"
          dataKey={stock}
          stroke={colors[index % colors.length]}
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      );
    })
}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <p className="text-xs text-slate-400 leading-relaxed">
            Titik terakhir pada sumbu X <strong>("Prediksi")</strong> merupakan estimasi harga 1 bulan ke depan yang dihasilkan oleh algoritma Machine Learning (ARIMA). Garis putus-putus pada prediksi menyesuaikan pergerakan rata-rata historis (Moving Average) untuk memberikan visibilitas tren di masa depan.
          </p>
        </div>
      </div>
    </div>
  );
}