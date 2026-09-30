import React from 'react';
import {
  RefreshCw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Globe,
} from 'lucide-react';
import { useLanguage, Language } from '../i18n';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  demoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  demoMode,
  onToggleDemoMode,
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
      {/* Left: System Sync Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>{t('systemLive')}</span>
        </div>

        {/* Demo Mode Badge */}
        {demoMode && (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span>{t('demoModeActive')}</span>
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Multilingual Selector (English / Hindi / Marathi) */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
          <Globe className="w-3.5 h-3.5 text-emerald-800 ml-1.5 mr-1" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="en">English (ENG)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
          </select>
        </div>

        {/* Demo Mode Switcher */}
        <button
          onClick={onToggleDemoMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
            demoMode
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="Toggle Presentation Demo Mode"
        >
          {demoMode ? (
            <ToggleRight className="w-4 h-4 text-amber-700" />
          ) : (
            <ToggleLeft className="w-4 h-4 text-slate-400" />
          )}
          <span>{language === 'hi' ? 'डेमो मोड' : language === 'mr' ? 'डेमो मोड' : 'Demo Mode'}</span>
        </button>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition border border-slate-200 shadow-sm"
          title="Refresh Data"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-700' : ''}`}
          />
          <span>{t('refresh')}</span>
        </button>

        <div className="w-px h-6 bg-slate-200"></div>

        {/* Supervisor Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-black text-xs">
            APMC
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-900">Dr. Suresh Shinde</div>
            <div className="text-[10px] text-slate-500 font-medium">
              {language === 'hi' ? 'मुख्य पर्यवेक्षक • नासिक' : language === 'mr' ? 'मुख्य पर्यवेक्षक • नाशिक' : 'Chief Supervisor • Nashik'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
