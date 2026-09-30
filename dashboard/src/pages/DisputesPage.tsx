import React, { useState } from 'react';
import { DisputeItem } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  User,
  Calendar,
  Building,
} from 'lucide-react';

interface DisputesPageProps {
  disputes: DisputeItem[];
}

export const DisputesPage: React.FC<DisputesPageProps> = ({ disputes }) => {
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [localDisputes, setLocalDisputes] = useState<DisputeItem[]>(disputes);

  const handleResolve = (status: 'RESOLVED_UPHELD' | 'RESOLVED_OVERTURNED') => {
    if (!selectedDispute) return;
    setLocalDisputes((prev) =>
      prev.map((d) =>
        d.id === selectedDispute.id
          ? {
              ...d,
              status,
              supervisor_notes: resolutionNotes || 'Resolved by APMC Supervisor',
              resolved_at: new Date().toISOString(),
            }
          : d
      )
    );
    setSelectedDispute(null);
    setResolutionNotes('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Farmer Dispute Resolution Desk
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review, re-verify scans, and provide binding supervisory adjudications on contested lots.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Disputes List */}
        <div className="lg:col-span-2 space-y-3">
          {localDisputes.map((d) => {
            const isOpen = d.status === 'OPEN';
            return (
              <div
                key={d.id}
                className={`panel-card p-5 cursor-pointer transition border ${
                  selectedDispute?.id === d.id
                    ? 'border-purple-800 ring-2 ring-purple-800/20 bg-purple-50/40'
                    : 'hover:border-slate-300'
                }`}
                onClick={() => {
                  setSelectedDispute(d);
                  setResolutionNotes(d.supervisor_notes || '');
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-purple-900">
                        DISP-{d.id}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-xs text-slate-500">{d.report_id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOpen
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-purple-100 text-purple-900 border border-purple-200'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.farmer_name}</span>
                      <span className="text-slate-400 font-normal text-xs">({d.farmer_phone})</span>
                    </div>

                    <div className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <strong className="text-slate-700 font-semibold">Claim: </strong>
                      "{d.reason}"
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0 font-medium">
                    {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Adjudication Panel */}
        <div className="panel-card p-6 h-fit sticky top-24 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-700" />
            <span>Supervisory Adjudication</span>
          </h3>

          {selectedDispute ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block">Contested Report</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {selectedDispute.report_id}
                </span>
                <span className="text-slate-500 block">
                  Farmer: {selectedDispute.farmer_name}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Supervisor Ruling &amp; Evidence Notes
                </label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter verification findings, re-measurement check, or compensation recommendation..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleResolve('RESOLVED_UPHELD')}
                  className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Upheld AI Call</span>
                </button>
                <button
                  onClick={() => handleResolve('RESOLVED_OVERTURNED')}
                  className="px-3 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Grant Appeal</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select a dispute from the queue to review evidence and issue a ruling.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
