import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, bots: 0, humans: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const gatewayUrl = localStorage.getItem('cf_gateway_url');
    if (!gatewayUrl) {
      setConnectionStatus('error');
      return;
    }

    const connectSSE = () => {
      // Append token as query param for EventSource auth
      const url = `${gatewayUrl}/api/v1/admin/stream?token=industrial_stealth_token`;
      
      const evtSource = new EventSource(url);
      eventSourceRef.current = evtSource;

      evtSource.onopen = () => {
        setConnectionStatus('live');
        console.log("[STREAM] Connected to Industrial Engine");
      };

      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          
          if (data.type === 'init') return;
          
          if (data.stats && data.logs) {
             processData(data);
          }
        } catch (err) {
          console.error("[STREAM] Parse Error", err);
        }
      };

      evtSource.onerror = (e) => {
        setConnectionStatus('error');
        evtSource.close();
        // Auto-reconnect after 3s
        setTimeout(() => connectSSE(), 3000);
      };
    };

    const processData = (data: any) => {
      const total = Array.isArray(data.stats) ? data.stats.reduce((acc: number, curr: any) => acc + (Number(curr.count) || 0), 0) : 0;
      const bots = data.stats?.find((s: any) => s.action_taken === 'MASKED_PROXY')?.count || 0;
      const humans = data.stats?.find((s: any) => s.action_taken === 'HUMAN_REDIRECT')?.count || 0;
      
      setStats({ total, bots, humans });
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      
      setChartData([
        { name: 'Live -10s', hits: total * 0.9, bots: bots * 0.85 },
        { name: 'Live -5s', hits: total * 0.95, bots: bots * 0.9 },
        { name: 'Real-time', hits: total, bots: bots },
      ]);
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Command Center</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Industrial Intelligence Feed</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${
          connectionStatus === 'live' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 
          connectionStatus === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 
          'bg-slate-800 text-slate-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'live' ? 'bg-cyan-400 animate-pulse' : 'bg-rose-500'}`}></div>
          {connectionStatus === 'live' ? 'LIVE STREAM ACTIVE' : 'RECONNECTING...'}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Edge Volume" value={stats.total.toLocaleString()} sub="Global Registry hits" icon="fa-bolt" color="cyan" />
        <StatCard title="Audit Neutralized" value={stats.bots.toLocaleString()} sub={`${((stats.bots / (stats.total || 1)) * 100).toFixed(1)}% Block efficacy`} icon="fa-shield-virus" color="rose" />
        <StatCard title="Secure Landings" value={stats.humans.toLocaleString()} sub="Human Ingress Confirmed" icon="fa-user-check" color="emerald" />
        <StatCard title="Engine Health" value="OPTIMAL" sub="v3.6.0-STREAM" icon="fa-server" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/60 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Edge Ingress Volatility</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Tooltip 
                  cursor={{fill: '#1e293b'}} 
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '10px', color: '#fff' }} 
                />
                <Bar dataKey="hits" fill="#22d3ee" radius={[6, 6, 0, 0]} barSize={45} />
                <Bar dataKey="bots" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Live Ingress Stream</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-3 custom-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/50 rounded-2xl hover:border-cyan-500/40 transition-all group">
                <div className="flex flex-col">
                  <span className="text-[11px] text-white font-mono font-bold tracking-tight">{log.ip_address}</span>
                  <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter mt-1 group-hover:text-cyan-500 transition-colors">{log.detection_reason}</span>
                </div>
                <div className={`text-[8px] font-black px-2.5 py-1 rounded-lg ${log.action_taken === 'MASKED_PROXY' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'}`}>
                  {log.action_taken === 'MASKED_PROXY' ? 'MASK' : 'PASS'}
                </div>
              </div>
            ))}
            {logs.length === 0 && <div className="py-24 text-center text-[10px] text-slate-700 font-black uppercase">Edge Telemetry Silent</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; sub: string; icon: string; color: string }> = ({ title, value, sub, icon, color }) => {
  const colorMap: Record<string, string> = {
    cyan: 'border-cyan-500/10 text-cyan-400 bg-cyan-500/5',
    rose: 'border-rose-500/10 text-rose-400 bg-rose-500/5',
    emerald: 'border-emerald-500/10 text-emerald-400 bg-emerald-500/5',
    amber: 'border-amber-500/10 text-amber-400 bg-amber-500/5',
  };
  return (
    <div className={`p-8 rounded-[2rem] border transition-all hover:translate-y-[-6px] shadow-xl ${colorMap[color]}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-xl mb-6 shadow-inner border border-white/5">
        <i className={`fas ${icon}`}></i>
      </div>
      <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{title}</h4>
      <div className="text-2xl font-black text-white font-mono tracking-tight">{value}</div>
      <p className="mt-2 text-[8px] text-slate-500 font-bold uppercase tracking-wider">{sub}</p>
    </div>
  );
};

export default Dashboard;