import { deepMerge } from "../merge";
import type { LocaleCode, MessageTree } from "../types";
import { dashboardLocalePatches } from "./dashboard-patches";
import { enMessages } from "./en";

const hi: Record<string, unknown> = {
  common: {
    pleaseWait: "कृपया प्रतीक्षा करें…",
    back: "वापस",
    continue: "जारी रखें",
    next: "आगे",
    optional: "(वैकल्पिक)",
    fromGst: "GST से",
    networkError: "नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।",
  },
  login: {
    signIn: "साइन इन",
    title: "अपने स्टोर में लॉगिन करें",
    subtitle: "OTP पाने के लिए अपना पंजीकृत मोबाइल नंबर दर्ज करें।",
    mobileLabel: "मोबाइल नंबर",
    editMobile: "संपादित करें",
    enterOtp: "OTP दर्ज करें",
    getOtp: "OTP प्राप्त करें",
    verifyLogin: "सत्यापित करें और लॉगिन करें",
    createAccount: "नया खाता बनाएं",
    invalidMobile: "मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें",
    enterOtpError: "6 अंकों का OTP दर्ज करें",
    heroLine2: "एक डैशबोर्ड से",
    heroSubtitle:
      "स्टॉक, बिलिंग, खरीद और रिपोर्ट — काउंटर पर गति और बैक ऑफिस में स्पष्टता के लिए।",
    badge: "किराना, परिधान और सामान्य व्यापार के लिए",
  },
  register: {
    createAccount: "खाता बनाएं",
    alreadyHaveAccount: "पहले से खाता है?",
    loginLink: "लॉगिन",
    steps: {
      language: "भाषा चुनें",
      gst: "GST नंबर दर्ज करें",
      detailsOtp: "विवरण और OTP सत्यापन",
    },
    language: {
      title: "अपनी भाषा चुनें",
      subtitle: "डैशबोर्ड और सूचनाओं के लिए इसका उपयोग होगा",
      chooseError: "जारी रखने के लिए भाषा चुनें",
    },
    gst: {
      label: "GST नंबर",
      hint: "GST प्रमाणपत्र पर 15 अक्षर का GSTIN",
      verifyContinue: "सत्यापित करें और आगे बढ़ें",
      verifying: "सत्यापन…",
      skip: "छोड़ें — विवरण मैन्युअल भरें",
      invalidGstin: "मान्य 15 अक्षर का GSTIN दर्ज करें",
    },
    details: {
      contactName: "संपर्क नाम",
      tradeName: "व्यापार नाम",
      selectType: "प्रकार चुनें",
      mobileLabel: "मोबाइल नंबर",
      noGst: "GST नहीं — नीचे व्यवसाय विवरण दर्ज करें।",
    },
    otp: {
      sentTo: "OTP भेजा गया",
      enterOtp: "OTP दर्ज करें",
      verifyComplete: "सत्यापित करें और पूरा करें",
    },
  },
  sidebar: {
    title: "एक रिटेल ERP पर अपनी दुकान चलाने के लिए साइन अप करें",
    featuresTitle: "EasyVyapaar के साथ आपको क्या मिलता है",
    feature1: "इन्वेंटरी और बिलिंग एक जगह",
    feature2: "GST तैयार इनवॉइस और रिपोर्ट",
    feature3: "मल्टी-स्टोर और स्टाफ प्रबंधन",
    feature4: "रियल-टाइम स्टॉक और बिक्री एनालिटिक्स",
    feature5: "किराना और खुदरा व्यापार के लिए",
    trusted: "भारत भर के रिटेलर्स का भरोसा",
  },
};

const gu: Record<string, unknown> = {
  common: { back: "પાછા", continue: "આગળ", next: "આગળ", pleaseWait: "રાહ જુઓ…" },
  login: {
    title: "તમારા સ્ટોરમાં લૉગિન કરો",
    subtitle: "OTP માટે તમારો નોંધાયેલ મોબાઇલ નંબર દાખલ કરો.",
    getOtp: "OTP મેળવો",
    verifyLogin: "ચકાસો અને લૉગિન",
    createAccount: "નવું એકાઉન્ટ બનાવો",
  },
  register: {
    createAccount: "એકાઉન્ટ બનાવો",
    alreadyHaveAccount: "પહેલેથી એકાઉન્ટ છે?",
    loginLink: "લૉગિન",
    steps: {
      language: "ભાષા પસંદ કરો",
      gst: "GST નંબર દાખલ કરો",
      detailsOtp: "વિગતો અને OTP",
    },
    language: {
      title: "તમારી ભાષા પસંદ કરો",
      subtitle: "ડેશબોર્ડ અને સૂચનાઓ માટે ઉપયોગ થશે",
    },
  },
  sidebar: {
    title: "એક રિટેલ ERP પર તમારી દુકાન ચલાવવા માટે સાઇન અપ કરો",
    featuresTitle: "EasyVyapaar સાથે તમને શું મળે છે",
    feature1: "ઇન્વેન્ટરી અને બિલિંગ એક જ જગ્યાએ",
    feature2: "GST તૈયાર ઇન્વૉઇસ અને રિપોર્ટ",
    feature3: "મલ્ટી-સ્ટોર અને સ્ટાફ મેનેજમેન્ટ",
    feature4: "રિયલ-ટાઇમ સ્ટોક અને વેચાણ એનાલિટિક્સ",
    feature5: "કિરાના અને રિટેલ વ્યાપાર માટે",
    trusted: "ભારત ભરના રિટેલર્સનો વિશ્વાસ",
  },
};

