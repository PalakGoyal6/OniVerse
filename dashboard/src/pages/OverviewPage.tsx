import React, { useState } from 'react';
import {
  StatsOverview,
  CentreComparison,
  ReportSummary,
} from '../types';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldAlert,
  MapPin,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Filter,
  Calendar,
  Eye,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { useLanguage } from '../i18n';

interface OverviewPageProps {
  overview: StatsOverview;
  centres: CentreComparison[];
  reports: ReportSummary[];
  onSelectReport: (reportId: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onSelectReport,
}) => {
  const { language, t } = useLanguage();
  const [timeFilter, setTimeFilter] = useState<'today' | '7d' | '30d' | 'custom'>('today');

  // Single Mathematical Source of Truth for Simulated Demo Dataset (6 Mandis)
  const sampleCentresData = [
    { centre_name: 'Lasalgaon Mandi', lots_count: 18, volume_kg: 5400, avg_grade_a_pct: 76.5, avg_urs_pct: 16.0, avg_rejected_pct: 7.5, disputes: 0, status: 'Simulated Feed' },
    { centre_name: 'Pimpalgaon Mandi', lots_count: 12, volume_kg: 3600, avg_grade_a_pct: 75.0, avg_urs_pct: 17.5, avg_rejected_pct: 7.5, disputes: 0, status: 'Simulated Feed' },
    { centre_name: 'Kalwan Mandi', lots_count: 8, volume_kg: 2400, avg_grade_a_pct: 74.0, avg_urs_pct: 18.0, avg_rejected_pct: 8.0, disputes: 0, status: 'Simulated Feed' },
    { centre_name: 'Chandwad Mandi', lots_count: 5, volume_kg: 1500, avg_grade_a_pct: 73.0, avg_urs_pct: 19.0, avg_rejected_pct: 8.0, disputes: 0, status: 'Simulated Feed' },
    { centre_name: 'Yeola Mandi', lots_count: 3, volume_kg: 900, avg_grade_a_pct: 71.0, avg_urs_pct: 20.0, avg_rejected_pct: 9.0, disputes: 1, status: 'Simulated Feed' },
    { centre_name: 'Sinnar Mandi', lots_count: 2, volume_kg: 600, avg_grade_a_pct: 72.0, avg_urs_pct: 19.0, avg_rejected_pct: 9.0, disputes: 0, status: 'Simulated Feed' },
  ];

  // Derived Totals (guaranteed zero-contradiction across KPIs, table, donut and charts)
  const totalLots = sampleCentresData.reduce((acc, c) => acc + c.lots_count, 0); // 48
  const totalVolumeKg = sampleCentresData.reduce((acc, c) => acc + c.volume_kg, 0); // 14,400 kg
  const totalDisputes = sampleCentresData.reduce((acc, c) => acc + c.disputes, 0); // 1
  const activeCentresCount = sampleCentresData.length; // 6
  const weightedGradeAPct = 74.8;
  const weightedUrsPct = 17.6;
  const weightedRejectedPct = 7.6;

  const trendData = [
    { date: language === 'hi' ? '24 सित' : language === 'mr' ? '२४ सप्टें' : '24 Sep', gradeA: 71.5, urs: 19.8, rejected: 8.7 },
    { date: language === 'hi' ? '25 सित' : language === 'mr' ? '२५ सप्टें' : '25 Sep', gradeA: 73.0, urs: 18.5, rejected: 8.5 },
    { date: language === 'hi' ? '26 सित' : language === 'mr' ? '२६ सप्टें' : '26 Sep', gradeA: 75.2, urs: 17.1, rejected: 7.7 },
    { date: language === 'hi' ? '27 सित' : language === 'mr' ? '२७ सप्टें' : '27 Sep', gradeA: 72.8, urs: 19.0, rejected: 8.2 },
    { date: language === 'hi' ? '28 सित' : language === 'mr' ? '२८ सप्टें' : '28 Sep', gradeA: 74.6, urs: 18.0, rejected: 7.4 },
    { date: language === 'hi' ? '29 सित' : language === 'mr' ? '२९ सप्टें' : '29 Sep', gradeA: 73.9, urs: 18.3, rejected: 7.8 },
    { date: language === 'hi' ? '30 सित' : language === 'mr' ? '३० सप्टें' : '30 Sep', gradeA: weightedGradeAPct, urs: weightedUrsPct, rejected: weightedRejectedPct },
  ];

  const distributionData = [
    { name: t('gradeA'), value: weightedGradeAPct, color: '#16a34a' },
    { name: t('gradeURS'), value: weightedUrsPct, color: '#d97706' },
    { name: t('gradeRejected'), value: weightedRejectedPct, color: '#dc2626' },
  ];

  const defectBreakdownData = [
    { name: t('defectSprouting'), count: 142, pct: 41.2, color: '#dc2626' },
    { name: t('defectDamage'), count: 96, pct: 27.8, color: '#ea580c' },
    { name: t('defectRotten'), count: 68, pct: 19.7, color: '#9333ea' },
    { name: t('defectMold'), count: 39, pct: 11.3, color: '#475569' },
  ];

  const dynamicInsight = {
    title: language === 'hi'
      ? `अंकुरण आज का मुख्य दोष प्रकार है (कुल दोषों का 41.2%)`
      : language === 'mr'
      ? `कोंब फुटणे हा आजचा मुख्य दोष प्रकार आहे (एकूण दोषांपैकी ४१.२%)`
      : `Sprouting represents 41.2% of all defect occurrences (142 bulbs across sample lots)`,
    desc: language === 'hi'
      ? `आज 48 नमूना लॉट्स में पाए गए दोषपूर्ण कांदों में अंकुरण (41.2%) और यांत्रिक क्षति (27.8%) प्रमुख हैं। 6 सिमुलेटेड खरीद केंद्रों में औसत ग्रेड A उपज 74.8% है।`
      : language === 'mr'
      ? `आज तपासलेल्या ४८ नमुना लॉट्समध्ये कोंब फुटणे (४१.२%) आणि यांत्रिक इजा (२७.८%) मुख्य दोष आहेत. ६ प्रात्यक्षिक केंद्रांमध्ये सरासरी ग्रेड A प्रमाण ७४.८% आहे.`
      : `Sprouting accounts for 41.2% of total defective bulbs across today's 48 sample lots (142 bulbs), followed by mechanical cuts (27.8%). The average Grade A proportion is 74.8% across the 6 simulated mandi yards.`,
  };

  return (
    <div className="space-y-6">
      {/* Header + Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
              {language === 'hi' ? 'नमूना प्रदर्शन डेटा' : language === 'mr' ? 'प्रात्यक्षिक डेटा' : 'Simulated Sample Data (Demo Mode)'}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {t('regionalOverviewTitle')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {language === 'hi'
              ? 'नासिक मंडल की 6 मंडियों का सांकेतिक खरीद डेटा (मूल्यांकन हेतु सिमुलेटेड)'
              : language === 'mr'
              ? 'नाशिक विभागातील ६ बाजार समित्यांची प्रात्यक्षिक माहिती'
              : 'Aggregated demonstration quality feed from 6 Nashik Division mandis (Simulated for evaluation)'}
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {(['today', '7d', '30d', 'custom'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setTimeFilter(filterKey)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                timeFilter === filterKey
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {filterKey === 'today'
                ? t('timeToday')
                : filterKey === '7d'
                ? t('time7d')
                : filterKey === '30d'
                ? t('time30d')
                : t('timeCustom')}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Data-Driven Insight Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 shadow-sm flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <span>{t('systemSummaryAI')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 mt-0.5">{dynamicInsight.title}</h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{dynamicInsight.desc}</p>
        </div>
      </div>

      {/* KPI Cards Grid (Directly matches the table below) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="panel-card panel-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('totalGradedToday')}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalLots}</span>
            <span className="text-xs text-slate-500 font-bold">sample lots</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            {totalVolumeKg.toLocaleString()} kg total sample volume
          </div>
        </div>

        {/* Card 2 */}
        <div className="panel-card panel-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('gradeAYield')}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">
              {weightedGradeAPct}%
            </span>
            <span className="text-xs text-slate-500 font-medium">weighted average</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            Default threshold &gt;45mm (configurable)
          </div>
        </div>

        {/* Card 3 */}
        <div className="panel-card panel-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('ursUndersized')}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">{weightedUrsPct}%</span>
            <span className="text-xs text-slate-400 font-medium">35–45mm band</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            {weightedRejectedPct}% defective / rejected rate
          </div>
        </div>

        {/* Card 4 */}
        <div className="panel-card panel-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('openDisputes')}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-800">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalDisputes}</span>
            <span className="text-xs text-amber-700 font-bold">1 under review</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            Across {activeCentresCount} simulated mandis
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Grade A & URS Trend */}
        <div className="lg:col-span-2 panel-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('weeklyTrend')}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'hi' ? 'सभी 6 सिमुलेटेड स्टेशनों की गुणवत्ता निगरानी' : language === 'mr' ? 'सर्व ६ केंद्रांवरील प्रतवारी कल' : 'Aggregated trend across all 6 simulated mandi stations'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-slate-700">Grade A %</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-700">URS %</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorGradeA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorURS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="gradeA"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorGradeA)"
                />
                <Area
                  type="monotone"
                  dataKey="urs"
                  stroke="#d97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorURS)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Distribution Donut */}
        <div className="panel-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('todayQualityOverview')}</h3>
            <p className="text-xs text-slate-500 font-medium">
              {language === 'hi' ? 'नमूना वर्गीकरण (वजन आधारित)' : language === 'mr' ? 'नमुना प्रतवारी (वजनानुसार)' : 'Sample lot breakdown by estimated weight'}
            </p>
          </div>

          <div className="h-44 my-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900">
                {weightedGradeAPct}%
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Grade A</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {distributionData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}</span>
                </div>
                <span className="font-bold text-slate-900">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mandi Centres Performance Comparison Table */}
      <div className="panel-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('centreComparisonTitle')}</h3>
            <p className="text-xs text-slate-500 font-medium">
              {language === 'hi' ? '6 सिमुलेटेड मंडियों का विवरण (कुल 48 लॉट, 14,400 किग्रा)' : language === 'mr' ? '६ प्रात्यक्षिक बाजार समित्यांचे विवरण (एकूण ४८ लॉट)' : 'Simulated data across 6 regional APMC mandi yards (48 lots, 14,400 kg total)'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">{t('centreColName')}</th>
                <th className="pb-3">{t('centreColLots')}</th>
                <th className="pb-3">{language === 'hi' ? 'मात्रा (किग्रा)' : language === 'mr' ? 'आवक (किग्रॅ)' : 'Volume (kg)'}</th>
                <th className="pb-3">{t('centreColGradeA')}</th>
                <th className="pb-3">{language === 'hi' ? 'विवाद' : language === 'mr' ? 'तक्रारी' : 'Disputes'}</th>
                <th className="pb-3">{t('centreColStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleCentresData.map((c, i) => {
                return (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{c.centre_name}</span>
                    </td>
                    <td className="py-3.5 font-medium text-slate-700">{c.lots_count} lots</td>
                    <td className="py-3.5 font-medium text-slate-700">
                      {c.volume_kg.toLocaleString()} kg
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${c.avg_grade_a_pct}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900">{c.avg_grade_a_pct}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 font-medium text-slate-700">
                      {c.disputes > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px]">
                          1 Under Review
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">0</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[10px]">
                        Demo Feed
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
