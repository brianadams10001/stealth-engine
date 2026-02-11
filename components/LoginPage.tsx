import React, { useState } from 'react';

const LoginPage: React.FC<{ onLogin: (token: string) => void }> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const form = e.target as HTMLFormElement;
      const username = (form.elements.namedItem('username') as HTMLInputElement).value;
      const password = (form.elements.namedItem('password') as HTMLInputElement).value;

      if (username === 'admin' && password === 'root') {
        onLogin('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.industrial_stealth_token');
      } else {
        setError('CRITICAL: IDENTITY MISMATCH. UNAUTHORIZED ACCESS ATTEMPT LOGGED.');
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-cyan-500 mx-auto flex items-center justify-center rounded-[1.5rem] shadow-[0_0_40px_rgba(34,211,238,0.4)] mb-6">
            <i className="fas fa-terminal text-slate-900 text-3xl"></i>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">GATEWAY.PRO</h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3">Industrial Cloaking Node v3.2</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl backdrop-blur-2xl">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Operator Identifier</label>
              <input 
                name="username" type="text" required placeholder="admin"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-200 focus:border-cyan-500 outline-none transition-all font-mono text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Cipher</label>
              <input 
                name="password" type="password" required placeholder="root"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-200 focus:border-cyan-500 outline-none transition-all font-mono text-sm"
              />
            </div>

            {error && (
              <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                <i className="fas fa-shield-alt text-lg"></i>
                <span>{error}</span>
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-900 font-black rounded-2xl transition-all shadow-[0_15px_30px_rgba(34,211,238,0.2)] uppercase text-xs tracking-widest flex items-center justify-center gap-3"
            >
              {loading ? <i className="fas fa-sync-alt animate-spin"></i> : <i className="fas fa-key"></i>}
              <span>{loading ? 'Decrypting Session...' : 'Establish Secure Link'}</span>
            </button>
          </div>
        </form>
        
        <p className="text-center text-[9px] text-slate-600 mt-10 uppercase font-black tracking-widest opacity-40">
          Proprietary Intelligence Core. All Packet Ingress Monitored.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;