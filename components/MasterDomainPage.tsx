import React, { useState, useEffect, useMemo } from 'react';
import { DomainConfig } from '../types.ts';

const MasterDomainPage: React.FC = () => {
  const [domains, setDomains] = useState<DomainConfig[]>([]);
  const [editingDomain, setEditingDomain] = useState<DomainConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real app, you would fetch this list from the worker KV via a GET endpoint.
    // For safety, we keep the list local or empty for now.
    setIsLoading(false);
  }, []);

  const filteredDomains = useMemo(() => {
    return domains.filter(d => d.domainName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [domains, searchTerm]);

  const addDomain = () => {
    const newDomain: DomainConfig = {
      id: Math.random().toString(36).substr(2, 9),
      domainName: '',
      status: 'pending',
      syncStatus: 'pending',
      moneyUrl: '',
      safeUrl: '',
      botThreshold: 30,
      ghostReferrer: 'https://google.com',
      isGhostReferrerEnabled: false,
      isDeepStealth: true,
      isHoneyToken: false,
      isRadixProtection: false,
      isNoReferrer: true
    };
    setEditingDomain(newDomain);
  };

  const saveConfig = async (updated: DomainConfig) => {
    // Optimistic UI Update
    setDomains(prev => {
      const exists = prev.find(d => d.id === updated.id);
      const deployingState: DomainConfig = { ...updated, status: 'active', syncStatus: 'deploying' };
      if (exists) return prev.map(d => d.id === updated.id ? deployingState : d);
      return [...prev, deployingState];
    });
    setEditingDomain(null);

    const gatewayUrl = localStorage.getItem('cf_gateway_url');

    if (!gatewayUrl) {
       updateStatus(updated.id, 'error', 'Gateway URL Missing in Settings');
       return;
    }

    try {
      // Sync to Worker Edge
      const res = await fetch(`${gatewayUrl}/api/v1/admin/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer industrial_stealth_token`
        },
        body: JSON.stringify(updated)
      });

      if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Worker Rejected Config");
      }

      updateStatus(updated.id, 'synced');
    } catch (e: any) {
      console.error("Deploy Failure", e);
      updateStatus(updated.id, 'error', e.message);
    }
  };

  const updateStatus = (id: string, status: 'synced' | 'error', msg?: string) => {
    setDomains(prev => prev.map(d => d.id === id ? { ...d, syncStatus: status, lastSyncError: msg } : d));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Master Registry</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">High-Frequency Edge Gateways</p>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <input 
            type="text"
            placeholder="Search Registry..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-xs text-slate-300 font-bold uppercase tracking-widest focus:border-cyan-500 outline-none w-full md:w-64"
          />
          <button 
            onClick={addDomain}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-2xl transition-all shadow-xl flex items-center gap-2 uppercase text-xs tracking-widest"
          >
            <i className="fas fa-plus"></i> Initialize
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
            <tr>
              <th className="px-10 py-6">Node Identity</th>
              <th className="px-10 py-6">Protection Matrix</th>
              <th className="px-10 py-6">Deployment Status</th>
              <th className="px-10 py-6 text-right">Settings</th>
            </tr>
          </thead>
          <tbody className="text-[11px] font-mono">
            {isLoading ? (
              <tr><td colSpan={4} className="px-8 py-24 text-center text-slate-600 font-black animate-pulse uppercase tracking-widest">Pulsing Edge Registry...</td></tr>
            ) : filteredDomains.length === 0 ? (
              <tr><td colSpan={4} className="px-8 py-24 text-center text-slate-700 font-black uppercase tracking-widest">No active nodes registered.</td></tr>
            ) : filteredDomains.map((domain, index) => (
              <tr 
                key={domain.id} 
                className={`border-b border-slate-800/30 transition-colors hover:bg-cyan-500/5 ${index % 2 === 0 ? 'bg-slate-900/40' : 'bg-transparent'}`}
              >
                <td className="px-10 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${domain.status === 'active' ? 'bg-cyan-500 shadow-[0_0_12px_#22d3ee]' : 'bg-slate-700'}`}></div>
                    <span className="text-white font-bold tracking-tight">{domain.domainName || 'UNLINKED_HOST'}</span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex gap-6">
                    <Indicator enabled={domain.isDeepStealth} icon="fa-user-ninja" label="Cloak" />
                    <Indicator enabled={domain.isNoReferrer} icon="fa-eye-slash" label="Mask" />
                    <Indicator enabled={domain.isHoneyToken} icon="fa-virus-slash" label="Trap" />
                  </div>
                </td>
                <td className="px-10 py-6">
                   <StatusBadge status={domain.syncStatus} error={domain.lastSyncError} />
                </td>
                <td className="px-10 py-6 text-right">
                  <button onClick={() => setEditingDomain(domain)} className="p-3 bg-slate-800 hover:bg-cyan-500 hover:text-slate-900 rounded-xl text-slate-400 transition-all shadow-lg">
                    <i className="fas fa-sliders-h"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingDomain && (
        <ConfigPopup 
          domain={editingDomain} 
          onClose={() => setEditingDomain(null)} 
          onSave={saveConfig}
        />
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status?: string, error?: string }> = ({ status, error }) => {
  if (status === 'deploying') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest">
        <i className="fas fa-circle-notch animate-spin text-[8px]"></i> Deploying
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full text-[9px] font-black uppercase tracking-widest group relative cursor-help">
        <i className="fas fa-exclamation-triangle"></i> Sync Fail
        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-rose-950 border border-rose-800 rounded-lg text-[9px] text-white hidden group-hover:block z-10">
          {error || 'Unknown Gateway Error'}
        </div>
      </div>
    );
  }
  if (status === 'synced') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest">
        <i className="fas fa-check-circle"></i> Active
      </div>
    );
  }
  return <span className="text-slate-600 text-[9px] font-black uppercase">Pending</span>;
};

