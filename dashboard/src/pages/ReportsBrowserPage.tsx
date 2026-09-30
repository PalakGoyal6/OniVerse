import React, { useState } from 'react';
import { ReportSummary } from '../types';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Building,
  User,
  Calendar,
  X,
  QrCode,
} from 'lucide-react';

interface ReportsBrowserPageProps {
  reports: ReportSummary[];
  onSelectReport: (reportId: string) => void;
}

export const ReportsBrowserPage: React.FC<ReportsBrowserPageProps> = ({
  reports,
  onSelectReport,
}) => {
  const [reportTab, setReportTab] = useState<
    'all' | 'daily' | 'weekly' | 'farmer' | 'centre'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [centreFilter, setCentreFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<ReportSummary | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExport = (format: 'PDF' | 'CSV', title: string) => {
    setExportNotice(`Generated & downloaded ${title} (${format})`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.report_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.farmer_phone.includes(searchTerm);
    const matchesCentre = centreFilter === 'ALL' || r.centre_name.includes(centreFilter);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'DISPUTED' && r.is_disputed) ||
      (statusFilter === 'OVERRIDDEN' && r.has_overrides) ||
      (statusFilter === 'CLEAN' && !r.has_overrides && !r.is_disputed);

    return matchesSearch && matchesCentre && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Report Tab Navigation (17.11) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Mandi Quality &amp; Procurement Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search lots, inspect digital certificates, and generate official APMC summaries.
          </p>
        </div>

        {exportNotice && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* Report Category Tabs (17.11) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: 'All Individual Lots' },
          { id: 'daily', label: 'Daily Quality Report' },
          { id: 'weekly', label: 'Weekly Procurement Report' },
          { id: 'farmer', label: 'Supplier / Farmer Report' },
          { id: 'centre', label: 'Centre Performance Report' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              reportTab === t.id
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CASE 1: AGGREGATE REPORTS (Daily, Weekly, Farmer, Centre) */}
      {reportTab !== 'all' && (
        <div className="panel-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {reportTab === 'daily' && 'Official Daily Quality Assessment Statement'}
                {reportTab === 'weekly' && 'Weekly Mandi Procurement Summary & Trends'}
                {reportTab === 'farmer' && 'Supplier / Farmer Quality & Dispute Audit'}
                {reportTab === 'centre' && 'APMC Centre Grading Consistency Statement'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Certified by Director of Agricultural Marketing • Nashik Division
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('CSV', 'Report_Data')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleExport('PDF', 'Official_Certificate')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download Signed PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Reporting Period</span>
              <span className="font-bold text-slate-800 text-sm">
                {reportTab === 'daily' ? '30 Sep 2026' : '24 Sep - 30 Sep 2026'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Total Procurement Volume</span>
              <span className="font-bold text-slate-800 text-sm">
                {reportTab === 'daily' ? '15,480 kg (48 Lots)' : '108,350 kg (312 Lots)'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Weighted Grade A Yield</span>
              <span className="font-bold text-emerald-700 text-sm">74.8% Average</span>
            </div>
          </div>
        </div>
      )}

      {/* CASE 2: ALL INDIVIDUAL LOTS BROWSER */}
      {/* Search & Filter Bar */}
      <div className="panel-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Report ID, Farmer Name, Phone Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={centreFilter}
            onChange={(e) => setCentreFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">All Mandis</option>
            <option value="Lasalgaon">Lasalgaon APMC</option>
            <option value="Pimpalgaon">Pimpalgaon APMC</option>
            <option value="Yeola">Yeola Mandi</option>
            <option value="Solapur">Solapur APMC</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="CLEAN">Certified (AI Pure)</option>
            <option value="OVERRIDDEN">Officer Overridden</option>
            <option value="DISPUTED">Farmer Disputed</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Farmer Details</th>
                <th className="py-3 px-4">Centre &amp; Officer</th>
                <th className="py-3 px-4">Quality Split</th>
                <th className="py-3 px-4">Avg Size</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Ledger Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((r) => (
                <tr key={r.report_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                    {r.report_id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{r.farmer_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{r.farmer_phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-800 font-medium">{r.centre_name}</div>
                    <div className="text-[11px] text-slate-500">{r.inspector_name}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-700">{r.grade_a_pct}% A</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-amber-700">{r.urs_pct}% URS</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-rose-700">{r.rejected_pct}% Rej</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {r.average_diameter_mm} mm
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        r.lot_verdict === 'GRADE_A'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.lot_verdict === 'URS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.lot_verdict}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {r.is_disputed ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                        Disputed
                      </span>
                    ) : r.has_overrides ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Overridden
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-max">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Signed</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedReport(r)}
                      className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg text-xs font-bold border border-slate-200 transition inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Report Detail Viewer (17.7) */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-emerald-800 text-base">
                    {selectedReport.report_id}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    OFFICIAL CERTIFICATE
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lot: {selectedReport.lot_id} • {selectedReport.centre_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quality Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-[11px] font-bold text-emerald-800 block">Grade A (FAQ)</span>
                <span className="text-2xl font-black text-emerald-900">
                  {selectedReport.grade_a_pct}%
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <span className="text-[11px] font-bold text-amber-800 block">URS (Small)</span>
                <span className="text-2xl font-black text-amber-900">
                  {selectedReport.urs_pct}%
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                <span className="text-[11px] font-bold text-rose-800 block">Rejected</span>
                <span className="text-2xl font-black text-rose-900">
                  {selectedReport.rejected_pct}%
                </span>
              </div>
            </div>

            {/* Farmer & Lot Meta */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Farmer Name</span>
                <span className="font-bold text-slate-800">{selectedReport.farmer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phone Number</span>
                <span className="font-mono font-bold text-slate-800">{selectedReport.farmer_phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Sample Weight</span>
                <span className="font-bold text-slate-800">{selectedReport.sample_weight_kg} kg</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Lot Volume</span>
                <span className="font-bold text-slate-800">{selectedReport.total_lot_weight_kg} kg</span>
              </div>
            </div>

            {/* Cryptographic Proof Hash */}
            <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono space-y-1">
              <span className="text-emerald-400 font-bold block font-sans">
                SHA-256 Checksum:
              </span>
              <span className="text-[11px] break-all text-slate-300">
                {selectedReport.report_hash}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => handleExport('PDF', selectedReport.report_id)}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
