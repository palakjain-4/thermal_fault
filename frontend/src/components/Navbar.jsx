import React, { useState } from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  UploadCloud, 
  History, 
  Cpu, 
  Database,
  Sliders,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, systemStatus }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload & Analyse', icon: UploadCloud },
    { id: 'preprocess', label: 'Image Preprocessing', icon: Sliders },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'model', label: 'Model Intelligence', icon: Cpu },
  ];

  const isDbOnline = systemStatus?.database?.connected ?? systemStatus?.mongodb_connected;

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#FDC3D1]/70 shadow-[0_4px_25px_-4px_rgba(253,168,191,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand & Wordmark */}
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FDA8BF] to-[#FB8CAC] flex items-center justify-center shadow-[0_6px_20px_rgba(251,140,172,0.35)] group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-2xl font-bold tracking-tight text-[#44101D] group-hover:text-[#FB8CAC] transition-colors">
                  ThermalFault
                </span>
                <span className="font-serif italic text-base text-[#FB8CAC] font-semibold">
                  Studio
                </span>
                <span className="text-[10px] font-medium tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-[#FFEAEF] text-[#8F3F56] border border-[#FDC3D1]">
                  ✦ ResNet-18
                </span>
              </div>
              <p className="text-[11px] text-[#8F3F56]/80 hidden sm:block font-medium tracking-wide">
                Fairy-Pink Thermographic Diagnostics &amp; Inspection
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#FFF0F3] p-1.5 rounded-full border border-[#FDC3D1]/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FB8CAC] text-white shadow-[0_4px_14px_rgba(251,140,172,0.4)]'
                      : 'text-[#8F3F56] hover:text-[#44101D] hover:bg-white/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* System Status Indicators (Right) */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Database Status */}
            <div 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isDbOnline 
                  ? 'bg-white text-[#5E1D2D] border-[#FDC3D1] shadow-sm' 
                  : 'bg-[#FFDBDB] text-[#44101D] border-[#FDA8BF]'
              }`}
              title={isDbOnline ? "MongoDB connected & ready" : "MongoDB service is offline"}
            >
              <Database className="w-3.5 h-3.5 text-[#FB8CAC]" />
              <span className="text-[#8F3F56]">Database:</span>
              <span className="font-semibold">{isDbOnline ? 'Connected' : 'Offline'}</span>
              <span className={`w-2 h-2 rounded-full ${isDbOnline ? 'bg-[#FB8CAC] animate-pulse' : 'bg-[#FDA8BF]'}`} />
            </div>

            {/* Model Version Tag */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#8F3F56] border border-[#FDC3D1] text-xs font-medium shadow-sm">
              <span className="text-[#FB8CAC]">✧</span>
              <span>{systemStatus?.model?.version || 'v1.2.0'}</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-[#FFEAEF] text-[#5E1D2D] hover:bg-[#FFDBDB] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#FDC3D1]/60 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#FB8CAC] text-white'
                      : 'text-[#8F3F56] hover:bg-[#FFEAEF]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
}
