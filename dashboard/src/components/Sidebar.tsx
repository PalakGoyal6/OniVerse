import React from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  ShieldAlert,
  Sliders,
  Scale,
  FileSearch,
  CheckCircle,
  Settings,
  Search,
  Globe,
  Zap,
} from 'lucide-react';
import { OnionLogo } from './OnionLogo';
import { useLanguage } from '../i18n';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openDisputesCount: number;
  onOpenLanding: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openDisputesCount,
  onOpenLanding,
}) => {
  const { language, t } = useLanguage();

  const navItems = [
    { id: 'overview', label: t('navOverview'), icon: LayoutDashboard },
    {
      id: 'lab',
      label: language === 'hi' ? 'एआई गुणवत्ता लैब' : language === 'mr' ? 'एआय गुणवत्ता लॅब' : 'AI Testing Lab',
      icon: Zap,
      badge: 'Live AI',
    },
    { id: 'reports', label: t('navReports'), icon: FileCheck2 },
    {
      id: 'consistency',
      label: t('navConsistency'),
      icon: Scale,
      badge: language === 'hi' ? 'निष्पक्ष' : language === 'mr' ? 'अचूक' : 'Zero Bias',
    },
    {
      id: 'disputes',
      label: t('navDisputes'),
      icon: ShieldAlert,
      badgeCount: openDisputesCount,
    },
    { id: 'rules', label: t('navRules'), icon: Sliders },
    {
      id: 'audit',
      label: t('navAudit'),
      icon: FileSearch,
      badge: language === 'hi' ? 'सीलबंद' : language === 'mr' ? 'सुरक्षित' : 'Sealed',
    },
    { id: 'verify', label: t('navVerify'), icon: Search },
    { id: 'settings', label: t('navSettings'), icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-20 shadow-sm">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200">
          <OnionLogo size="md" />
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation & Landing Page Link */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
        <button
          onClick={onOpenLanding}
          className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-700" />
          <span>{language === 'hi' ? 'सार्वजनिक लैंडिंग पेज देखें' : language === 'mr' ? 'सार्वजनिक मुख्यपृष्ठ पहा' : 'View Public Landing Page'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>{language === 'hi' ? 'एगमार्क 2026.1 सक्रिय' : language === 'mr' ? 'एगमार्क 2026.1 सक्रिय' : 'AGMARK 2026.1 Active'}</span>
        </div>
        <div className="text-[10px] text-slate-500 font-medium">
          Smart India Hackathon • SIH 2026
        </div>
      </div>
    </aside>
  );
};
