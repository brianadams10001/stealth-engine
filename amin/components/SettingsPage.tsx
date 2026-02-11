import React, { useState, useEffect } from 'react';

const SettingsPage: React.FC = () => {
  // Pre-filled with your provided credentials
  const [settings, setSettings] = useState({
    apiKey: localStorage.getItem('cf_api_key') || '068910fce0349d235664caefd6eea6c16d6aa',
    accountId: localStorage.getItem('cf_account_id') || '66781245e81bdf13aac97cc130d4eceb',
    apiGatewayUrl: localStorage.getItem('cf_gateway_url') || '',
    caKey: localStorage.getItem('cf_ca_key') || 'v1.0-02180da20818ef5fad363981-7889b366ba836a158a10d289201e2e985a2f70bee47070930cec1907dae15379e2140cc9bbe598f2a1ab707f279c624a1cad38258e396b5ca1ced9ea6e01a66c3da7d4db01ebe6aaa2'
  });

  const [syncing, setSyncing] = useState(false);
  const [health, setHealth] = useState({ status: 'offline', kv: false, d1: false });

  const checkConnectivity = async () => {
    if (!settings.apiGatewayUrl) return;
    try {
      const res = await fetch(`${settings.apiGatewayUrl}/api/v1/admin/status`, {
        headers: { 'Authorization': `Bearer industrial_stealth_token` }
      });
      if (res.ok) {
        const data = await res.json();
        setHealth({ status: 'online', kv: data.bindings.kv, d1: data.bindings.d1 });
      } else {
        setHealth({ ...health, status: 'error' });
      }
    } catch (e) {
      setHealth({ ...health, status: 'error' });
    }
  };

  useEffect(() => {
    checkConnectivity();
    // Auto-save the defaults if they aren't in local storage yet
    if (!localStorage.getItem('cf_api_key')) {
        localStorage.setItem('cf_api_key', '068910fce0349d235664caefd6eea6c16d6aa');
    }
    if (!localStorage.getItem('cf_account_id')) {
        localStorage.setItem('cf_account_id', '66781245e81bdf13aac97cc130d4eceb');
    }
  }, []);

  const handleSave = () => {
    setSyncing(true);
    localStorage.setItem('cf_api_key', settings.apiKey);
    localStorage.setItem('cf_account_id', settings.accountId);
    localStorage.setItem('cf_gateway_url', settings.apiGatewayUrl);
    localStorage.setItem('cf_ca_key', settings.caKey);
    setTimeout(() => {
      setSyncing(false);
      checkConnectivity();
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Infrastructure</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Industrial Connectivity & Environment Sync</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${
          health.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
          health.status === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
          'bg-slate-800 border-slate-700 text-slate-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${health.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
          {health.status === 'online' ? 'Engine Ready' : 'System Standby'}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl">
            <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
              <i className="fas fa-microchip text-cyan-500"></i> Cloudflare Integration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Global API Key</label>
                <input 
                  type="password" 
                  value={settings.apiKey}
                  onChange={e => setSettings({...settings, apiKey: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 focus:border-cyan-500 outline-none font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Account ID</label>
                <input 
                  type="text" 
                  value={settings.accountId}
                  onChange={e => setSettings({...settings, accountId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 focus:border-cyan-500 outline-none font-mono text-xs"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-cyan-500/60 uppercase tracking-widest">Worker Gateway URL</label>
                <input 
                  type="text" 
                  value={settings.apiGatewayUrl}
                  onChange={e => setSettings({...settings, apiGatewayUrl: e.target.value})}
                  placeholder="https://stealth-engine.brian-adams10001.workers.dev"
                  className="w-full bg-slate-950 border border-cyan-500/20 rounded-2xl px-5 py-4 text-cyan-400 focus:border-cyan-500 outline-none font-mono text-xs"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Original CA Key (Advanced)</label>
                <input 
                  type="password" 
                  value={settings.caKey}
                  onChange={e => setSettings({...settings, caKey: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-500 focus:border-cyan-500 outline-none font-mono text-[10px]"
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-2xl transition-all shadow-xl uppercase text-xs tracking-widest"
            >
              {syncing ? 'SYNCING...' : 'ESTABLISH CLOUD CONNECTION'}
            </button>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <i className="fas fa-vial text-emerald-500"></i> Binding Verification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <BindingStatus active={health.kv} label="KV Storage (CONFIG)" desc="Domain Mapping" />
               <BindingStatus active={health.d1} label="D1 Database (DB)" desc="Traffic Persistence" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-4">Industrial Setup</h4>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/50 mb-6">
               <p className="text-[9px] text-slate-500 uppercase font-black mb-2">System Status</p>
               <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">
                 Credentials pre-loaded. Ensure your worker.js is deployed to Cloudflare to activate the gateway status check.
               </p>
            </div>
            <div className="space-y-4">
              <MiniStep num="1" text="Deploy Worker Code" />
              <MiniStep num="2" text="Bind KV (ID: ...251)" />
              <MiniStep num="3" text="Bind D1 (ID: ...63a)" />
              <MiniStep num="4" text="Execute SQL Schema" />
              <MiniStep num="5" text="Link Gateway URL" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BindingStatus: React.FC<{ active: boolean; label: string; desc: string }> = ({ active, label, desc }) => (
  <div className={`p-4 rounded-2xl border transition-all ${active ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-rose-500/5 border-rose-500/20'}`}>
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] font-black text-white uppercase">{label}</span>
      <i className={`fas ${active ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-rose-500'}`}></i>
    </div>
    <p className="text-[8px] text-slate-500 font-bold uppercase">{desc}</p>
  </div>
);

const MiniStep: React.FC<{ num: string; text: string }> = ({ num, text }) => (
  <div className="flex items-center gap-3">
    <div className="w-5 h-5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[9px] font-black text-cyan-500">{num}</div>
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{text}</span>
  </div>
);

export default SettingsPage;