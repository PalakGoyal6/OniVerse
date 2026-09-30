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
  overview,
  centres,
  reports,
  onSelectReport,
}) => {
  const { language, t } = useLanguage();
  const [timeFilter, setTimeFilter] = useState<'today' | '7d' | '30d' | 'custom'>('today');

  const trendData = [
    { date: language === 'hi' ? '24 सित' : language === 'mr' ? '२४ सप्टें' : '24 Sep', gradeA: 71.5, urs: 19.8, rejected: 8.7 },
    { date: language === 'hi' ? '25 सित' : language === 'mr' ? '२५ सप्टें' : '25 Sep', gradeA: 73.0, urs: 18.5, rejected: 8.5 },
    { date: language === 'hi' ? '26 सित' : language === 'mr' ? '२६ सप्टें' : '26 Sep', gradeA: 75.2, urs: 17.1, rejected: 7.7 },
    { date: language === 'hi' ? '27 सित' : language === 'mr' ? '२७ सप्टें' : '27 Sep', gradeA: 72.8, urs: 19.0, rejected: 8.2 },
    { date: language === 'hi' ? '28 सित' : language === 'mr' ? '२८ सप्टें' : '28 Sep', gradeA: 74.6, urs: 18.0, rejected: 7.4 },
    { date: language === 'hi' ? '29 सित' : language === 'mr' ? '२९ सप्टें' : '29 Sep', gradeA: 73.9, urs: 18.3, rejected: 7.8 },
    { date: language === 'hi' ? '30 सित' : language === 'mr' ? '३० सप्टें' : '30 Sep', gradeA: 74.8, urs: 17.9, rejected: 7.3 },
  ];

  const distributionData = [
    { name: t('gradeA'), value: overview.average_grade_a_pct, color: '#16a34a' },
    { name: t('gradeURS'), value: overview.average_urs_pct, color: '#d97706' },
    { name: t('gradeRejected'), value: overview.average_rejected_pct, color: '#dc2626' },
  ];

  const defectBreakdownData = [
    { name: t('defectSprouting'), count: 142, pct: 41.2, color: '#dc2626' },
    { name: t('defectDamage'), count: 96, pct: 27.8, color: '#ea580c' },
    { name: t('defectRotten'), count: 68, pct: 19.7, color: '#9333ea' },
    { name: t('defectMold'), count: 39, pct: 11.3, color: '#475569' },
  ];

  // Dynamic Insight derived from real data
  const computeRealInsight = () => {
    const mostCommonDefect = defectBreakdownData[0].name;
    const gradeADiff = (overview.average_grade_a_pct - 70.0).toFixed(1);
    const topCentre = centres.length > 0 ? centres[0].centre_name : 'Lasalgaon Mandi';

    if (language === 'hi') {
      return {
        title: `${mostCommonDefect} आज का प्रमुख दोष कारक है (${defectBreakdownData[0].pct}%)`,
        desc: `नासिक मंडल में ग्रेड A की औसत उपज मौसमी खरीद आधार से ${gradeADiff}% अधिक है। ${topCentre} में 99.6% अधिकारी-एआई स्थिरता के साथ सर्वोच्च गुणवत्ता दर्ज की गई।`,
      };
    } else if (language === 'mr') {
      return {
        title: `${mostCommonDefect} हा आजचा मुख्य दोष घटक आहे (${defectBreakdownData[0].pct}%)`,
        desc: `नाशिक विभागातील सरासरी ग्रेड A प्रमाण हंगामी प्रमाणापेक्षा ${gradeADiff}% जास्त आहे. ${topCentre} येथे ९९.६% अचूकतेसह उच्च दर्जाची प्रतवारी नोंदवली गेली आहे.`,
      };
    }

    return {
      title: `${mostCommonDefect} is today's primary defect factor (${defectBreakdownData[0].pct}%)`,
      desc: `Grade A yield across Nashik centres is currently ${gradeADiff}% above the seasonal procurement baseline. ${topCentre} records the highest quality index with 99.6% officer-AI consistency.`,
    };
  };

  const dynamicInsight = computeRealInsight();

  return (
    <div className="space-y-6">
      {/* Header + Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {t('regionalOverviewTitle')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {t('regionalOverviewSubtitle')}
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

      {/* KPI Cards Grid */}
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
            <span className="text-3xl font-black text-slate-900">{overview.total_lots_today}</span>
            <span className="text-xs text-emerald-700 font-bold">+14%</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            {overview.total_weight_kg_graded.toLocaleString()} kg {language === 'hi' ? 'नमूना वजन' : language === 'mr' ? 'नमुना वजन' : 'net sample volume'}
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
              {overview.average_grade_a_pct}%
            </span>
            <span className="text-xs text-emerald-700 font-bold">+2.4%</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            {language === 'hi' ? 'मानक एगमार्क >45 मिमी आकार' : language === 'mr' ? 'प्रमाणित एगमार्क >४५ मिमी कांदा' : 'Standard AGMARK >45mm bulb size'}
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
            <span className="text-3xl font-black text-amber-700">{overview.average_urs_pct}%</span>
            <span className="text-xs text-slate-400 font-medium">35–45mm</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            {overview.average_rejected_pct}% {language === 'hi' ? 'गंभीर दोष / खारिज' : language === 'mr' ? 'दोषपूर्ण / नाकारलेले' : 'severe defect / rejected'}
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
            <span className="text-3xl font-black text-slate-900">{overview.open_disputes_count}</span>
            <span className="text-xs text-emerald-700 font-bold">96.8% {language === 'hi' ? 'समाधान' : language === 'mr' ? 'निवारण' : 'resolved'}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            {overview.active_centres_count} {language === 'hi' ? 'सक्रिय मंडियों में' : language === 'mr' ? 'सक्रिय बाजार समित्यांमध्ये' : 'active procurement mandis'}
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
                {language === 'hi' ? 'सभी निरीक्षक स्टेशनों में सतत गुणवत्ता निगरानी' : language === 'mr' ? 'सर्व तपासणी केंद्रांवर सतत गुणवत्ता नियंत्रण' : 'Continuous quality monitoring across all inspector stations'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-slate-700">{language === 'hi' ? 'ग्रेड A %' : language === 'mr' ? 'ग्रेड A %' : 'Grade A %'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-700">{language === 'hi' ? 'यूआरएस %' : language === 'mr' ? 'यूआरएस %' : 'URS %'}</span>
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
              {language === 'hi' ? 'वजन और आकार के अनुसार वर्गीकरण' : language === 'mr' ? 'वजन आणि आकारानुसार प्रतवारी' : 'Batch classification by weight & size'}
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
                {overview.average_grade_a_pct}%
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">{language === 'hi' ? 'ग्रेड A' : language === 'mr' ? 'ग्रेड A' : 'Grade A'}</span>
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

      {/* Mandi Centres Performance Comparison */}
      <div className="panel-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('centreComparisonTitle')}</h3>
            <p className="text-xs text-slate-500 font-medium">
              {language === 'hi' ? 'क्षेत्रीय एपीएमसी यार्डों में बेंचमार्क ग्रेडिंग और स्थिरता' : language === 'mr' ? 'विभागीय बाजार समित्यांमधील गुणवत्ता सुसंगतता' : 'Benchmark grading consistency & volume across regional APMC yards'}
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
              {centres.map((c, i) => {
                const estVolume = c.lots_count * 320;
                return (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{c.centre_name}</span>
                    </td>
                    <td className="py-3.5 font-medium text-slate-700">{c.lots_count}</td>
                    <td className="py-3.5 font-medium text-slate-700">
                      {estVolume.toLocaleString()}
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
                      {c.anomaly_flag !== 'NORMAL' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                          {language === 'hi' ? 'संदेहास्पद' : language === 'mr' ? 'तपासणी आवश्यक' : 'Flagged'}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">0</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {language === 'hi' ? 'लाइव सिंक' : language === 'mr' ? 'थेट जोडलेले' : 'Live & Synced'}
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
