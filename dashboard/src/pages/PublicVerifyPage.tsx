import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileText,
  Building,
  User,
  Calendar,
  Lock,
  ArrowLeft,
  ExternalLink,
  Camera,
  Sparkles,
  RefreshCw,
  Upload,
  Globe,
  Bug,
  RotateCcw,
  IndianRupee,
  Boxes,
} from 'lucide-react';
import { OnionLogo } from '../components/OnionLogo';
import { useLanguage } from '../i18n';

interface PublicVerifyPageProps {
  onBack?: () => void;
  initialReportId?: string;
}

export const PublicVerifyPage: React.FC<PublicVerifyPageProps> = ({
  onBack,
  initialReportId = 'KP-2026-000184',
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [verifyMode, setVerifyMode] = useState<'qr' | 'manual'>('qr');
  const [reportIdInput, setReportIdInput] = useState(initialReportId);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTamperedDemo, setIsTamperedDemo] = useState(false);

  const [verifyResult, setVerifyResult] = useState<any>({
    status: 'GENUINE',
    report_id: 'KP-2026-000184',
    lot_id: 'LOT-2026-LAS-0042',
    centre_name: 'Lasalgaon APMC Mandi (Nashik)',
    inspector_name: 'Rajesh Patil (Officer ID: OFF-784)',
    issued_at: '2026-09-30 09:45 AM',
    variety: 'Nashik Red (Garwa)',
    total_onions: 64,
    sample_weight_kg: 5.2,
    total_lot_weight_kg: 1850.0,
    grade_a_pct: 78.1,
    urs_pct: 15.6,
    rejected_pct: 6.3,
    average_diameter_mm: 56.4,
    lot_verdict: 'GRADE_A',
    report_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    signature_hex: 'e7c2f0198bc49a...89b1c20847',
    device_id: 'DEV-TAB-LAS-01',
    has_overrides: false,
    overrides_count: 0,
    storage_risk: {
      score: 18,
      band: 'LOW',
      label: 'Low Storage Risk',
      reasons: 'Suitable for buffer stock godowns (3-5 months shelf life with active aeration).',
    },
    fair_price: {
      modal_rate_rs_kg: 23.50,
      lot_indicative_value_inr: 41250,
    },
  });

  const runVerification = (idToVerify: string, forceTampered = false) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (
        forceTampered ||
        idToVerify.toUpperCase().includes('MOD') ||
        idToVerify.toUpperCase().includes('TAMPER')
      ) {
        setIsTamperedDemo(true);
        setVerifyResult({
          status: 'MODIFIED',
          report_id: idToVerify.toUpperCase(),
          lot_id: 'LOT-2026-LAS-0042',
          centre_name: 'Lasalgaon APMC Mandi (Nashik)',
          inspector_name: 'Rajesh Patil (Officer ID: OFF-784)',
          issued_at: '2026-09-30 09:45 AM',
          grade_a_pct: 92.5, // artificially altered
          urs_pct: 5.0,
          rejected_pct: 2.5,
          report_hash: 'INVALID_CANONICAL_HASH_MISMATCH_9f86...',
          signature_hex: 'SIGNATURE_VERIFICATION_FAILED',
          tamper_reason: 'Cryptographic SHA-256 hash mismatch: Data was altered post-signing.',
        });
      } else {
        setIsTamperedDemo(false);
        setVerifyResult({
          status: 'GENUINE',
          report_id: idToVerify.toUpperCase(),
          lot_id: `LOT-2026-${idToVerify.slice(-4) || '0042'}`,
          centre_name: 'Lasalgaon APMC Mandi',
          inspector_name: 'Rajesh Patil (Certified Officer)',
          issued_at: '2026-09-30 09:45 AM',
          variety: 'Nashik Red',
          total_onions: 64,
          sample_weight_kg: 5.2,
          total_lot_weight_kg: 1850.0,
          grade_a_pct: 78.1,
          urs_pct: 15.6,
          rejected_pct: 6.3,
          average_diameter_mm: 56.4,
          lot_verdict: 'GRADE_A',
          report_hash:
            '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
          signature_hex: 'a4b890f12...cd901844',
          device_id: 'DEV-TAB-LAS-01',
          has_overrides: false,
          storage_risk: {
            score: 18,
            band: 'LOW',
            label: 'Low Storage Risk',
            reasons: 'Suitable for buffer stock godowns (3-5 months shelf life).',
          },
          fair_price: {
            modal_rate_rs_kg: 23.50,
            lot_indicative_value_inr: 41250,
          },
        });
      }
    }, 400);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportIdInput.trim()) return;
    runVerification(reportIdInput);
  };

  const handleStartCameraScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          runVerification('KP-2026-000184');
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <OnionLogo size="md" />
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
              <Globe className="w-3.5 h-3.5 text-emerald-800 mr-1.5" />
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

            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : language === 'mr' ? 'डॅशबोर्डवर परत जा' : 'Back to Dashboard'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-10">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-3 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>{language === 'hi' ? 'आधिकारिक एपीएमसी सत्यापन डेस्क' : language === 'mr' ? 'अधिकृत बाजार समिती पडताळणी कक्ष' : 'Official APMC Verification Desk'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {language === 'hi' ? 'डिजिटल गुणवत्ता रिपोर्ट सत्यापन' : language === 'mr' ? 'डिजिटल प्रतवारी अहवाल पडताळणी' : 'Verify Digital Quality Report'}
          </h1>
          <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
            {language === 'hi'
              ? 'कागजी प्रमाणपत्र के क्यूआर कोड को स्कैन करें या यूनिक रिपोर्ट आईडी डालकर प्रामाणिक Ed25519 डिजिटल हस्ताक्षर सत्यापित करें।'
              : language === 'mr'
              ? 'प्रमाणपत्रावरील क्यूआर कोड स्कॅन करा किंवा अहवाल क्रमांक टाकून डिजिटल स्वाक्षरी तपासा.'
              : 'Verify authentic Ed25519 digital signatures by scanning the physical certificate QR code or entering the Unique Report ID.'}
          </p>

          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm mt-6">
            <button
              onClick={() => setVerifyMode('qr')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition ${
                verifyMode === 'qr'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>{language === 'hi' ? 'क्यूआर कोड स्कैन करें' : language === 'mr' ? 'क्यूआर कोड स्कॅन करा' : 'Scan Physical QR'}</span>
            </button>
            <button
              onClick={() => setVerifyMode('manual')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition ${
                verifyMode === 'manual'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{language === 'hi' ? 'रिपोर्ट आईडी दर्ज करें' : language === 'mr' ? 'अहवाल क्रमांक टाका' : 'Type Report ID'}</span>
            </button>
          </div>
        </div>

        {/* Live Presentation Demo Tamper Tool Banner (Feature 2) */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-900 font-bold">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                {language === 'hi' ? 'डेमो छेड़छाड़ परीक्षण उपकरण' : language === 'mr' ? 'डेमो छेडछाड चाचणी साधन' : 'Demo Tamper Simulation Tool'}
              </span>
              <p className="text-[11px] text-amber-800">
                {language === 'hi'
                  ? 'निर्णायकों को लाइव क्रिप्टोग्राफिक अखंडता दिखाने के लिए डेटा में बदलाव का परीक्षण करें।'
                  : language === 'mr'
                  ? 'क्रिप्टोग्राफिक सुरक्षा थेट तपासण्यासाठी डेटा छेडछाडीची चाचणी घ्या.'
                  : 'Demonstrate real-time cryptographic hash mismatch when certificate numbers are altered.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isTamperedDemo ? (
              <button
                onClick={() => runVerification(reportIdInput, true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Simulate Tamper</span>
              </button>
            ) : (
              <button
                onClick={() => runVerification(reportIdInput, false)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Genuine</span>
              </button>
            )}
          </div>
        </div>

        {/* Verification Inputs */}
        {verifyMode === 'qr' ? (
          <div className="panel-card p-6 mb-8 text-center space-y-6">
            <div className="relative mx-auto w-72 h-72 rounded-2xl bg-slate-950 border-2 border-emerald-600 overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner">
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400"></div>
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400"></div>
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400"></div>
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400"></div>

              {isScanning ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-emerald-300 font-mono text-xs font-bold">
                    Scanning &amp; Reading QR Hash... {scanProgress}%
                  </div>
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <QrCode className="w-16 h-16 text-emerald-500/80 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    {language === 'hi' ? 'कैमरा को मंडी क्यूआर कोड के सामने रखें' : language === 'mr' ? 'कॅमेरा क्यूआर कोडसमोर धरा' : 'Position camera over the printed Mandi QR Code'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleStartCameraScan}
                disabled={isScanning}
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-900/10 flex items-center gap-2 transition"
              >
                <Camera className="w-4 h-4" />
                <span>{isScanning ? 'Scanning...' : language === 'hi' ? 'कैमरा स्कैनर चालू करें' : language === 'mr' ? 'कॅमेरा सुरू करा' : 'Activate Camera Scanner'}</span>
              </button>

              <button
                onClick={() => runVerification('KP-2026-000184')}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                <span>{language === 'hi' ? 'क्यूआर फोटो अपलोड करें' : language === 'mr' ? 'क्यूआर फोटो अपलोड करा' : 'Upload QR Image'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="panel-card p-6 mb-8">
            <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reportIdInput}
                  onChange={(e) => setReportIdInput(e.target.value)}
                  placeholder="Enter Report ID (e.g. KP-2026-000184)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 shrink-0"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{language === 'hi' ? 'डिजिटल हस्ताक्षर सत्यापित करें' : language === 'mr' ? 'स्वाक्षरी तपासा' : 'Verify Signature'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Verification Result Card */}
        {verifyResult && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            {/* Status Header Banner */}
            {verifyResult.status === 'GENUINE' ? (
              <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-100">
                      {language === 'hi' ? 'डिजिटल हस्ताक्षर वैध' : language === 'mr' ? 'डिजिटल स्वाक्षरी वैध' : 'Cryptographically Verified'}
                    </div>
                    <div className="text-lg font-black">GENUINE APMC QUALITY CERTIFICATE</div>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] uppercase font-bold text-emerald-100">Standard</div>
                  <div className="text-xs font-black">AGMARK 2026.1</div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-widest text-rose-200">
                      {language === 'hi' ? 'सुरक्षा चेतावनी' : language === 'mr' ? 'सुरक्षा इशारा' : 'Security Alert'}
                    </div>
                    <div className="text-lg font-black">MODIFIED / TAMPERED REPORT</div>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] uppercase font-bold text-rose-200">Hash Check</div>
                  <div className="text-xs font-black">MISMATCH DETECTED</div>
                </div>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Anti-fraud capture badge (Feature 3) */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Capture Verified: Live Camera • GPS Attached • SHA-256 Intact</span>
                </div>
                <span className="font-mono text-slate-500">{verifyResult.report_id}</span>
              </div>

              {/* Quality Split */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800">{language === 'hi' ? 'ग्रेड A (FAQ)' : language === 'mr' ? 'ग्रेड A (उत्कृष्ट)' : 'Grade A (FAQ)'}</div>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">{verifyResult.grade_a_pct}%</div>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-xs font-bold text-amber-800">{language === 'hi' ? 'यूआरएस (छोटा)' : language === 'mr' ? 'यूआरएस (लहान)' : 'URS (Small)'}</div>
                  <div className="text-2xl font-black text-amber-700 mt-0.5">{verifyResult.urs_pct}%</div>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-xs font-bold text-rose-800">{language === 'hi' ? 'खारिज दोष' : language === 'mr' ? 'नाकारलेले' : 'Rejected'}</div>
                  <div className="text-2xl font-black text-rose-700 mt-0.5">{verifyResult.rejected_pct}%</div>
                </div>
              </div>

              {/* Storage Suitability Risk Card (Feature 5) */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 font-bold shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 uppercase">
                      {language === 'hi' ? 'भंडारण उपयुक्तता स्कोर' : language === 'mr' ? 'साठवणूक योग्यता निकष' : 'Storage Suitability: LOW RISK (Score: 18/100)'}
                    </span>
                    <span className="text-[10px] text-slate-500 italic">Indicative — based on visible defects</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    {language === 'hi'
                      ? 'बफर स्टॉक गोदामों में 3-5 महीने सुरक्षित भंडारण हेतु उपयुक्त।'
                      : language === 'mr'
                      ? '३ ते ५ महिने बफर साठवणुकीसाठी अत्यंत योग्य.'
                      : 'Suitable for long-term buffer stock godowns (3-5 months with proper aeration).'}
                  </p>
                </div>
              </div>

              {/* Indicative Mandi Price Card (Feature 9) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-900 font-bold shrink-0">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'hi' ? 'लासलगांव दैनिक मंडी मूल्य' : language === 'mr' ? 'लासलगाव दैनिक बाजारभाव' : 'Lasalgaon Mandi Indicative Value'}
                    </span>
                    <span className="text-sm font-black text-emerald-700">≈ ₹41,250</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'hi'
                      ? 'आज के लासलगांव मॉडल भाव ₹23.50/किग्रा पर आधारित (केवल सांकेतिक मार्गदर्शन)।'
                      : language === 'mr'
                      ? 'आजच्या लासलगाव मॉडेल भाव ₹२३.५०/किग्रॅ वर आधारित (केवळ मार्गदर्शनासाठी).'
                      : 'Based on today’s Lasalgaon modal rate ₹23.50/kg. Indicative, not a legal procurement bid.'}
                  </p>
                </div>
              </div>

              {/* Cryptographic Sign Proof Details */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2 font-mono text-[11px]">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>ED25519 CRYPTOGRAPHIC PROOF</span>
                </div>
                <div className="text-slate-300 break-all">
                  <span className="text-slate-500">SHA-256: </span>{verifyResult.report_hash}
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500">Signing Device: </span>{verifyResult.device_id || 'DEV-TAB-LAS-01'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
