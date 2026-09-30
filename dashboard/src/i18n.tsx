import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}

export const translations: Translations = {
  // Brand & Header
  appTitle: {
    en: 'AGRI-GRADE AI',
    hi: 'एग्री-ग्रेड एआई',
    mr: 'ॲग्री-ग्रेड एआय',
  },
  departmentLabel: {
    en: 'Department of Consumer Affairs • AI Quality Intelligence',
    hi: 'उपभोक्ता मामले विभाग • एआई गुणवत्ता विश्लेषण',
    mr: 'ग्राहक व्यवहार विभाग • एआय गुणवत्ता विश्लेषण',
  },
  systemLive: {
    en: 'DEMO DATA • 6 SIMULATED MANDIS',
    hi: 'डेमो डेटा • 6 सिमुलेटेड मंडियां',
    mr: 'डेमो डेटा • ६ प्रात्यक्षिक बाजार समित्या',
  },
  demoModeActive: {
    en: 'DEMO MODE ACTIVE',
    hi: 'डेमो मोड सक्रिय',
    mr: 'डेमो मोड सक्रिय',
  },
  refresh: {
    en: 'Refresh',
    hi: 'ताज़ा करें',
    mr: 'रिफ्रेश करा',
  },

  // Navigation Items
  navOverview: {
    en: 'Regional Overview',
    hi: 'क्षेत्रीय अवलोकन',
    mr: 'प्रादेशिक आढावा',
  },
  navReports: {
    en: 'Reports & Statements',
    hi: 'रिपोर्ट और विवरण',
    mr: 'अहवाल आणि पत्रके',
  },
  navConsistency: {
    en: 'Consistency & Bias',
    hi: 'स्थिरता और निष्पक्षता',
    mr: 'सुसंगतता आणि अचूकता',
  },
  navDisputes: {
    en: 'Disputes Queue',
    hi: 'विवाद निवारण सूची',
    mr: 'तक्रार निवारण कक्ष',
  },
  navRules: {
    en: 'Grading Rules Editor',
    hi: 'ग्रेडिंग नियम संपादक',
    mr: 'प्रतवारी नियम संपादक',
  },
  navAudit: {
    en: 'Tamper-Evident Audit Log',
    hi: 'हैश-चेन ऑडिट लॉग',
    mr: 'हॅश-साखळी ऑडिट नोंद',
  },
  navVerify: {
    en: 'Public Report Verifier',
    hi: 'सार्वजनिक रिपोर्ट सत्यापन',
    mr: 'प्रमाणपत्र पडताळणी',
  },
  navSettings: {
    en: 'System & AI Settings',
    hi: 'सिस्टम और एआई सेटिंग्स',
    mr: 'प्रणाली आणि एआय सेटिंग्ज',
  },

  // Overview Page
  regionalOverviewTitle: {
    en: 'Regional Procurement & Quality Intelligence',
    hi: 'क्षेत्रीय खरीद एवं गुणवत्ता विश्लेषण पोर्टल',
    mr: 'प्रादेशिक खरेदी आणि गुणवत्ता विश्लेषण प्रणाली',
  },
  regionalOverviewSubtitle: {
    en: 'Real-time aggregation from 6 Nashik Division APMC Mandis & Quality Labs',
    hi: 'नासिक मंडल की 6 एपीएमसी मंडियों और प्रयोगशालाओं से वास्तविक समय का डेटा',
    mr: 'नाशिक विभागातील ६ कृषी उत्पन्न बाजार समित्या आणि लॅबमधून थेट संकलित माहिती',
  },
  timeToday: {
    en: 'Today',
    hi: 'आज',
    mr: 'आज',
  },
  time7d: {
    en: 'Last 7 Days',
    hi: 'पिछले 7 दिन',
    mr: 'मागील ७ दिवस',
  },
  time30d: {
    en: 'Last 30 Days',
    hi: 'पिछले 30 दिन',
    mr: 'मागील ३० दिवस',
  },
  timeCustom: {
    en: 'Custom Range',
    hi: 'कस्टम अवधि',
    mr: 'इतर कालावधी',
  },

  // KPI & Metrics
  totalGradedToday: {
    en: 'Total Lots Graded Today',
    hi: 'आज कुल मूल्यांकित लॉट्स',
    mr: 'आज तपासलेले एकूण लॉट्स',
  },
  totalVolumeGraded: {
    en: 'Total Procurement Volume',
    hi: 'कुल खरीद मात्रा',
    mr: 'एकूण खरेदी आवक',
  },
  gradeAYield: {
    en: 'Average Grade A (FAQ)',
    hi: 'औसत ग्रेड A (उत्कृष्ट)',
    mr: 'सरासरी ग्रेड A (उत्कृष्ट)',
  },
  ursUndersized: {
    en: 'URS / Undersized Rate',
    hi: 'यूआरएस / छोटा आकार दर',
    mr: 'यूआरएस / लहान कांदा प्रमाण',
  },
  openDisputes: {
    en: 'Open Farmer Disputes',
    hi: 'प्रलंबित किसान विवाद',
    mr: 'प्रलंबित शेतकरी तक्रारी',
  },
  todayQualityOverview: {
    en: "Today's Quality Overview",
    hi: 'आज का गुणवत्ता विवरण',
    mr: 'आजचा गुणवत्ता आढावा',
  },
  weeklyTrend: {
    en: '7-Day Grade A & URS Trend',
    hi: '7-दिवसीय ग्रेड A और यूआरएस रुझान',
    mr: '७ दिवसांचा ग्रेड A आणि यूआरएस कल',
  },
  centreComparisonTitle: {
    en: 'Procurement Centre & Mandi Performance',
    hi: 'खरीद केंद्र एवं मंडी प्रदर्शन',
    mr: 'खरेदी केंद्र आणि बाजार समिती कामगिरी',
  },
  centreColName: {
    en: 'Centre / Mandi Name',
    hi: 'केंद्र / मंडी का नाम',
    mr: 'केंद्र / बाजार समितीचे नाव',
  },
  centreColLots: {
    en: 'Lots Graded',
    hi: 'जांचे गए लॉट्स',
    mr: 'तपासलेले लॉट्स',
  },
  centreColGradeA: {
    en: 'Grade A %',
    hi: 'ग्रेड A %',
    mr: 'ग्रेड A %',
  },
  centreColURS: {
    en: 'URS %',
    hi: 'यूआरएस %',
    mr: 'यूआरएस %',
  },
  centreColStatus: {
    en: 'Sync Status',
    hi: 'सिंक स्थिति',
    mr: 'सिंक स्थिती',
  },
  defectBreakdownTitle: {
    en: 'Primary Defect Factor Breakdown',
    hi: 'प्राथमिक दोष कारक विश्लेषण',
    mr: 'मुख्य कांदा दोष विश्लेषण',
  },
  recentInspectionsTitle: {
    en: 'Live Inspection Feed & Signed Reports',
    hi: 'लाइव निरीक्षण एवं हस्ताक्षरित डिजिटल रिपोर्ट',
    mr: 'थेट तपासणी आणि स्वाक्षरी केलेले डिजिटल अहवाल',
  },

  // Grades
  gradeA: {
    en: 'Grade A (FAQ Standard)',
    hi: 'ग्रेड A (उत्कृष्ट मानक)',
    mr: 'ग्रेड A (उत्कृष्ट प्रत)',
  },
  gradeURS: {
    en: 'URS (Small 35-45mm)',
    hi: 'यूआरएस (छोटा 35-45 मिमी)',
    mr: 'यूआरएस (लहान 35-45 मिमी)',
  },
  gradeRejected: {
    en: 'Rejected / Defective',
    hi: 'खारिज / दोषपूर्ण',
    mr: 'नाकारलेला / खराब कांदा',
  },

  // Defect Names
  defectSprouting: {
    en: 'Sprouting (Internal/External)',
    hi: 'अंकुरण (भीतरी/बाहरी)',
    mr: 'कोंब फुटणे (अंतर्गत/बाह्य)',
  },
  defectDamage: {
    en: 'Mechanical Damage & Cuts',
    hi: 'यांत्रिक क्षति एवं कट',
    mr: 'यांत्रिक इजा व काप',
  },
  defectRotten: {
    en: 'Basal / Neck Rot',
    hi: 'सड़न (गर्दन/जड़)',
    mr: 'सड (मान/बुडखा)',
  },
  defectMold: {
    en: 'Black Mold (Aspergillus)',
    hi: 'काली फफूंद (ब्लैक मोल्ड)',
    mr: 'काळी बुरशी',
  },

  // Actions & Buttons
  verifyQRButton: {
    en: 'Verify QR Report',
    hi: 'क्यूआर रिपोर्ट सत्यापित करें',
    mr: 'क्यूआर अहवाल तपासा',
  },
  supervisorHub: {
    en: 'Supervisor Hub',
    hi: 'पर्यवेक्षक केंद्र',
    mr: 'पर्यवेक्षक केंद्र',
  },
  launchSupervisorConsole: {
    en: 'Launch Supervisor Console',
    hi: 'पर्यवेक्षक कंसोल खोलें',
    mr: 'पर्यवेक्षक कन्सोल उघडा',
  },
  scanQRCode: {
    en: 'Scan Physical QR Code',
    hi: 'भौतिक क्यूआर कोड स्कैन करें',
    mr: 'भौतिक क्यूआर कोड स्कॅन करा',
  },
  typeReportID: {
    en: 'Type Report ID',
    hi: 'रिपोर्ट आईडी दर्ज करें',
    mr: 'अहवाल क्रमांक टाका',
  },
  viewDetails: {
    en: 'View Details',
    hi: 'विवरण देखें',
    mr: 'तपशील पहा',
  },
  backToDashboard: {
    en: 'Back to Dashboard',
    hi: 'डैशबोर्ड पर वापस जाएं',
    mr: 'डॅशबोर्डवर परत जा',
  },
  exportPdf: {
    en: 'Export PDF Statement',
    hi: 'पीडीएफ विवरण डाउनलोड करें',
    mr: 'पीडीएफ अहवाल डाऊनलोड करा',
  },
  systemSummaryAI: {
    en: 'AI Real-Time Insight',
    hi: 'एआई वास्तविक समय अंतर्दृष्टि',
    mr: 'एआई थेट निरीक्षण विश्लेषण',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    if (saved === 'hi' || saved === 'mr' || saved === 'en') return saved;
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
