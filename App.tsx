import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard.tsx';
import MasterDomainPage from './components/MasterDomainPage.tsx';
import SafeSitePage from './components/SafeSitePage.tsx';
import MultiMasterPage from './components/MultiMasterPage.tsx';
import SettingsPage from './components/SettingsPage.tsx';
import LoginPage from './components/LoginPage.tsx';
import { NavItem } from './types.ts';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<NavItem>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('stealth_auth_token');
    if (token === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.industrial_stealth_token') {
      setIsAuthenticated(true);
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('stealth_auth_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('stealth_auth_token');
    setIsAuthenticated(false);
  };

  if (isInitializing) return null;

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'master-domain': return <MasterDomainPage />;
      case 'safe-site': return <SafeSitePage />;
      case 'multi-master': return <MultiMasterPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950">
      <nav className={`${isMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-72 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 z-50`}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_12px_#22d3ee]"></div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Cloak.PRO</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Industrial Node v3.1</p>
        </div>
        
        <div className="mt-6 flex flex-col gap-2 px-4">
          <SidebarButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fa-chart-pie" label="Command Center" />
          <SidebarButton active={activeTab === 'master-domain'} onClick={() => setActiveTab('master-domain')} icon="fa-network-wired" label="Gateways" />
          <SidebarButton active={activeTab === 'multi-master'} onClick={() => setActiveTab('multi-master')} icon="fa-layer-group" label="Bulk Forge" />
          <SidebarButton active={activeTab === 'safe-site'} onClick={() => setActiveTab('safe-site')} icon="fa-shield-halved" label="Ecosystem" />
          <SidebarButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon="fa-sliders-h" label="Infrastructure" />
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800/50 bg-slate-950/50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest text-slate-500">
            <i className="fas fa-power-off"></i>
            <span>Purge Session</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const SidebarButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}>
    <i className={`fas ${icon} text-xs transition-transform group-hover:scale-110`}></i>
    <span className="font-bold text-[11px] uppercase tracking-widest">{label}</span>
  </button>
);

export default App;