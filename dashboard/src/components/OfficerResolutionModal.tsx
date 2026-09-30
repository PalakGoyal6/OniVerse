import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Sprout,
  Flame,
  Scissors,
  HelpCircle,
  Save,
  Layers,
} from 'lucide-react';
import { useLanguage } from '../i18n';

interface OfficerResolutionModalProps {
  onion: any;
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    onionId: string,
    chosenClass: string,
    reasonOption: string,
    customReason: string
  ) => void;
}

const CLASS_OPTIONS = [
  { id: 'Healthy', labelEn: 'Healthy', labelHi: 'स्वस्थ', labelMr: 'चांगला', icon: CheckCircle2, color: 'emerald' },
  { id: 'Sprouting', labelEn: 'Sprouting', labelHi: 'अंकुरित', labelMr: 'कोंब फुटलेला', icon: Sprout, color: 'lime' },
  { id: 'Rotten', labelEn: 'Rotten', labelHi: 'सड़ा हुआ', labelMr: 'सडका', icon: Flame, color: 'rose' },
  { id: 'Mould', labelEn: 'Mould', labelHi: 'फफूंद', labelMr: 'बुरशीयुक्त', icon: ShieldAlert, color: 'purple' },
  { id: 'Mechanical damage', labelEn: 'Mechanical damage', labelHi: 'यांत्रिक क्षति / कटा हुआ', labelMr: 'कापलेला / इजा झालेला', icon: Scissors, color: 'orange' },
];

const REASON_OPTIONS = [
  { id: 'Looked at it closely', labelEn: 'Looked at it closely', labelHi: 'नजदीक से प्रत्यक्ष निरीक्षण किया', labelMr: 'जवळून प्रत्यक्ष पाहणी केली' },
  { id: 'Rot visible underneath', labelEn: 'Rot visible underneath', labelHi: 'निचली सतह पर सड़न दिखाई दे रही है', labelMr: 'तळाशी सड स्पष्ट दिसत आहे' },
  { id: 'AI misread dry skin', labelEn: 'AI misread dry skin', labelHi: 'एआई ने सूखी छिलके की परत को दोष माना', labelMr: 'एआयने सुकलेल्या सालीला दोष समजले' },
  { id: 'Other', labelEn: 'Other (Specify below)', labelHi: 'अन्य कारण (नीचे लिखें)', labelMr: 'इतर कारण (खाली नमूद करा)' },
];

