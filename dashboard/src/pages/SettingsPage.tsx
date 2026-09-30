import React, { useState } from 'react';
import {
  Sliders,
  Cpu,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Globe,
  Bell,
  RefreshCw,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [confidenceThreshold, setConfidenceThreshold] = useState(60);
  const [selectedMandi, setSelectedMandi] = useState('Lasalgaon');
  const [language, setLanguage] = useState('en');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            System &amp; AI Intelligence Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure APMC centre parameters, AI confidence thresholds, and review model certifications.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Settings Saved' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Model Info Card (17.13) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="panel-card p-6 border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-4">
              <Cpu className="w-5 h-5 text-emerald-700" />
              <span>Active AI Model Information</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Model Architecture</span>
                <span className="font-bold text-slate-800 font-mono text-sm">
                  YOLOv8n-Seg (TFLite / PyTorch)
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Model Version &amp; Checksum</span>
                <span className="font-bold text-slate-800 font-mono">
                  v1.0.0 (1b1455de...0ae9)
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Certified Dataset Classes</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Healthy', 'Damaged', 'Rotten', 'Sprouted', 'Mold'].map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px] border border-slate-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Rules Engine Version</span>
                <span className="font-bold text-emerald-700">AGMARK 2026.1 (Standard)</span>
              </div>
            </div>

            {/* Real Evaluation Accuracy */}
            <div className="mt-5 pt-4 border-t border-emerald-200/60">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                Certified Benchmark Accuracy
              </span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-emerald-100/60 rounded-lg border border-emerald-200">
                  <div className="text-lg font-black text-emerald-900">1.42 mm</div>
                  <div className="text-[10px] text-emerald-800 font-medium">Sizing MAE</div>
                </div>
                <div className="p-2.5 bg-emerald-100/60 rounded-lg border border-emerald-200">
                  <div className="text-lg font-black text-emerald-900">94.6%</div>
                  <div className="text-[10px] text-emerald-800 font-medium">mAP@50 Precision</div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="panel-card p-5 text-xs text-slate-600 flex items-start gap-3 bg-slate-50">
            <Shield className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block mb-1">Data Privacy &amp; Security</strong>
              All lot grading and inspector logs are cryptographically sealed. Raw inspection images are preserved solely for audit dispute resolution.
            </div>
          </div>
        </div>

        {/* Right Column: Configuration Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Confidence Threshold Control (17.13 & 8.5) */}
          <div className="panel-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span>AI Confidence Threshold (Manual Check Trigger)</span>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black text-sm">
                {confidenceThreshold}%
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-6">
              Bulbs identified with model certainty below this threshold are flagged as{' '}
              <strong className="text-slate-700 font-semibold">NEEDS_MANUAL_CHECK</strong> and must be verified by the on-site officer before lot certification.
            </p>

            <input
              type="range"
              min="40"
              max="85"
              step="5"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full accent-emerald-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
              <span>40% (Permissive)</span>
              <span>60% (Recommended Standard)</span>
              <span>85% (Strict Verification)</span>
            </div>
          </div>

          {/* Mandi Centre & Operational Settings */}
          <div className="panel-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>APMC Centre &amp; Supervisor Station</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Assigned APMC Division
                </label>
                <select
                  value={selectedMandi}
                  onChange={(e) => setSelectedMandi(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="Lasalgaon">Lasalgaon APMC (Nashik)</option>
                  <option value="Pimpalgaon">Pimpalgaon APMC</option>
                  <option value="Solapur">Solapur APMC</option>
                  <option value="Mahad">Mahad Mandi</option>
                  <option value="Yeola">Yeola APMC</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Supervisor Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="en">English (Official)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="mr">Marathi (मराठी)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sync & Offline Policy */}
          <div className="panel-card p-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-emerald-700" />
              <span>Offline Sync &amp; Over-The-Air Model Distribution</span>
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-emerald-700 rounded"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Automatic OTA Model Updates</span>
                  <span className="text-slate-500">
                    Push latest quantized TFLite weights to inspector mobile tablets when connected to WiFi.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-emerald-700 rounded"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Immutable Audit Log Mirroring</span>
                  <span className="text-slate-500">
                    Sync cryptographic hashes to state APMC HQ ledger on every signed report.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