const mr: Record<string, unknown> = {
  common: { back: "मागे", continue: "पुढे", next: "पुढे", pleaseWait: "प्रतीक्षा करा…" },
  login: {
    title: "तुमच्या दुकानात लॉगिन करा",
    subtitle: "OTP साठी नोंदणीकृत मोबाइल नंबर टाका.",
    getOtp: "OTP मिळवा",
    verifyLogin: "पडताळा आणि लॉगिन",
    createAccount: "नवीन खाते तयार करा",
  },
  register: {
    createAccount: "खाते तयार करा",
    alreadyHaveAccount: "आधीच खाते आहे?",
    loginLink: "लॉगिन",
    steps: {
      language: "भाषा निवडा",
      gst: "GST नंबर टाका",
      detailsOtp: "तपशील आणि OTP",
    },
    language: { title: "तुमची भाषा निवडा" },
  },
  sidebar: {
    title: "एका रिटेल ERP वर तुमची दुकान चालवण्यासाठी साइन अप करा",
    featuresTitle: "EasyVyapaar सोबत तुम्हाला काय मिळते",
    feature1: "इन्व्हेंटरी आणि बिलिंग एकाच ठिकाणी",
    feature2: "GST तयार इन्व्हॉइस आणि अहवाल",
    feature3: "मल्टी-स्टोअर आणि कर्मचारी व्यवस्थापन",
    feature4: "रियल-टाइम स्टॉक आणि विक्री विश्लेषण",
    feature5: "किराणा आणि किरकोळ व्यापारासाठी",
    trusted: "भारतभरातील किरकोळ विक्रेत्यांचा विश्वास",
  },
};

