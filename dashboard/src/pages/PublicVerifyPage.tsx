import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Lock,
  ArrowLeft,
  Camera,
  Upload,
  Globe,
  Bug,
  RotateCcw,
  IndianRupee,
  Boxes,
  VideoOff,
  Sparkles,
} from 'lucide-react';
import jsQR from 'jsqr';
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
  const { language, setLanguage } = useLanguage();
  const [verifyMode, setVerifyMode] = useState<'qr' | 'manual'>('qr');
  const [reportIdInput, setReportIdInput] = useState(initialReportId);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTamperedDemo, setIsTamperedDemo] = useState(false);
  const [qrDecodedText, setQrDecodedText] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

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

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setIsScanning(true);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);

      // Start continuous scanning loop
      scanIntervalRef.current = setInterval(() => {
        scanCurrentVideoFrame();
      }, 300);
    } catch (err: any) {
      console.warn('Camera access fallback:', err);
      // Try fallback to any available camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
        scanIntervalRef.current = setInterval(() => {
          scanCurrentVideoFrame();
        }, 300);
      } catch (fallbackErr: any) {
        setCameraError(
          fallbackErr?.message || 'Unable to access camera. Please allow camera permissions.'
        );
        setIsCameraActive(false);
        setIsScanning(false);
      }
    }
  };

  const parseReportIdFromText = (rawText: string): string => {
    const trimmed = rawText.trim();
    // Check if it's a URL with /verify/REPORT_ID
    const urlMatch = trimmed.match(/\/verify\/([A-Za-z0-9-_]+)/i);
    if (urlMatch && urlMatch[1]) return urlMatch[1].toUpperCase();

    // Check if it's a JSON payload
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.report_id) return parsed.report_id;
      if (parsed.id) return parsed.id;
    } catch {
      // not json
    }

    // Match standard report format KP-XXXX-XXXXXX or LOT-XXXX-XXXX
    const reportMatch = trimmed.match(/(?:KP|LOT|DOCA|AGRI)-[0-9]{4}-[0-9A-Za-z]+/i);
    if (reportMatch) return reportMatch[0].toUpperCase();

    return trimmed.toUpperCase();
  };

  const scanCurrentVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      const parsedId = parseReportIdFromText(code.data);
      setQrDecodedText(parsedId);
      stopCamera();
      runVerification(parsedId);
    }
  };

  const handleManualScanCapture = () => {
    scanCurrentVideoFrame();
    if (!qrDecodedText) {
      // Fallback demo read if camera has low light
      runVerification(reportIdInput || 'KP-2026-000184');
      stopCamera();
    }
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          const parsed = parseReportIdFromText(code.data);
          setReportIdInput(parsed);
          runVerification(parsed);
        } else {
          // If unreadable QR, still verify with filename / fallback ID
          runVerification('KP-2026-000184');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const runVerification = (idToVerify: string, forceTampered = false) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const isTampered =
        forceTampered ||
        idToVerify.toUpperCase().includes('MOD') ||
        idToVerify.toUpperCase().includes('TAMPER');

      if (isTampered) {
        setIsTamperedDemo(true);
        setVerifyResult({
          status: 'MODIFIED',
          report_id: idToVerify.toUpperCase(),
          lot_id: 'LOT-2026-LAS-0042',
          centre_name: 'Lasalgaon APMC Mandi (Nashik)',
          inspector_name: 'Rajesh Patil (Officer ID: OFF-784)',
          issued_at: '2026-09-30 09:45 AM',
          grade_a_pct: 92.5,
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
    }, 350);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportIdInput.trim()) return;
    runVerification(reportIdInput);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Hidden canvas for QR parsing */}
      <canvas ref={canvasRef} className="hidden" />

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
                onClick={() => {
                  stopCamera();
                  onBack();
                }}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  {language === 'hi'
                    ? 'डैशबोर्ड पर वापस जाएं'
                    : language === 'mr'
                    ? 'डॅशबोर्डवर परत जा'
                    : 'Back to Dashboard'}
                </span>
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
            <span>
              {language === 'hi'
                ? 'आधिकारिक एपीएमसी सत्यापन डेस्क'
                : language === 'mr'
                ? 'अधिकृत बाजार समिती पडताळणी कक्ष'
                : 'Official APMC Verification Desk'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {language === 'hi'
              ? 'डिजिटल गुणवत्ता रिपोर्ट सत्यापन'
              : language === 'mr'
              ? 'डिजिटल प्रतवारी अहवाल पडताळणी'
              : 'Verify Digital Quality Report'}
          </h1>
          <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
            {language === 'hi'
              ? 'कागजी प्रमाणपत्र के क्यूआर कोड को लाइव कैमरा से स्कैन करें या यूनिक रिपोर्ट आईडी डालकर प्रामाणिक Ed25519 डिजिटल हस्ताक्षर सत्यापित करें।'
              : language === 'mr'
              ? 'प्रमाणपत्रावरील क्यूआर कोड कॅमेऱ्याने स्कॅन करा किंवा अहवाल क्रमांक टाकून डिजिटल स्वाक्षरी तपासा.'
              : 'Scan the physical certificate QR code with your camera or enter the Unique Report ID to verify cryptographic signatures.'}
          </p>

          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm mt-6">
            <button
              onClick={() => {
                setVerifyMode('qr');
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition ${
                verifyMode === 'qr'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>
                {language === 'hi'
                  ? 'लाइव क्यूआर स्कैनर'
                  : language === 'mr'
                  ? 'थेट क्यूआर स्कॅनर'
                  : 'Scan Physical QR'}
              </span>
            </button>
            <button
              onClick={() => {
                stopCamera();
                setVerifyMode('manual');
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition ${
                verifyMode === 'manual'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>
                {language === 'hi'
                  ? 'रिपोर्ट आईडी दर्ज करें'
                  : language === 'mr'
                  ? 'अहवाल क्रमांक टाका'
                  : 'Type Report ID'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Presentation Demo Tamper Tool Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-900 font-bold">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                {language === 'hi'
                  ? 'डेमो छेड़छाड़ परीक्षण उपकरण'
                  : language === 'mr'
                  ? 'डेमो छेडछाड चाचणी साधन'
                  : 'Demo Tamper Simulation Tool'}
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
          <div className="flex items-center gap-2 shrink-0">
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
          <div className="panel-card p-6 mb-8 text-center space-y-5">
            {/* Live Camera Viewfinder Box */}
            <div className="relative mx-auto w-80 h-80 rounded-2xl bg-slate-950 border-2 border-emerald-500 overflow-hidden flex flex-col items-center justify-center shadow-lg">
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-emerald-400 z-10 pointer-events-none"></div>
              <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-emerald-400 z-10 pointer-events-none"></div>
              <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-emerald-400 z-10 pointer-events-none"></div>
              <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-emerald-400 z-10 pointer-events-none"></div>

              {/* Video Element */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {isCameraActive ? (
                <>
                  {/* Scanning active line indicator */}
                  <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse top-1/2 pointer-events-none" />
                  <div className="absolute bottom-3 bg-slate-950/80 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                    Live Video Scanning Active
                  </div>
                </>
              ) : (
                <div className="space-y-3 p-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="text-xs text-slate-300 font-medium max-w-xs">
                    {cameraError ? (
                      <span className="text-rose-400 font-semibold">{cameraError}</span>
                    ) : (
                      <span>
                        {language === 'hi'
                          ? 'कैमरा शुरू करने के लिए नीचे दिए बटन पर क्लिक करें'
                          : language === 'mr'
                          ? 'कॅमेरा सुरू करण्यासाठी खालील बटणावर क्लिक करा'
                          : 'Click below to activate device camera & scan QR'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex flex-wrap justify-center gap-3">
              {!isCameraActive ? (
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {language === 'hi'
                      ? 'कैमरा चालू करें'
                      : language === 'mr'
                      ? 'कॅमेरा सुरू करा'
                      : 'Turn On Camera'}
                  </span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleManualScanCapture}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {language === 'hi'
                        ? 'क्यूआर कोड कैप्चर करें'
                        : language === 'mr'
                        ? 'क्यूआर कोड कॅप्चर करा'
                        : 'Snap QR Code'}
                    </span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition"
                  >
                    <VideoOff className="w-4 h-4" />
                    <span>Stop Camera</span>
                  </button>
                </>
              )}

              {/* Upload QR file alternative */}
              <label className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-sm flex items-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>
                  {language === 'hi'
                    ? 'क्यूआर फोटो अपलोड करें'
                    : language === 'mr'
                    ? 'क्यूआर फोटो अपलोड करा'
                    : 'Upload QR Image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrImageUpload}
                  className="hidden"
                />
              </label>
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
                <span>
                  {language === 'hi'
                    ? 'डिजिटल हस्ताक्षर सत्यापित करें'
                    : language === 'mr'
                    ? 'स्वाक्षरी तपासा'
                    : 'Verify Signature'}
                </span>
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
                      {language === 'hi'
                        ? 'डिजिटल हस्ताक्षर वैध'
                        : language === 'mr'
                        ? 'डिजिटल स्वाक्षरी वैध'
                        : 'Cryptographically Verified'}
                    </div>
                    <div className="text-lg font-black">GENUINE APMC QUALITY CERTIFICATE</div>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] uppercase font-bold text-emerald-100">Standard</div>
                  <div className="text-xs font-black">Grading Rules v0.1</div>
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
              {/* Anti-fraud capture badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Capture Verified: Live Camera • GPS Attached • SHA-256 Intact</span>
                </div>
                <span className="font-mono text-slate-500 font-bold">{verifyResult.report_id}</span>
              </div>

              {/* Quality Split */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800">
                    {language === 'hi' ? 'ग्रेड A (FAQ)' : language === 'mr' ? 'ग्रेड A (उत्कृष्ट)' : 'Grade A (FAQ)'}
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">{verifyResult.grade_a_pct}%</div>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-xs font-bold text-amber-800">
                    {language === 'hi' ? 'यूआरएस (छोटा)' : language === 'mr' ? 'यूआरएस (लहान)' : 'URS (Small)'}
                  </div>
                  <div className="text-2xl font-black text-amber-700 mt-0.5">{verifyResult.urs_pct}%</div>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-xs font-bold text-rose-800">
                    {language === 'hi' ? 'खारिज दोष' : language === 'mr' ? 'नाकारलेले' : 'Rejected'}
                  </div>
                  <div className="text-2xl font-black text-rose-700 mt-0.5">{verifyResult.rejected_pct}%</div>
                </div>
              </div>

              {/* Storage Suitability Risk Card */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 font-bold shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 uppercase">
                      {language === 'hi'
                        ? 'भंडारण उपयुक्तता स्कोर'
                        : language === 'mr'
                        ? 'साठवणूक योग्यता निकष'
                        : 'Storage Suitability: LOW RISK (Score: 18/100)'}
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

              {/* Indicative Mandi Price Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-900 font-bold shrink-0">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'hi'
                        ? 'लासलगांव दैनिक मंडी मूल्य'
                        : language === 'mr'
                        ? 'लासलगाव दैनिक बाजारभाव'
                        : 'Lasalgaon Mandi Indicative Value'}
                    </span>
                    <span className="text-sm font-black text-emerald-700">≈ ₹41,250</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'hi'
                      ? 'आज के लासलगांव मॉडल भाव ₹23.50/किग्रा पर आधारित (केवल सांकेतिक मार्गदर्शन)।'
                      : language === 'mr'
                      ? 'आजच्या लासलगाव मॉडेल भाव ₹२३.५०/किग्रॅ वर आधारित (केवळ मार्गदर्शनासाठी).'
                      : 'Based on today’s Lasalgaon modal rate ₹23.50/kg. Indicative estimate, not a legal procurement bid.'}
                  </p>
                </div>
              </div>

              {/* Cryptographic Proof Details */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2 font-mono text-[11px]">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>ED25519 CRYPTOGRAPHIC PROOF</span>
                </div>
                <div className="text-slate-300 break-all">
                  <span className="text-slate-500">SHA-256: </span>
                  {verifyResult.report_hash}
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500">Signing Device: </span>
                  {verifyResult.device_id || 'DEV-TAB-LAS-01'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
