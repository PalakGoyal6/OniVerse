import React from 'react';
import { InspectorConsistency } from '../types';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  UserX,
  TrendingDown,
  TrendingUp,
  Activity,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ConsistencyPageProps {
  inspectors: InspectorConsistency[];
}

export const ConsistencyPage: React.FC<ConsistencyPageProps> = ({ inspectors }) => {
  const biasComparisonData = [
    { lot: 'Lot 1 (FAQ)', humanSpread: 19.0, aiVariance: 0.4 },
    { lot: 'Lot 2 (Borderline)', humanSpread: 22.0, aiVariance: 0.4 },
    { lot: 'Lot 3 (Sprouted)', humanSpread: 24.0, aiVariance: 0.2 },
    { lot: 'Lot 4 (Premium)', humanSpread: 15.0, aiVariance: 0.5 },
    { lot: 'Lot 5 (Reject)', humanSpread: 26.0, aiVariance: 0.2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Inspector Consistency &amp; AI Bias Guard
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time oversight on manual overrides, bias direction, and human variance elimination.
        </p>
      </div>

      {/* Human Bias Benchmark Comparison */}
      <div className="panel-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Human Inspector Spread vs AI Reproducibility (Held-out Test Lots)
            </h3>
            <p className="text-xs text-slate-500">
              Human grading variance averages 21.2% difference on identical onions; AI reduces variance to &lt; 0.4%.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200">
            Zero Bias Target Met
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={biasComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="lot" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                domain={[0, 30]}
                unit="%"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="humanSpread" name="Human Inspector Spread (%)" fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="aiVariance" name="OniVerse Spread (%)" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inspector Roster & Override Flags */}
      <div className="panel-card overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            Active Station Inspectors &amp; Override Audit Trail
          </h3>
          <p className="text-xs text-slate-500">
            Inspectors exceeding 10% override rate are flagged for quality recalibration review
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Officer Name</th>
                <th className="py-3 px-4">Station Yard</th>
                <th className="py-3 px-4">Total Lots</th>
                <th className="py-3 px-4">Override Rate</th>
                <th className="py-3 px-4">Dominant Bias</th>
                <th className="py-3 px-4">Consistency Index</th>
                <th className="py-3 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspectors.map((ins, idx) => {
                const isFlagged = ins.flag !== 'CONSISTENT';
                const consistencyScore = Math.max(0, 100 - ins.override_rate_pct);
                const biasTendency =
                  ins.direction_lowered_pct > ins.direction_boosted_pct
                    ? 'Tends to Downgrade'
                    : 'Tends to Upgrade';

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{ins.name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{ins.centre}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{ins.total_lots_scanned}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          ins.override_rate_pct > 10 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {ins.override_rate_pct}% ({ins.override_count} bulbs)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">{biasTendency}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${consistencyScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900">{consistencyScore.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isFlagged ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Review Required</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Calibrated</span>
                        </span>
                      )}
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
