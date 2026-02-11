
import React, { useState } from 'react';

const SafeSitePage: React.FC = () => {
  const [dnsStatus, setDnsStatus] = useState<'idle' | 'pushing' | 'success'>('idle');

  const pushDNS = () => {
    setDnsStatus('pushing');
    setTimeout(() => {
      setDnsStatus('success');
      // Reset after animation
      setTimeout(() => setDnsStatus('idle'), 5000);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Mirror Ecosystem</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Legitimate Content Cloning & Automated DNS Integrity</p>
      </header>

      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
              <i className="fas fa-server text-cyan-500"></i> Mirror Configuration
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-3 tracking-widest">Global Safe Site Origin</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="https://official-news.net"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-sm"
                  />
                  <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors">Verify</button>
                </div>
              </div>
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 text-xl">
                  <i className="fas fa-fingerprint"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Origin Signature Verified</h4>
                  <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">Dynamic header scrubbing active for proxy sessions.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
              <i className="fas fa-envelope-shield text-emerald-500"></i> Reputation Defense
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-widest">
              Instantly deploy SPF, DMARC, and DKIM records via Cloudflare API. This increases domain health scores to mitigate manual registrar abuse investigations.
            </p>
            
            <div className="space-y-6">
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-slate-500 space-y-3 shadow-inner">
                <div className="flex gap-4">
                  <span className="text-cyan-500 font-black w-14">SPF:</span>
                  <span className="truncate">v=spf1 include:_spf.google.com ~all</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-cyan-500 font-black w-14">DMARC:</span>
                  <span className="truncate">v=DMARC1; p=quarantine; rua=mailto:admin@domain.com</span>
                </div>
              </div>

              <button 
                onClick={pushDNS}
                disabled={dnsStatus === 'pushing'}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all relative overflow-hidden group ${
                  dnsStatus === 'pushing' ? 'bg-slate-800 text-slate-600 cursor-not-allowed' :
                  dnsStatus === 'success' ? 'bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-[1.02]' :
                  'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_25px_rgba(34,211,238,0.2)]'
                }`}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {dnsStatus === 'pushing' ? (
                    <>
                      <i className="fas fa-satellite-dish animate-pulse"></i>
                      <span>Deploying Logic...</span>
                    </>
                  ) : dnsStatus === 'success' ? (
                    <>
                      <i className="fas fa-check-double animate-bounce"></i>
                      <span>DNS Shield Active</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-bolt group-hover:animate-pulse"></i>
                      <span>Push DNS Automation</span>
                    </>
                  )}
                </div>
                {dnsStatus === 'pushing' && <div className="absolute inset-0 bg-slate-700 animate-pulse opacity-20"></div>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
          icon="fa-user-secret" 
          title="Anti-Audit Scrub" 
          desc="Force removes Cloudflare-specific cookies and trace headers from proxied mirror responses." 
        />
        <FeatureCard 
          icon="fa-network-wired" 
          title="Edge Masking" 
          desc="Proxies Mirror content at the worker level with relative path rewriting to avoid domain leaks." 
        />
        <FeatureCard 
          icon="fa-shield-halved" 
          title="Registry Defense" 
          desc="Rotates mirror content every 24h to prevent scanners from building cross-domain fingerprints." 
        />
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all group">
    <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-xl text-cyan-500 mb-6 group-hover:scale-110 transition-transform shadow-lg">
      <i className={`fas ${icon}`}></i>
    </div>
    <h4 className="text-base font-black text-white mb-3 uppercase tracking-tighter">{title}</h4>
    <p className="text-[10px] text-slate-600 font-bold uppercase leading-relaxed tracking-widest">{desc}</p>
  </div>
);

export default SafeSitePage;