const ta: Record<string, unknown> = {
  common: { back: "பின்", continue: "தொடர்", next: "அடுத்து", pleaseWait: "காத்திருக்கவும்…" },
  login: {
    title: "உங்கள் கடையில் உள்நுழையுங்கள்",
    subtitle: "OTP பெற உங்கள் பதிவு செய்யப்பட்ட மொைல் எண்ணை உள்ளிடுங்கள்.",
    getOtp: "OTP பெறுங்கள்",
    verifyLogin: "சரிபார்த்து உள்நுழை",
    createAccount: "புதிய கணக்கு உருவாக்கு",
  },
  register: {
    createAccount: "கணக்கு உருவாக்கு",
    alreadyHaveAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
    loginLink: "உள்நுழை",
    steps: {
      language: "மொழி தேர்வு",
      gst: "GST எண்",
      detailsOtp: "விவரங்கள் & OTP",
    },
    language: { title: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்" },
  },
  sidebar: {
    title: "ஒரு ரீடெயில் ERP-இல் உங்கள் கடையை நடத்த பதிவு செய்யுங்கள்",
    featuresTitle: "EasyVyapaar உடன் நீங்கள் பெறுவது",
    feature1: "இன்வெண்டரி மற்றும் பில்லிங் ஒரே இடத்தில்",
    feature2: "GST தயார் இன்வாய்ஸ் மற்றும் அறிக்கைகள்",
    feature3: "பல கடைகள் மற்றும் ஊழியர் மேலாண்மை",
    feature4: "நேரடி ஸ்டாக் மற்றும் விற்பனை பகுப்பாய்வு",
    feature5: "கிராமங்கள் மற்றும் சில்லறை வணிகத்திற்கு",
    trusted: "இந்தியா முழுவதும் சில்லறை விற்பனையாளர்களின் நம்பிக்கை",
  },
};

const te: Record<string, unknown> = {
  common: { back: "వెనక్కి", continue: "కొనసాగించు", next: "తదుపరి", pleaseWait: "వేచి ఉండండి…" },
  login: {
    title: "మీ స్టోర్‌కు లాగిన్ అవ్వండి",
    subtitle: "OTP కోసం నమోదిత మొబైల్ నంబర్ నమోదు చేయండి.",
    getOtp: "OTP పొందండి",
    verifyLogin: "ధృవీకరించి లాగిన్",
    createAccount: "కొత్త ఖాతా సృష్టించండి",
  },
  register: {
    createAccount: "ఖాతా సృష్టించండి",
    alreadyHaveAccount: "ఇప్పటికే ఖాతా ఉందా?",
    loginLink: "లాగిన్",
    steps: {
      language: "భాష ఎంచుకోండి",
      gst: "GST నంబర్",
      detailsOtp: "వివరాలు & OTP",
    },
    language: { title: "మీ భాషను ఎంచుకోండి" },
  },
  sidebar: {
    title: "ఒక రిటైల్ ERPలో మీ దుకాణాన్ని నడపడానికి సైన్ అప్ చేయండి",
    featuresTitle: "EasyVyapaarతో మీకు లభించేవి",
    feature1: "ఇన్వెంటరీ మరియు బిల్లింగ్ ఒకే చోట",
    feature2: "GST సిద్ధమైన ఇన్వాయిస్లు మరియు నివేదికలు",
    feature3: "మల్టీ-స్టోర్ మరియు సిబ్బంది నిర్వహణ",
    feature4: "రియల్-టైమ్ స్టాక్ మరియు అమ్మకాల విశ్లేషణ",
    feature5: "కిరాణా మరియు రిటైల్ వ్యాపారానికి",
    trusted: "భారతదేశం అంతటా రిటైలర్ల నమ్మకం",
  },
};

const pa: Record<string, unknown> = {
  common: { back: "ਪਿੱਛੇ", continue: "ਜਾਰੀ ਰੱਖੋ", next: "ਅੱਗੇ", pleaseWait: "ਉਡੀਕ ਕਰੋ…" },
  login: {
    title: "ਆਪਣੇ ਸਟੋਰ ਵਿੱਚ ਲੌਗਇਨ ਕਰੋ",
    subtitle: "OTP ਲਈ ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਨੰਬਰ ਦਾਖਲ ਕਰੋ।",
    getOtp: "OTP ਲਓ",
    verifyLogin: "ਪੁਸ਼ਟੀ ਕਰੋ ਅਤੇ ਲੌਗਇਨ",
    createAccount: "ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ",
  },
  register: {
    createAccount: "ਖਾਤਾ ਬਣਾਓ",
    alreadyHaveAccount: "ਪਹਿਲਾਂ ਹੀ ਖਾਤਾ ਹੈ?",
    loginLink: "ਲੌਗਇਨ",
    steps: {
      language: "ਭਾਸ਼ਾ ਚੁਣੋ",
      gst: "GST ਨੰਬਰ",
      detailsOtp: "ਵਿਵਰਣ ਅਤੇ OTP",
    },
    language: { title: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ" },
  },
  sidebar: {
    title: "ਇੱਕ ਰਿਟੇਲ ERP 'ਤੇ ਆਪਣੀ ਦੁਕਾਨ ਚਲਾਉਣ ਲਈ ਸਾਈਨ ਅੱਪ ਕਰੋ",
    featuresTitle: "EasyVyapaar ਨਾਲ ਤੁਹਾਨੂੰ ਕੀ ਮਿਲਦਾ ਹੈ",
    feature1: "ਇਨਵੈਂਟਰੀ ਅਤੇ ਬਿਲਿੰਗ ਇੱਕ ਥਾਂ 'ਤੇ",
    feature2: "GST-ਤਿਆਰ ਇਨਵੌਇਸ ਅਤੇ ਰਿਪੋਰਟਾਂ",
    feature3: "ਮਲਟੀ-ਸਟੋਰ ਅਤੇ ਸਟਾਫ ਪ੍ਰਬੰਧਨ",
    feature4: "ਰੀਅਲ-ਟਾਈਮ ਸਟਾਕ ਅਤੇ ਵਿਕਰੀ ਵਿਸ਼ਲੇਸ਼ਣ",
    feature5: "ਕਿਰਾਨਾ ਅਤੇ ਰਿਟੇਲ ਵਪਾਰ ਲਈ",
    trusted: "ਭਾਰਤ ਭਰ ਦੇ ਰਿਟੇਲਰਾਂ ਦਾ ਭਰੋਸਾ",
  },
};

const ml: Record<string, unknown> = {
  common: { back: "പിന്നോട്ട്", continue: "തുടരുക", next: "അടുത്തത്", pleaseWait: "കാത്തിരിക്കൂ…" },
  login: {
    title: "നിങ്ങളുടെ സ്റ്റോറിൽ ലോഗിൻ ചെയ്യുക",
    subtitle: "OTP ലഭിക്കാൻ രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പർ നൽകുക.",
    getOtp: "OTP നേടുക",
    verifyLogin: "സ്ഥിരീകരിച്ച് ലോഗിൻ",
    createAccount: "പുതിയ അക്കൗണ്ട് സൃഷ്ടിക്കുക",
  },
  register: {
    createAccount: "അക്കൗണ്ട് സൃഷ്ടിക്കുക",
    alreadyHaveAccount: "ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?",
    loginLink: "ലോഗിൻ",
    steps: {
      language: "ഭാഷ തിരഞ്ഞെടുക്കുക",
      gst: "GST നമ്പർ",
      detailsOtp: "വിവരങ്ങളും OTP",
    },
    language: { title: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക" },
  },
  sidebar: {
    title: "ഒരു റീടെയിൽ ERP-ൽ നിങ്ങളുടെ കട നടത്താൻ സൈൻ അപ്പ് ചെയ്യുക",
    featuresTitle: "EasyVyapaar ഉപയോഗിച്ച് നിങ്ങൾക്ക് ലഭിക്കുന്നത്",
    feature1: "ഇൻവെന്ററിയും ബില്ലിംഗും ഒരിടത്ത്",
    feature2: "GST തയ്യാറായ ഇൻവോയ്സുകളും റിപ്പോർട്ടുകളും",
    feature3: "മൾട്ടി-സ്റ്റോർ, സ്റ്റാഫ് മാനേജ്മെന്റ്",
    feature4: "റിയൽ-ടൈം സ്റ്റോക്കും വിൽപ്പന വിശകലനവും",
    feature5: "കിരാന, റീടെയിൽ വ്യാപാരത്തിന്",
    trusted: "ഇന്ത്യയിലെ റീടെയ്ലർമാരുടെ വിശ്വാസം",
  },
};

const ur: Record<string, unknown> = {
  common: { back: "واپس", continue: "جاری رکھیں", next: "آگے", pleaseWait: "انتظار کریں…" },
  login: {
    title: "اپنے اسٹور میں لاگ ان کریں",
    subtitle: "OTP کے لیے رجسٹرڈ موبائل نمبر درج کریں۔",
    getOtp: "OTP حاصل کریں",
    verifyLogin: "تصدیق کریں اور لاگ ان",
    createAccount: "نیا اکاؤنٹ بنائیں",
  },
  register: {
    createAccount: "اکاؤنٹ بنائیں",
    alreadyHaveAccount: "پہلے سے اکاؤنٹ ہے؟",
    loginLink: "لاگ ان",
    steps: {
      language: "زبان منتخب کریں",
      gst: "GST نمبر",
      detailsOtp: "تفصیلات اور OTP",
    },
    language: {
      title: "اپنی زبان منتخب کریں",
      subtitle: "ڈیش بورڈ اور اطلاعات کے لیے استعمال ہوگی",
    },
  },
  sidebar: {
    title: "ایک ریٹیل ERP پر اپنی دکان چلانے کے لیے سائن اپ کریں",
    featuresTitle: "EasyVyapaar کے ساتھ آپ کو کیا ملتا ہے",
    feature1: "انوینٹری اور بلنگ ایک جگہ",
    feature2: "GST تیار انوائس اور رپورٹس",
    feature3: "ملٹی اسٹور اور اسٹاف مینجمنٹ",
    feature4: "ریئل ٹائم اسٹاک اور فروخت تجزیہ",
    feature5: "کریانہ اور خوردہ تجارت کے لیے",
    trusted: "پورے ہندوستان کے خوردہ فروشوں کا اعتماد",
  },
};

const bn: Record<string, unknown> = {
  common: { back: "পিছনে", continue: "চালিয়ে যান", next: "পরবর্তী", pleaseWait: "অপেক্ষা করুন…" },
  login: {
    title: "আপনার দোকানে লগইন করুন",
    subtitle: "OTP পেতে নিবন্ধিত মোবাইল নম্বর লিখুন।",
    getOtp: "OTP নিন",
    verifyLogin: "যাচাই করে লগইন",
    createAccount: "নতুন অ্যাকাউন্ট তৈরি করুন",
  },
  register: {
    createAccount: "অ্যাকাউন্ট তৈরি করুন",
    alreadyHaveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
    loginLink: "লগইন",
    steps: { language: "ভাষা বেছে নিন", gst: "GST নম্বর", detailsOtp: "বিবরণ ও OTP" },
    language: { title: "আপনার ভাষা বেছে নিন" },
  },
  sidebar: {
    title: "একটি রিটেইল ERP-এ আপনার দোকান চালাতে সাইন আপ করুন",
    featuresTitle: "EasyVyapaar-এর সাথে আপনি যা পাবেন",
    feature1: "ইনভেন্টরি ও বিলিং এক জায়গায়",
    feature2: "GST-প্রস্তুত ইনভয়েস ও রিপোর্ট",
    feature3: "মাল্টি-স্টোর ও স্টাফ ম্যানেজমেন্ট",
    feature4: "রিয়েল-টাইম স্টক ও বিক্রয় বিশ্লেষণ",
    feature5: "কিরানা ও খুচরা ব্যবসার জন্য",
    trusted: "সারা ভারতের খুচরা বিক্রেতাদের বিশ্বাস",
  },
};

const kn: Record<string, unknown> = {
  common: { back: "ಹಿಂದೆ", continue: "ಮುಂದುವರಿಸಿ", next: "ಮುಂದೆ", pleaseWait: "ನಿರೀಕ್ಷಿಸಿ…" },
  login: {
    title: "ನಿಮ್ಮ ಅಂಗಡಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ",
    subtitle: "OTP ಗಾಗಿ ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    getOtp: "OTP ಪಡೆಯಿರಿ",
    verifyLogin: "ಪರಿಶೀಲಿಸಿ ಲಾಗಿನ್",
    createAccount: "ಹೊಸ ಖಾತೆ ರಚಿಸಿ",
  },
  register: {
    createAccount: "ಖಾತೆ ರಚಿಸಿ",
    alreadyHaveAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",
    loginLink: "ಲಾಗಿನ್",
    steps: { language: "ಭಾಷೆ ಆಯ್ಕೆ", gst: "GST ಸಂಖ್ಯೆ", detailsOtp: "ವಿವರಗಳು & OTP" },
    language: { title: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ" },
  },
  sidebar: {
    title: "ಒಂದು ರಿಟೈಲ್ ERP ನಲ್ಲಿ ನಿಮ್ಮ ಅಂಗಡಿ ನಡೆಸಲು ಸೈನ್ ಅಪ್ ಮಾಡಿ",
    featuresTitle: "EasyVyapaar ಜೊತೆಗೆ ನೀವು ಪಡೆಯುವುದು",
    feature1: "ಇನ್ವೆಂಟರಿ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ",
    feature2: "GST ಸಿದ್ಧ ಇನ್ವಾಯ್ಸ್ ಮತ್ತು ವರದಿಗಳು",
    feature3: "ಮಲ್ಟಿ-ಸ್ಟೋರ್ ಮತ್ತು ಸಿಬ್ಬಂದಿ ನಿರ್ವಹಣೆ",
    feature4: "ರಿಯಲ್-ಟೈಮ್ ಸ್ಟಾಕ್ ಮತ್ತು ಮಾರಾಟ ವಿಶ್ಲೇಷಣೆ",
    feature5: "ಕಿರಾನೆ ಮತ್ತು ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಕ್ಕೆ",
    trusted: "ಭಾರತದಾದ್ಯಂತ ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿಗಳ ನಂಬಿಕೆ",
  },
};

const localePatches: Partial<Record<LocaleCode, Record<string, unknown>>> = {
  hi,
  gu,
  mr,
  ta,
  te,
  pa,
  ml,
  ur,
  bn,
  kn,
};

export function buildMessages(locale: LocaleCode): MessageTree {
  const patch = localePatches[locale];
  const dashPatch = dashboardLocalePatches[locale];
  if (!patch && !dashPatch) return enMessages;
  let merged = enMessages as unknown as Record<string, unknown>;
  if (patch) {
    merged = deepMerge(merged, patch as unknown as Record<string, unknown>);
  }
  if (dashPatch) {
    merged = deepMerge(merged, dashPatch as unknown as Record<string, unknown>);
  }
  return merged as unknown as MessageTree;
}

export const allMessages: Record<LocaleCode, MessageTree> = {
  en: enMessages,
  hi: buildMessages("hi"),
  gu: buildMessages("gu"),
  mr: buildMessages("mr"),
  ta: buildMessages("ta"),
  te: buildMessages("te"),
  pa: buildMessages("pa"),
  ml: buildMessages("ml"),
  ur: buildMessages("ur"),
  bn: buildMessages("bn"),
  kn: buildMessages("kn"),
};
