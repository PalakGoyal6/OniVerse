import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { ReportsBrowserPage } from './pages/ReportsBrowserPage';
import { ConsistencyPage } from './pages/ConsistencyPage';
import { DisputesPage } from './pages/DisputesPage';
import { RulesEditorPage } from './pages/RulesEditorPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { LandingPage } from './pages/LandingPage';
import { PublicVerifyPage } from './pages/PublicVerifyPage';
import { SettingsPage } from './pages/SettingsPage';
import { AiTestingLabPage } from './pages/AiTestingLabPage';
import { LanguageProvider } from './i18n';
import {
  fetchOverview,
  fetchReports,
  fetchCentres,
  fetchInspectors,
  fetchDisputes,
} from './api';
import {
  StatsOverview,
  ReportSummary,
  CentreComparison,
  InspectorConsistency,
  DisputeItem,
} from './types';

const DashboardContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard' | 'verify'>('landing');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  const [overview, setOverview] = useState<StatsOverview>({
    total_lots_today: 48,
    total_lots_week: 312,
    total_weight_kg_graded: 15480.0,
    average_grade_a_pct: 74.8,
    average_urs_pct: 17.9,
    average_rejected_pct: 7.3,
    open_disputes_count: 2,
    active_centres_count: 5,
    total_inspectors_active: 14,
  });

  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [centres, setCentres] = useState<CentreComparison[]>([]);
  const [inspectors, setInspectors] = useState<InspectorConsistency[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [ov, rep, cen, ins, disp] = await Promise.all([
        fetchOverview(),
        fetchReports(),
        fetchCentres(),
        fetchInspectors(),
        fetchDisputes(),
      ]);
      setOverview(ov);
      setReports(rep);
      setCentres(cen);
      setInspectors(ins);
      setDisputes(disp);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Landing Page View
  if (viewMode === 'landing') {
    return (
      <LandingPage
        onEnterDashboard={() => setViewMode('dashboard')}
        onOpenVerify={() => setViewMode('verify')}
      />
    );
  }

  // Public Verify Page View
  if (viewMode === 'verify') {
    return <PublicVerifyPage onBack={() => setViewMode('dashboard')} />;
  }

  // Supervisor Dashboard View
  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-900 antialiased font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'verify') {
            setViewMode('verify');
          } else {
            setActiveTab(tab);
          }
        }}
        openDisputesCount={disputes.filter((d) => d.status === 'OPEN').length}
        onOpenLanding={() => setViewMode('landing')}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onRefresh={loadData}
          isRefreshing={isRefreshing}
          demoMode={demoMode}
          onToggleDemoMode={() => setDemoMode(!demoMode)}
        />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewPage
              overview={overview}
              centres={centres}
              reports={reports}
              onSelectReport={() => setActiveTab('reports')}
            />
          )}

          {activeTab === 'lab' && <AiTestingLabPage />}

          {activeTab === 'reports' && (
            <ReportsBrowserPage
              reports={reports}
              onSelectReport={(id) => console.log('Selected report', id)}
            />
          )}

          {activeTab === 'consistency' && (
            <ConsistencyPage inspectors={inspectors} />
          )}

          {activeTab === 'disputes' && <DisputesPage disputes={disputes} />}

          {activeTab === 'rules' && <RulesEditorPage />}

          {activeTab === 'audit' && <AuditLogPage />}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
};

export default App;