const Indicator: React.FC<{ enabled: boolean; icon: string; label: string }> = ({ enabled, icon, label }) => (
  <div className={`flex items-center gap-1.5 transition-all ${enabled ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-slate-800 opacity-20'}`}>
    <i className={`fas ${icon} text-[10px]`}></i>
    <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
  </div>
);

const ConfigPopup: React.FC<{ domain: DomainConfig; onClose: () => void; onSave: (d: DomainConfig) => void }> = ({ domain, onClose, onSave }) => {
  const [data, setData] = useState(domain);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Honey Token Path
  const honeyPath = useMemo(() => {
    return `/admin_${Math.random().toString(36).substring(7)}/login.php`;
  }, []);

  const handleReset = () => {
    setData({
      ...data,
      moneyUrl: '',
      safeUrl: '',
      botThreshold: 30,
      isDeepStealth: true,
      isHoneyToken: false
    });
    setError(null);
  };

  const handleSave = () => {
    // Validation
    const urlRegex = /^(https?:\/\/)/;
    if (!urlRegex.test(data.moneyUrl) || !urlRegex.test(data.safeUrl)) {
      setError("Protocols Required: URLs must start with http:// or https://");
      return;
    }
    if (!data.domainName) {
      setError("Identity Error: Domain Name cannot be empty.");
      return;
    }
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Gateway Deployment</h3>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors"><i className="fas fa-times text-lg"></i></button>
        </div>
        <div className="p-10 space-y-8">
          
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold uppercase flex items-center gap-2">
              <i className="fas fa-ban"></i> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Hostname</label>
              <input type="text" value={data.domainName} onChange={e => setData({...data, domainName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-200 focus:border-cyan-500 outline-none font-mono text-xs" placeholder="example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Money Link (Ingress)</label>
              <input type="text" value={data.moneyUrl} onChange={e => setData({...data, moneyUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-200 focus:border-cyan-500 outline-none font-mono text-xs" placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mirror Origin (Cloak)</label>
            <input type="text" value={data.safeUrl} onChange={e => setData({...data, safeUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-200 focus:border-cyan-500 outline-none font-mono text-xs" placeholder="https://..." />
          </div>
          
          {data.isHoneyToken && (
             <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex justify-between items-center">
               <div>
                 <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Active Trap Path</p>
                 <p className="text-[10px] font-mono text-slate-400 mt-1">{honeyPath}</p>
               </div>
               <i className="fas fa-virus text-amber-500/50 text-xl"></i>
             </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
             <ToggleBtn active={data.isDeepStealth} onClick={() => setData({...data, isDeepStealth: !data.isDeepStealth})} label="Stealth" icon="fa-ghost" />
             <ToggleBtn active={data.isNoReferrer} onClick={() => setData({...data, isNoReferrer: !data.isNoReferrer})} label="No Ref" icon="fa-eye-slash" />
             <ToggleBtn active={data.isHoneyToken} onClick={() => setData({...data, isHoneyToken: !data.isHoneyToken})} label="Traps" icon="fa-virus" />
             <ToggleBtn active={data.isRadixProtection} onClick={() => setData({...data, isRadixProtection: !data.isRadixProtection})} label="Radix" icon="fa-shield" />
          </div>
        </div>
        <div className="p-8 bg-slate-950 border-t border-slate-800 flex justify-between">
          <button 
            onClick={handleReset}
            className="px-6 py-5 text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors"
          >
            Reset Defaults
          </button>
          <button 
            onClick={handleSave} 
            className="px-12 py-5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-2xl transition-all shadow-xl uppercase text-xs tracking-widest"
          >
            Establish Gateway
          </button>
        </div>
      </div>
    </div>
  );
};

const ToggleBtn: React.FC<{ active: boolean; onClick: () => void; label: string; icon: string }> = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`py-5 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${active ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-700'}`}>
    <i className={`fas ${icon} text-xs ${active ? 'animate-pulse' : ''}`}></i>
    {label}
  </button>
);

export default MasterDomainPage;