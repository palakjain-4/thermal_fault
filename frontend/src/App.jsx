import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import PreprocessingPage from './pages/PreprocessingPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import ModelInfoPage from './pages/ModelInfoPage';
import { checkHealth } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  const fetchHealth = async () => {
    try {
      const data = await checkHealth();
      setSystemStatus(data);
    } catch (err) {
      setSystemStatus({
        status: 'error',
        database: { connected: false },
        model: { version: 'v1.2.0' },
      });
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalysisComplete = (result) => {
    setCurrentAnalysis(result);
    setActiveTab('results');
    fetchHealth();
  };

  const handleViewAnalysis = (analysisOrType) => {
    if (analysisOrType === 'all') {
      setActiveTab('history');
    } else {
      setCurrentAnalysis(analysisOrType);
      setActiveTab('results');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF7F9] text-[#541525]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            onStartAnalysis={() => setActiveTab('upload')}
            onViewAnalysis={handleViewAnalysis}
            systemStatus={systemStatus}
          />
        )}

        {activeTab === 'upload' && (
          <UploadPage
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {activeTab === 'preprocess' && (
          <PreprocessingPage
            onProceedToAnalysis={(file) => {
              setActiveTab('upload');
            }}
          />
        )}

        {activeTab === 'results' && (
          <ResultsPage
            analysis={currentAnalysis}
            onNewAnalysis={() => setActiveTab('upload')}
            onBackToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            onViewAnalysis={handleViewAnalysis}
            onNewAnalysis={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'model' && (
          <ModelInfoPage />
        )}
      </main>

      {/* Fairy-Pink Delicate Footer */}
      <footer className="border-t border-[#FDC3D1]/70 bg-white/70 backdrop-blur-md py-6 text-center text-xs text-[#8F3F56]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-editorial text-sm font-bold text-[#44101D]">ThermalFault Studio</span>
            <span className="text-[#FDA8BF]">✧</span>
            <span>PyTorch ResNet-18 &amp; OpenCV Thermal Pipeline</span>
          </div>
          <span className="text-[11px] font-medium tracking-wide">
            Automated Infrared Diagnostic Assistant • Designed with Taste ✨
          </span>
        </div>
      </footer>
    </div>
  );
}
