import React, { useState } from 'react';

const SUBDOMAIN_SAMPLES = ["blog", "shop", "news", "store", "order", "help", "support", "member", "secure", "api", "dev", "beta", "docs", "learn", "academy", "culture"];

const MultiMasterPage: React.FC = () => {
  const [count, setCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const startGeneration = async () => {
    const gatewayUrl = localStorage.getItem('cf_gateway_url');
    if (!gatewayUrl) {
        setLogs(prev => ["ERROR: Gateway URL not configured in Infrastructure tab.", ...prev]);
        return;
    }

    setIsGenerating(true);
    setProgress(0);
    setLogs([]);

    const baseDomain = "shop.official-offer.site"; // Hardcoded for demo, normally from input

    for (let i = 0; i < count; i++) {
        const sub = SUBDOMAIN_SAMPLES[i % SUBDOMAIN_SAMPLES.length] + (Math.floor(i / SUBDOMAIN_SAMPLES.length) || "");
        const fullDomain = `${sub}.${baseDomain}`;
        
        try {
            // Call Worker API to save config
            await fetch(`${gatewayUrl}/api/v1/admin/config`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer industrial_stealth_token`
                },
                body: JSON.stringify({
                    id: `bulk-${i}-${Date.now()}`,
                    domainName: fullDomain,
                    moneyUrl: "https://example.com/money",
                    safeUrl: "https://example.com/safe",
                    botThreshold: 30
                })
            });
            setLogs(prev => [`[SUCCESS] Deployed node: ${fullDomain}`, ...prev]);
        } catch (e) {
            setLogs(prev => [`[FAIL] Failed to deploy ${fullDomain}`, ...prev]);
        }
        
        setProgress(Math.round(((i + 1) / count) * 100));
        await new Promise(r => setTimeout(r, 200)); // Throttle
    }
    
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Clone Multi-Master</h2>
        <p className="text-slate-400">Industrial bulk generation of proxied subdomains with polymorphic honey-tokens.</p>
      </header>

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
        <div className="max-w-xl space-y-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Select Base Domain</label>
            <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500">
              <option>shop.official-offer.site</option>
              <option>blog.daily-finance.online</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subdomain Count ({count})</label>
              <span className="text-[10px] px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md font-bold">MAX 50</span>
            </div>
            <input 
              type="range" min="1" max="50" 
              value={count} 
              onChange={e => setCount(parseInt(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-900 h-3 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50 border-dashed space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Polymorphic Trap Generator</h4>
            <p className="text-xs text-slate-500">Each subdomain will receive a unique, SHA-256 salted honey-token path to prevent detection patterns.</p>
            <div className="flex gap-4">
               <div className="flex-1 p-3 bg-slate-800 rounded-lg text-xs font-mono text-cyan-400">/lib/auth_v9x2.php</div>
               <div className="flex-1 p-3 bg-slate-800 rounded-lg text-xs font-mono text-cyan-400">/wp-util_j4n1.js</div>
            </div>
          </div>

          <button 
            onClick={startGeneration}
            disabled={isGenerating}
            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${
              isGenerating ? 'bg-slate-700 text-slate-400' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
            }`}
          >
            {isGenerating ? `Generating (${progress}%)...` : 'Execute Bulk Generation'}
          </button>
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden flex flex-col h-64">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-200">Execution Log</h3>
          <span className="text-xs text-slate-500">{logs.length} events</span>
        </div>
        <div className="p-4 overflow-y-auto font-mono text-xs space-y-2 flex-1 custom-scrollbar">
            {logs.length === 0 && <span className="text-slate-600 italic">Waiting for execution...</span>}
            {logs.map((log, i) => (
                <div key={i} className={log.includes('FAIL') ? 'text-rose-400' : 'text-emerald-400'}>{log}</div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MultiMasterPage;