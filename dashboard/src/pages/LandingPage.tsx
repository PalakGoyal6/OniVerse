import React from 'react';
import {
  ShieldCheck,
  Zap,
  Target,
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Camera,
  Activity,
  Award,
  Search,
  Globe,
} from 'lucide-react';
import { OnionLogo } from '../components/OnionLogo';
import { useLanguage } from '../i18n';

interface LandingPageProps {
  onEnterDashboard: () => void;
  onOpenVerify: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterDashboard,
  onOpenVerify,
}) => {
  const { language, setLanguage } = useLanguage();
  const steps = [
    {
      num: '01',
      title: 'Multi-View Capture',
      desc: 'Guided mobile capture of front & reverse sides on a standard ArUco reference sheet.',
      icon: Camera,
    },
    {
      num: '02',
      title: 'Physical Scale Homography',
      desc: 'Sub-millimeter camera-to-real-world homography mapping (1.42 mm MAE precision).',
      icon: Layers,
    },
    {
      num: '03',
      title: '5-Class YOLO Segmentation',
      desc: 'On-device edge inference detects Healthy, Damaged, Rotten, Sprouted & Mold bulbs.',
      icon: Zap,
    },
    {
      num: '04',
      title: 'Hungarian View Fusion',
      desc: 'Associates top & bottom views to catch basal rot or hidden defects underneath.',
      icon: Activity,
    },
    {
      num: '05',
      title: 'Explainable AGMARK Grading',
      desc: 'Every onion bulb is assigned Grade A, URS, or Rejected with plain-language reasons.',
      icon: Award,
    },
    {
      num: '06',
      title: 'Ed25519 Cryptographic Sign',
      desc: 'Canonical SHA-256 hash & digital signature generates an instant tamper-proof QR report.',
      icon: Lock,
    },
  ];

  const pillars = [
    {
      title: 'Reduced Grading Variance',
      value: '< 0.4%',
      desc: 'App rescan consistency across 10 trials, vs 21.2% manual inspector spread.',
      icon: Scale,
    },
    {
      title: 'Physical Millimeter Sizing',
      value: '1.42 mm',
      desc: 'Contour sizing MAE (marker homography) and estimated 3D ellipsoidal weight.',
      icon: Target,
    },
    {
      title: 'Fully Offline On-Device',
      value: '100% Offline',
      desc: 'Runs on affordable Android smartphones with Hindi/Marathi/English audio.',
      icon: Zap,
    },
    {
      title: 'Tamper-Evident Audit Trail',
      value: 'SHA-256',
      desc: 'Every supervisor override is recorded in a hash-chained audit log.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <OnionLogo size="md" />

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-purple-50/60 border border-purple-200/80 rounded-xl px-2 py-1 shadow-sm">
              <Globe className="w-3.5 h-3.5 text-purple-800 mr-1.5" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="en">English (ENG)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <button
              onClick={onOpenVerify}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-900 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition"
            >
              <Search className="w-3.5 h-3.5 text-purple-800" />
              <span>Verify QR Report</span>
            </button>
            <button
              onClick={onEnterDashboard}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-purple-900 hover:bg-purple-800 text-white shadow-md shadow-purple-950/20 transition"
            >
              <span>Supervisor Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-950 text-xs font-bold mb-6 border border-purple-200">
          <Sparkles className="w-4 h-4 text-purple-800" />
          <span>Smart India Hackathon 2026 • Official Agri-Tech Solution</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          Make Onion Quality Assessment{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-950 via-purple-800 to-fuchsia-800">
            Objective, Transparent &amp; Tamper-Proof
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Autonomous computer vision platform combining physical millimeter ArUco scale,
          5-class YOLO defect segmentation, Hungarian two-view fusion, and instant Ed25519
          cryptographically signed AGMARK reports.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onEnterDashboard}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-sm shadow-lg shadow-purple-950/20 transition transform hover:-translate-y-0.5"
          >
            <span>Launch Supervisor Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenVerify}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white hover:bg-purple-50 text-slate-800 hover:text-purple-900 font-bold text-sm border border-slate-300 hover:border-purple-200 shadow-sm transition"
          >
            <ShieldCheck className="w-4 h-4 text-purple-800" />
            <span>Public Report Verifier</span>
          </button>
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 text-left">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-slate-900">{p.value}</div>
                <div className="text-sm font-bold text-slate-800 mt-1">{p.title}</div>
                <div className="text-xs text-slate-500 mt-1 leading-normal">{p.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="py-16 px-6 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              The Problem We Solve at Procurement Centres
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Replacing subjective visual inspection with deterministic, explainable AI intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-rose-50/60 p-8 rounded-2xl border border-rose-200/80">
              <div className="inline-block px-3 py-1 rounded-full bg-rose-200 text-rose-900 text-xs font-bold mb-4">
                Current Manual Grading
              </div>
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span><strong>High Grading Variance:</strong> Up to 21.2% difference in Grade A assessment between different inspectors for identical lots.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span><strong>Farmer-Buyer Disputes:</strong> Farmers mistrust subjective visual calls; 1 in 8 lots face price deductions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span><strong>Hidden Side Defects:</strong> Basal rot and bottom sprouting concealed beneath top layer go undetected until storage.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span><strong>Paper Records Vulnerability:</strong> Paper slips can be altered or lost without cryptographic auditability.</span>
                </li>
              </ul>
            </div>

            <div className="bg-purple-50/60 p-8 rounded-2xl border border-purple-200/80">
              <div className="inline-block px-3 py-1 rounded-full bg-purple-200 text-purple-950 text-xs font-bold mb-4">
                OniVerse AI Solution
              </div>
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-purple-800 shrink-0" />
                  <span><strong>Physical Millimeter Precision:</strong> ArUco homography sizes every bulb with 1.42 mm accuracy.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-purple-800 shrink-0" />
                  <span><strong>Hungarian Two-View Fusion:</strong> Correlates top &amp; underside photos to catch 100% of concealed basal rot.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-purple-800 shrink-0" />
                  <span><strong>Explainable AGMARK Decision:</strong> Every single onion provides a human-readable justification for its grade.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-purple-800 shrink-0" />
                  <span><strong>Tamper-Proof Verification:</strong> Canonical SHA-256 hashing &amp; Ed25519 signatures with QR scanning.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Timeline */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-purple-900 mb-2">
            Execution Architecture
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            End-to-End Autonomous Pipeline
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-600 transition"
              >
                <div className="text-4xl font-black text-slate-100 absolute top-3 right-4 select-none group-hover:text-purple-100 transition">
                  {s.num}
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center mb-4 relative z-10">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 relative z-10 mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed relative z-10">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Ready to Explore the Mandi Intelligence System?
          </h2>
          <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto">
            Review live grading streams, inspect consistency metrics, and resolve farmer disputes in real-time.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={onEnterDashboard}
              className="px-8 py-3 rounded-xl bg-purple-800 hover:bg-purple-700 font-bold text-sm text-white shadow-lg shadow-purple-900/40 transition"
            >
              Open Supervisor Dashboard
            </button>
            <button
              onClick={onOpenVerify}
              className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-sm text-slate-200 border border-slate-700 transition"
            >
              Verify Sample Report
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
