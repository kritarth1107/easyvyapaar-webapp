import type { OrganisationType } from "@/lib/constants/organisation-types";

export const PREFERRED_LANGUAGE_CODES = [
  "en",
  "hi",
  "mr",
  "ta",
  "te",
  "bn",
  "gu",
  "kn",
  "ml",
  "pa",
  "ur",
] as const;

export type PreferredLanguageCode = (typeof PREFERRED_LANGUAGE_CODES)[number];

/** UI locale; stored in localStorage and sent to the API as preferredLanguage. */
export type LocaleCode = PreferredLanguageCode;

export const DEFAULT_LOCALE: LocaleCode = "en";

export type MessageTree = {
  common: {
    brandName: string;
    retailErp: string;
    networkError: string;
    pleaseWait: string;
    back: string;
    close: string;
    continue: string;
    next: string;
    or: string;
    optional: string;
    fromGst: string;
  };
  orgSelect: {
    loginTitle: string;
    loginSubtitle: string;
    loginHint: string;
    switchTitle: string;
    switchSubtitle: string;
    primaryBadge: string;
    currentBadge: string;
    createBusinessTitle: string;
    createBusinessSubtitle: string;
    createBusinessCta: string;
  };
  login: {
    signIn: string;
    title: string;
    subtitle: string;
    mobileLabel: string;
    editMobile: string;
    enterOtp: string;
    getOtp: string;
    verifyLogin: string;
    trouble: string;
    getHelp: string;
    createAccount: string;
    invalidMobile: string;
    enterOtpError: string;
    loginFailed: string;
    heroLine1: string;
    heroLine2: string;
    heroSubtitle: string;
    badge: string;
    platformModules: string;
    platformSubtitle: string;
    allOperational: string;
    exploreModule: string;
    featureInventoryTitle: string;
    featureInventoryDesc: string;
    featureBillingTitle: string;
    featureBillingDesc: string;
    featureAnalyticsTitle: string;
    featureAnalyticsDesc: string;
    featureMultiStoreTitle: string;
    featureMultiStoreDesc: string;
    statSkus: string;
    statGst: string;
    statCharts: string;
    statOutlets: string;
    overview: string;
    sales: string;
    orders: string;
    alerts: string;
  };
  register: {
    createAccount: string;
    alreadyHaveAccount: string;
    loginLink: string;
    steps: {
      language: string;
      gst: string;
      detailsOtp: string;
    };
    language: {
      title: string;
      subtitle: string;
      chooseError: string;
    };
    gst: {
      label: string;
      hint: string;
      verifyContinue: string;
      verifying: string;
      skip: string;
      invalidGstin: string;
      verifyFailed: string;
    };
    details: {
      gstVerified: string;
      noGst: string;
      contactName: string;
      contactPlaceholder: string;
      tradeName: string;
      tradePlaceholder: string;
      selectType: string;
      chooseOrgType: string;
      mobileLabel: string;
      contactNameError: string;
      tradeNameError: string;
      orgTypeError: string;
      mobileError: string;
      mobileAlreadyRegistered: string;
      registerFailed: string;
      unexpectedResponse: string;
      skipGstInfo: string;
    };
    otp: {
      sentTo: string;
      enterOtp: string;
      verifying: string;
      verifyComplete: string;
      enterOtpError: string;
      verifyFailed: string;
    };
    orgTypes: Record<OrganisationType, string>;
  };
  sidebar: {
    title: string;
    featuresTitle: string;
    feature1: string;
    feature2: string;
    feature3: string;
    feature4: string;
    feature5: string;
    trusted: string;
  };
  dashboard: {
    greeting: string;
    greetingHint: string;
    openPos: string;
    newInvoice: string;
    salesToday: string;
    vsYesterday: string;
    invoices: string;
    toCollect: string;
    toCollectHint: string;
    toPay: string;
    toPayHint: string;
    lowStock: string;
    lowStockHint: string;
    weeklySales: string;
    viewReports: string;
    pendingActions: string;
    quickActions: string;
    actionPos: string;
    actionParty: string;
    actionItem: string;
    actionPayment: string;
    actionPurchase: string;
    actionExpense: string;
    recentActivity: string;
    pendingOrders: string;
    switchingShop: string;
    switchingShopHint: string;
    loadingWorkspace: string;
    loadingWorkspaceHint: string;
    breadcrumbHome: string;
    searchPlaceholder: string;
    accountMenu: string;
    accountSettings: string;
    accountBusinessSettings: string;
    accountLanguage: string;
    accountLogout: string;
    languageModalApply: string;
    switchingLanguage: string;
    switchingLanguageHint: string;
    comingSoon: string;
    comingSoonHint: string;
    backToDashboard: string;
    modulesLabel: string;
    sidebarTagline: string;
    posLive: string;
    notifications: string;
    notificationFeed: {
      markAllRead: string;
      viewAll: string;
      empty: string;
      lowStockTitle: string;
      lowStockMessage: string;
      lowStockTime: string;
      overdueTitle: string;
      overdueMessage: string;
      overdueTime: string;
      gstTitle: string;
      gstMessage: string;
      gstTime: string;
      paymentTitle: string;
      paymentMessage: string;
      paymentTime: string;
    };
    openMenu: string;
    closeMenu: string;
    collapseSidebar: string;
    expandSidebar: string;
    switchBusiness: string;
    businessRole: string;
    noGst: string;
    aiNavBadge: string;
    nav: {
      home: string;
      aiChat: string;
      aiChatHint: string;
      whatsappIntegration: string;
      pos: string;
      invoices: string;
      quotations: string;
      deliveryChallan: string;
      creditNotes: string;
      salesReturns: string;
      allParties: string;
      customers: string;
      suppliers: string;
      outstanding: string;
      items: string;
      stock: string;
      serialTracking: string;
      godowns: string;
      lowStockNav: string;
      purchases: string;
      purchaseOrders: string;
      purchaseReturns: string;
      payments: string;
      cashBank: string;
      expenses: string;
      daybook: string;
      gstReports: string;
      financialReports: string;
      inventoryReports: string;
      partyReports: string;
      staff: string;
      businessProfile: string;
      invoiceThemes: string;
      printSettings: string;
      appSettings: string;
      group: {
        sales: string;
        parties: string;
        inventory: string;
        purchase: string;
        finance: string;
        reports: string;
        settings: string;
      };
    };
    weekdays: {
      mon: string;
      tue: string;
      wed: string;
      thu: string;
      fri: string;
      sat: string;
      sun: string;
    };
    alerts: {
      lowStock: string;
      overdueInvoices: string;
      gstr1Due: string;
    };
    activity: {
      invoice: string;
      paymentReceived: string;
      stockAdjusted: string;
      purchaseBill: string;
      time12min: string;
      time1hr: string;
      time2hr: string;
      timeToday940: string;
    };
  };
};

type NestedKeyOf<T, Prefix extends string = ""> = T extends string
  ? Prefix extends ""
    ? never
    : Prefix
  : T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: NestedKeyOf<
          T[K],
          Prefix extends "" ? K : `${Prefix}.${K}`
        >;
      }[keyof T & string]
    : never;

export type TranslationKey = NestedKeyOf<MessageTree>;
