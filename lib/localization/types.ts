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
    breadcrumbHome: string;
    searchPlaceholder: string;
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