export const OfficerResolutionModal: React.FC<OfficerResolutionModalProps> = ({
  onion,
  imageSrc,
  isOpen,
  onClose,
  onSave,
}) => {
  const { language } = useLanguage();
  const [chosenClass, setChosenClass] = useState<string>(onion?.class || 'Healthy');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);

  // Normalize initial class
  useEffect(() => {
    if (onion) {
      const c = onion.class ? onion.class.toLowerCase() : 'healthy';
      if (c.includes('sprout')) setChosenClass('Sprouting');
      else if (c.includes('rot')) setChosenClass('Rotten');
      else if (c.includes('mould') || c.includes('mold')) setChosenClass('Mould');
      else if (c.includes('damage') || c.includes('mech')) setChosenClass('Mechanical damage');
      else setChosenClass('Healthy');

      setSelectedReason('');
      setCustomReasonText('');
    }
  }, [onion]);

  // Crop the onion from the source image via HTML5 Canvas using bbox_xyxy
  useEffect(() => {
    if (!isOpen || !onion || !imageSrc) {
      setCroppedDataUrl(null);
      return;
    }

    setIsCropping(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const bbox = onion.bbox_xyxy;
        if (bbox && bbox.length === 4) {
          const [x1, y1, x2, y2] = bbox;
          const boxW = x2 - x1;
          const boxH = y2 - y1;
          const padX = Math.max(12, boxW * 0.1);
          const padY = Math.max(12, boxH * 0.1);

          const sx = Math.max(0, Math.floor(x1 - padX));
          const sy = Math.max(0, Math.floor(y1 - padY));
          const sw = Math.min(img.naturalWidth - sx, Math.ceil(boxW + 2 * padX));
          const sh = Math.min(img.naturalHeight - sy, Math.ceil(boxH + 2 * padY));

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(sw, 50);
          canvas.height = Math.max(sh, 50);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            setCroppedDataUrl(canvas.toDataURL('image/jpeg', 0.95));
          } else {
            setCroppedDataUrl(imageSrc);
          }
        } else {
          setCroppedDataUrl(imageSrc);
        }
      } catch (err) {
        console.warn('Cropping error:', err);
        setCroppedDataUrl(imageSrc);
      } finally {
        setIsCropping(false);
      }
    };
    img.onerror = () => {
      setCroppedDataUrl(imageSrc);
      setIsCropping(false);
    };
    img.src = imageSrc;
  }, [isOpen, onion, imageSrc]);

  if (!isOpen || !onion) return null;

  const confPercent = Math.round((onion.confidence || 0) * 100);
  const aiClassRaw = onion.original_class || onion.class || 'Unknown';
  const aiClassDisplay =
    aiClassRaw.charAt(0).toUpperCase() + aiClassRaw.slice(1).replace('_', ' ');

  const isSaveEnabled =
    Boolean(chosenClass) &&
    Boolean(selectedReason) &&
    (selectedReason !== 'Other' || customReasonText.trim().length > 0);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSaveEnabled) return;
    onSave(onion.onion_id, chosenClass, selectedReason, customReasonText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <div>
              <h2 className="text-sm font-black tracking-wide flex items-center gap-2">
                <span>{language === 'hi' ? 'अधिकारी सत्यापन एवं निर्णय' : language === 'mr' ? 'अधिकारी तपासणी व निर्णय' : 'Officer Resolution & Override'}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {onion.onion_id}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'hi'
                  ? 'संदिग्ध / कम-विश्वास वाले प्याज की जाँच करें और सही श्रेणी चुनें।'
                  : language === 'mr'
                  ? 'संशयास्पद कांद्याची पाहणी करा आणि योग्य वर्ग निवडा.'
                  : 'Inspect low-confidence or pending bulb and confirm the ground-truth class.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Top: Large Cropped Bulb Photo */}
          <div className="relative w-full h-56 sm:h-64 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">
            {isCropping ? (
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Extracting high-res crop...</span>
              </div>
            ) : croppedDataUrl ? (
              <img
                src={croppedDataUrl}
                alt={`Cropped Bulb ${onion.onion_id}`}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                <Layers className="w-8 h-8 text-slate-600" />
                <span>No crop preview available</span>
              </div>
            )}

            {/* Bounding box / Sizing badge */}
            <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-2">
              <span>Diameter: {onion.diameter_mm ? `${onion.diameter_mm} mm` : 'Not measured'}</span>
              <span>•</span>
              <span>Weight: {onion.estimated_weight_g ? `${onion.estimated_weight_g} g` : '—'}</span>
            </div>
          </div>

          {/* AI Inference Prediction Banner */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  {language === 'hi' ? 'एआई मॉडल अनुमान' : language === 'mr' ? 'एआय मॉडेलचा अंदाज' : 'What the AI Thinks'}
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                  {confPercent}% sure
                </span>
              </div>
              <p className="text-xs font-black text-amber-950 mt-0.5">
                {aiClassDisplay}, {confPercent}% sure
              </p>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-tight">
                {onion.reason || 'Flagged for officer manual verification due to low confidence threshold (<60%).'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Step 1: Choose Correct Class */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {language === 'hi'
                  ? '1. सही श्रेणी चुनें (Officer Ground Truth Class)'
                  : language === 'mr'
                  ? '१. योग्य वर्ग निवडा (Officer Ground Truth Class)'
                  : '1. Select Correct Ground Truth Class'}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CLASS_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = chosenClass === opt.id;
                  const label =
                    language === 'hi'
                      ? opt.labelHi
                      : language === 'mr'
                      ? opt.labelMr
                      : opt.labelEn;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setChosenClass(opt.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                        isSelected
                          ? opt.id === 'Healthy'
                            ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600 text-emerald-950 font-bold shadow-sm'
                            : 'bg-rose-50 border-rose-600 ring-2 ring-rose-600 text-rose-950 font-bold shadow-sm'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isSelected
                            ? opt.id === 'Healthy'
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                            : 'text-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs truncate">{opt.labelEn}</div>
                        {(language === 'hi' || language === 'mr') && (
                          <div className="text-[10px] text-slate-500 truncate">{label}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Required Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {language === 'hi'
                  ? '2. निर्णय का कारण (Required Reason)'
                  : language === 'mr'
                  ? '२. निर्णयाचे कारण (Required Reason)'
                  : '2. Required Verification Reason'}
                <span className="text-rose-500 ml-1">*</span>
              </label>

              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              >
                <option value="">
                  {language === 'hi'
                    ? '-- कृपया कारण चुनें --'
                    : language === 'mr'
                    ? '-- कृपया कारण निवडा --'
                    : '-- Select Required Reason --'}
                </option>
                {REASON_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {language === 'hi'
                      ? `${r.labelEn} (${r.labelHi})`
                      : language === 'mr'
                      ? `${r.labelEn} (${r.labelMr})`
                      : r.labelEn}
                  </option>
                ))}
              </select>

              {/* If "Other" selected, display text input */}
              {selectedReason === 'Other' && (
                <div className="mt-2">
                  <textarea
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    placeholder={
                      language === 'hi'
                        ? 'कृपया विस्तृत कारण दर्ज करें...'
                        : language === 'mr'
                        ? 'कृपया सविस्तर कारण लिहा...'
                        : 'Please specify exact reason for officer override...'
                    }
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition resize-none"
                    required
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              >
                {language === 'hi' ? 'रद्द करें' : language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!isSaveEnabled}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {language === 'hi'
                    ? 'पुष्टि करें और लॉट अपडेट करें (Save)'
                    : language === 'mr'
                    ? 'जतन करा आणि लॉट अद्ययावत करा (Save)'
                    : 'Save Resolution'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
