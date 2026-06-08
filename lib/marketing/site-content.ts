export const CONTACT_EMAIL = "hello@mahajaan.com";

export const HERO = {
  eyebrow: "AI assistant · WhatsApp-ready · Built for Indian shops",
  title: "Manage your entire shop by chat",
  subtitle:
    "Ask in Hindi or English — get sales, stock, GST bills, party dues, and daily summaries instantly. Mahajaan AI understands how you actually run your counter.",
  bullets: [
    "“Aaj kitna sale hua?” — instant answers",
    "Bill, stock & khata via chat",
    "Smart search — dhaniya, coriander, same thing",
    "Full ERP when you need the big screen",
  ],
};

export const SHOP_TYPES = [
  {
    id: "kirana",
    label: "Kirana & FMCG",
    description: "High SKU count, daily repeat customers, credit khata",
    icon: "store",
    href: "/use-cases#kirana",
  },
  {
    id: "electronics",
    label: "Electronics",
    description: "Serial/IMEI tracking, GST invoices, warranties",
    icon: "mobile",
    href: "/use-cases#electronics",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    description: "Batch discipline, HSN billing, supplier purchases",
    icon: "health",
    href: "/use-cases#pharmacy",
  },
  {
    id: "textile",
    label: "Textile",
    description: "Variants, metres & pieces, seasonal stock",
    icon: "fabric",
    href: "/use-cases#textile",
  },
  {
    id: "hardware",
    label: "Hardware",
    description: "Mixed units, bulk orders, contractor credit",
    icon: "tools",
    href: "/use-cases#hardware",
  },
  {
    id: "wholesale",
    label: "Wholesale",
    description: "Bulk pricing, outstanding, purchase orders",
    icon: "truck",
    href: "/use-cases#wholesale",
  },
] as const;

export const FEATURE_PILLARS = [
  { value: "6 modules", label: "Connected workflows", hint: "Bill → stock → ledger → reports" },
  { value: "GST native", label: "Tax on every sale", hint: "CGST · SGST · IGST auto-split" },
  { value: "Counter ready", label: "POS + keyboard", hint: "Built for rush-hour billing" },
];

export const FEATURE_HIGHLIGHTS = [
  {
    id: "pos",
    title: "POS billing",
    tag: "Counter",
    accent: "orange",
    description:
      "Touch-friendly counter billing with fast item search, barcode support, and instant GST breakup. Built for rush hours when every second counts.",
    icon: "receipt",
    bullets: [
      "Keyboard shortcuts for repeat items",
      "Hold bills and resume later",
      "Print or share invoice on WhatsApp",
    ],
    stat: "Avg. checkout under 15 seconds",
  },
  {
    id: "gst",
    title: "GST invoices",
    tag: "Compliance",
    accent: "blue",
    description:
      "CGST, SGST, and IGST calculated automatically from party state and item HSN. Multiple invoice themes for A4 and thermal printers.",
    icon: "file",
    bullets: [
      "HSN-wise tax breakup on every bill",
      "Quotations convert to invoices",
      "Credit notes for sales returns",
    ],
    stat: "Supports registered & composition workflows",
  },
  {
    id: "inventory",
    title: "Inventory control",
    tag: "Stock",
    accent: "emerald",
    description:
      "Opening stock, purchases, adjustments, and low-stock warnings in one place. Serial and IMEI tracking for electronics and mobile shops.",
    icon: "box",
    bullets: [
      "Multi-unit and category-wise stock",
      "Purchase bills update stock automatically",
      "Low-stock alerts before shelves run empty",
    ],
    stat: "Real-time qty after every sale",
  },
  {
    id: "parties",
    title: "Parties & ledger",
    tag: "Credit",
    accent: "violet",
    description:
      "Customers and suppliers in one ledger. Track to-collect and to-pay balances with running statements — no separate khata notebook.",
    icon: "users",
    bullets: [
      "Party-wise special pricing",
      "Credit limits and outstanding view",
      "Payment receipts against invoices",
    ],
    stat: "To collect / to pay on dashboard",
  },
  {
    id: "reports",
    title: "Business reports",
    tag: "Insights",
    accent: "rose",
    description:
      "Profit & loss, balance sheet, sales summaries, and GST-ready exports. See whether the shop actually made money this month.",
    icon: "chart",
    bullets: [
      "Month-on-month P&L comparison",
      "Balance sheet with balance check",
      "Export for your CA review",
    ],
    stat: "Staff cost included in P&L",
  },
  {
    id: "staff",
    title: "Staff & payroll",
    tag: "People",
    accent: "amber",
    description:
      "Attendance, salary revisions, and payroll with pro-rata rules. Keep people costs tied to the same system as sales and inventory.",
    icon: "badge",
    bullets: [
      "Daily attendance marking",
      "Salary history with effective dates",
      "Payroll preview before payout",
    ],
    stat: "Paid leave & absent-day handling",
  },
];

export const FINAL_CTA_POINTS = [
  "GST-ready invoices from day one",
  "Import inventory & parties with help",
  "POS works on counter PC or tablet",
  "Free onboarding during early access",
];

export const FEATURES_PAGE_HERO = {
  title: "ERP modules + AI for you and your customers",
  subtitle:
    "GST billing, inventory, POS, reports, and payroll in one dashboard — plus Mahajaan AI so you run the shop by chat and your customers order, pay, and get bills on WhatsApp.",
  stats: [
    { value: "30+", label: "ERP features" },
    { value: "2", label: "AI sides" },
    { value: "1", label: "WhatsApp lane" },
  ],
};

export const FEATURE_WORKFLOW = [
  {
    step: "01",
    title: "Bill at the counter",
    description: "Create a GST invoice or POS bill. Stock reduces automatically. Party balance updates if sold on credit.",
  },
  {
    step: "02",
    title: "Record purchases",
    description: "Enter supplier bills and purchase returns. Inventory increases or reverses without manual recalculation.",
  },
  {
    step: "03",
    title: "Track outstanding",
    description: "See who owes you and whom you owe. Send statements and record receipts against parties.",
  },
  {
    step: "04",
    title: "Close the month",
    description: "Run P&L, balance sheet, and payroll. Know revenue, purchases, staff cost, and net position.",
  },
];

export const BEFORE_AFTER = {
  before: [
    "Billing in one app, stock in Excel",
    "GST calculated manually on busy days",
    "Party dues tracked in notebooks",
    "CA chases missing purchase records",
    "Staff salary on separate spreadsheet",
  ],
  after: [
    "One sale updates stock and ledger",
    "CGST/SGST/IGST on every invoice",
    "To-collect & to-pay on dashboard",
    "Purchase-to-sale trail in one system",
    "Payroll tied to attendance & sales",
  ],
};

export const SETUP_BAND = {
  title: "Free onboarding for early shops",
  items: [
    "Invoice layout setup",
    "Inventory & parties upload help",
    "Walkthrough of POS and reports",
    "Staff and permissions guidance",
  ],
  cta: "Book a free demo",
};

export const HOME_STATS = [
  {
    value: "15",
    unit: "sec",
    label: "Target invoice time",
    hint: "From search to printed GST bill",
    icon: "clock",
    accent: "orange",
  },
  {
    value: "6",
    unit: "+",
    label: "Modules connected",
    hint: "Bill, stock, parties, purchases, reports, staff",
    icon: "layers",
    accent: "sky",
  },
  {
    value: "100",
    unit: "%",
    label: "Indian retail focus",
    hint: "GST, credit sales, counter workflows",
    icon: "flag",
    accent: "emerald",
  },
  {
    value: "0",
    unit: "₹",
    label: "To start early access",
    hint: "No credit card during onboarding",
    icon: "wallet",
    accent: "violet",
  },
];

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    period: "during early access",
    description: "For single-shop owners getting started on Mahajaan.",
    features: [
      "GST billing & quotations",
      "Inventory & parties",
      "Basic reports",
      "1 business, up to 2 users",
      "Email support",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "₹999",
    period: "/ month",
    description: "For growing shops that need more users and deeper controls.",
    features: [
      "Everything in Starter",
      "POS billing",
      "Staff, attendance & payroll",
      "Advanced reports (P&L, balance sheet)",
      "Up to 5 users",
      "Priority support",
    ],
    cta: "Join waitlist",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: "Custom",
    period: "pricing",
    description: "For multi-counter stores, branches, or higher volume operations.",
    features: [
      "Everything in Growth",
      "Multiple godowns",
      "Custom invoice numbering",
      "Dedicated onboarding",
      "Unlimited users",
      "Phone & WhatsApp support",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];

export const USE_CASES_PAGE = {
  eyebrow: "Use cases",
  title: "Every counter has a different rhythm",
  subtitle:
    "Mahajaan adapts to how your shop actually runs — kirana repeat customers, IMEI tracking, pharmacy batches, or wholesale credit. Pick your sector and see the workflow.",
};

export const USE_CASES = [
  {
    id: "kirana",
    category: "Sector",
    title: "Kirana & FMCG",
    tagline: "High SKU count, zero counter chaos",
    description:
      "Hundreds of items, daily repeat buyers, and udhar khata — bill fast, know what's running low, and reorder before the shelf is empty.",
    points: ["Bulk item & barcode entry", "Low-stock & reorder alerts", "Credit khata per party", "AI stock check in Hindi"],
    scenario: "Morning: ask “dhaniya kitna bacha?” on WhatsApp. Afternoon: 40 FMCG bills on POS. Evening: low-stock list for tomorrow's purchase.",
    metric: { label: "Typical SKUs", value: "300–800" },
    accent: "orange",
    icon: "store",
  },
  {
    id: "electronics",
    category: "Sector",
    title: "Electronics & mobile",
    tagline: "Serial numbers, warranties, GST done right",
    description:
      "Track IMEI and serials on every sale, attach warranties, and issue GST invoices your customers and CA both trust.",
    points: ["Serial / IMEI on invoice", "Accessory bundling at POS", "Supplier purchase bills", "WhatsApp PDF bill to buyer"],
    scenario: "Customer buys Samsung A15 — IMEI captured, GST invoice generated, PDF sent on WhatsApp before they leave the counter.",
    metric: { label: "Avg. ticket", value: "₹5K–₹25K" },
    accent: "sky",
    icon: "mobile",
  },
  {
    id: "pharmacy",
    category: "Sector",
    title: "Pharmacy & medical",
    tagline: "Batch discipline without the spreadsheet",
    description:
      "HSN-ready billing, batch-wise stock, and purchase-to-sale traceability — organised for inspections and daily dispensing.",
    points: ["Batch & expiry tracking", "HSN GST invoices", "Supplier purchase register", "Stock adjustment audit trail"],
    scenario: "Dispense 3 batches of the same salt brand — system picks FIFO, updates stock, and keeps the register clean.",
    metric: { label: "Compliance", value: "GST + batch" },
    accent: "emerald",
    icon: "health",
  },
  {
    id: "wholesale",
    category: "Industry",
    title: "Wholesale & distribution",
    tagline: "Bulk orders, credit limits, collections",
    description:
      "Quotations, bulk pricing, party credit limits, and outstanding follow-ups — built for B2B rhythm, not retail-only billing.",
    points: ["Credit limit per dealer", "Quotation → order → bill", "Outstanding & ageing reports", "Payment reminder on WhatsApp"],
    scenario: "Dealer places repeat order on WhatsApp — you confirm stock, raise bill, and auto-send payment reminder if overdue.",
    metric: { label: "Parties", value: "50–500+" },
    accent: "violet",
    icon: "truck",
  },
  {
    id: "hardware",
    category: "Sector",
    title: "Hardware & building material",
    tagline: "Mixed units, contractor credit",
    description:
      "Sell by piece, box, or foot — manage contractor accounts, purchase orders, and category-wise stock in one place.",
    points: ["Multi-unit conversions", "Purchase orders to suppliers", "Contractor party ledger", "Category stock summary"],
    scenario: "Contractor buys 50 clamps + 20m pipe on credit — units convert correctly, khata updates, reminder goes on due date.",
    metric: { label: "Units", value: "pcs · ft · box" },
    accent: "amber",
    icon: "tools",
  },
  {
    id: "textile",
    category: "Sector",
    title: "Textile & garment",
    tagline: "Variants, metres, seasonal stock",
    description:
      "Colour and size variants, metre vs piece billing, and seasonal inventory — without losing track between counters.",
    points: ["Variant-wise stock", "Metre & piece billing", "Seasonal dead-stock view", "Party-wise rate lists"],
    scenario: "Customer asks for “blue XL” — you check variant stock, bill by piece, and share invoice on WhatsApp instantly.",
    metric: { label: "Variants", value: "Colour × size" },
    accent: "rose",
    icon: "fabric",
  },
  {
    id: "retail",
    category: "General",
    title: "General retail",
    tagline: "One system from first bill to month-end",
    description:
      "Any shop that bills customers and tracks stock — daily sales, party balances, purchases, and reports in one dashboard.",
    points: ["POS + GST invoices", "Party to-collect / to-pay", "Purchase & expense tracking", "P&L when your CA asks"],
    scenario: "Single counter shop: bill all day on POS, check today's sale by chat at closing, export GST summary for filing.",
    metric: { label: "Setup time", value: "Same day" },
    accent: "blue",
    icon: "store",
  },
] as const;

export const AI_FEATURES_SECTION = {
  eyebrow: "Mahajaan AI",
  title: "Two sides of the same shop — you and your customers",
  subtitle:
    "You run the business by chat or dashboard in Hindi and English. Your customers stay on WhatsApp — order, pay, ask, review, and get bills without installing an app.",
};

export const AI_FEATURES_RETAILER = [
  {
    title: "Ask in Hindi or English",
    description: "“Aaj kitna sale hua?”, “Amit ka kitna baaki?”, “Low stock dikhao” — instant answers from live shop data.",
    example: "Aaj ka sale ₹12,840 · 47 bills",
  },
  {
    title: "Bill & stock via chat",
    description: "Create GST invoices, check coriander vs dhaniya stock, and approve purchase lists without opening every screen.",
    example: "INV-2026-0142 ready — WhatsApp PDF?",
  },
  {
    title: "Party ledger & reminders",
    description: "See outstanding, overdue bills, and send payment reminders — you approve, AI drafts the message.",
    example: "Amit Kirana · ₹3,450 · 15 days overdue",
  },
  {
    title: "Daily summaries & alerts",
    description: "Morning snapshot, low-stock nudges, and cash vs credit split — before the counter gets busy.",
    example: "5 SKUs in reorder zone today",
  },
  {
    title: "Smart catalog search",
    description: "Synonyms and local names map to the same SKU — dhaniya, coriander, hara dhaniya — no manual tagging every time.",
    example: "Dhaniya = Coriander (2.4 kg left)",
  },
  {
    title: "Full ERP when you need it",
    description: "POS, payroll, P&L, balance sheet — AI handles quick questions; the dashboard handles depth.",
    example: "Switch to POS for rush hour",
  },
];

export const AI_FEATURES_CUSTOMER = [
  {
    title: "Place orders",
    description: "Priya messages Tata atta + Surf Excel — shop confirms items, qty, and delivery slot in chat.",
  },
  {
    title: "Pay on WhatsApp",
    description: "UPI request for ₹401 on sharma.kirana@okicici — order dispatches when payment hits.",
  },
  {
    title: "Ask & resend",
    description: "“Bill dubara bhejo” for CA — AI resends INV-2026-0188 PDF from your records instantly.",
  },
  {
    title: "GST bill PDF",
    description: "INV-2026-0188 auto-attached after payment — no chasing screenshots at the counter.",
  },
  {
    title: "Auto reminders",
    description: "Amit Verma gets ₹850 udhar nudge on due date — you don’t manually type every follow-up.",
  },
  {
    title: "Reviews",
    description: "Post-delivery 1–5 star ask — Priya rates 5★, shop sends thank-you + loyalty coupon.",
  },
];

export const FAQ_ITEMS = [
  {
    question: "Is Mahajaan only for kirana stores?",
    answer:
      "No. Mahajaan is built for Indian retail broadly — kirana, electronics, pharmacy, textile, hardware, wholesale, and more. If you bill customers and manage stock, it fits.",
  },
  {
    question: "Do I need a GST number to use Mahajaan?",
    answer:
      "You can start without GST and add your GSTIN when you're ready. The app supports both GST and non-GST billing workflows.",
  },
  {
    question: "Can I use Mahajaan on my shop counter?",
    answer:
      "Yes. POS billing is designed for desktop and tablet use at the counter, with keyboard and touch-friendly flows.",
  },
  {
    question: "Will my data be safe?",
    answer:
      "Your business data is stored securely on cloud infrastructure with access controls per user role. Read our Privacy Policy for full details.",
  },
  {
    question: "Can my CA use the reports?",
    answer:
      "Yes. Profit & loss, balance sheet, and transaction exports are structured for review by your accountant or CA.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "Email hello@mahajaan.com from your registered address with a deletion request, or follow the steps on our Data Deletion Instructions page.",
  },
];

export const BLOG_POSTS = [
  {
    slug: "gst-billing-guide-for-retail-shops",
    title: "GST billing guide for retail shops in India",
    excerpt:
      "A practical walkthrough of CGST, SGST, IGST, HSN codes, and what small shop owners should get right on every invoice.",
    date: "2026-05-28",
    readMinutes: 6,
    category: "GST",
  },
  {
    slug: "inventory-management-for-kirana-stores",
    title: "Inventory management tips for kirana stores",
    excerpt:
      "How to reduce dead stock, set low-stock alerts, and keep your shelves aligned with what customers actually buy.",
    date: "2026-05-15",
    readMinutes: 5,
    category: "Inventory",
  },
  {
    slug: "pos-billing-for-busy-counters",
    title: "Why POS billing matters on a busy counter",
    excerpt:
      "Speed, fewer billing mistakes, and happier customers — what to look for when moving from manual billing to POS.",
    date: "2026-04-30",
    readMinutes: 4,
    category: "POS",
  },
  {
    slug: "staff-payroll-for-retail-shops",
    title: "Managing staff payroll in a small retail shop",
    excerpt:
      "Attendance, salary changes, and monthly payouts without spreadsheet headaches.",
    date: "2026-04-12",
    readMinutes: 5,
    category: "Operations",
  },
];

export const BLOG_ARTICLE_BODY: Record<string, string[]> = {
  "gst-billing-guide-for-retail-shops": [
    "If you run a retail shop in India, GST compliance is not optional once you cross the registration threshold. The good news: most daily billing mistakes come from a few repeatable gaps — wrong tax type, missing HSN, or inconsistent party details.",
    "For local sales within your state, CGST and SGST apply. For interstate sales, IGST applies. Your billing software should pick this up from party and business state automatically so you don't calculate manually on every bill.",
    "HSN codes matter for product classification and returns. Even if your shop sells hundreds of SKUs, start with correct HSN on your top-selling items and expand over time.",
    "Mahajaan calculates tax lines on each invoice and keeps your sales records structured for GST reporting workflows. Always verify outputs with your CA before filing.",
  ],
  "inventory-management-for-kirana-stores": [
    "Kirana stores carry fast-moving and slow-moving items side by side. Without stock discipline, cash gets stuck in dead inventory while bestsellers run out.",
    "Start with accurate opening stock, then record purchases and sales consistently. Low-stock alerts help you reorder before customers ask for items you don't have.",
    "Review slow movers monthly. A simple sales-vs-stock report often shows which items to promote, bundle, or stop reordering.",
  ],
  "pos-billing-for-busy-counters": [
    "Peak-hour billing is where shops lose money — wrong rates, missed items, and long queues. A POS built for counters reduces keystrokes and keeps GST breakup automatic.",
    "Look for fast search, barcode support, clear totals, and easy reprints. Training staff takes less time when the screen matches how they already work.",
  ],
  "staff-payroll-for-retail-shops": [
    "Shop staff costs are often tracked separately from sales, which makes profit numbers misleading. Bringing attendance and payroll into the same system as billing gives a clearer picture.",
    "Record joining dates, salary revisions, and monthly payouts with audit history. Pro-rata calculations matter when staff join mid-month or take unpaid leave.",
  ],
};

export const ALL_FEATURES = [
  {
    id: "billing-sales",
    category: "Billing & sales",
    summary: "Create GST invoices, quotations, and returns without breaking stock or party balances.",
    icon: "file",
    items: [
      {
        title: "GST sales invoices",
        description: "Create tax invoices with automatic CGST/SGST/IGST split, discounts, and round-off.",
        bullets: ["Party state drives IGST vs CGST/SGST", "Line-item discounts & round-off", "Due date & payment terms"],
      },
      {
        title: "Quotations",
        description: "Send quotes and convert them to invoices when the customer confirms.",
        bullets: ["Valid-until dates", "One-click convert to invoice", "Share PDF with customer"],
      },
      {
        title: "Sales returns & credit notes",
        description: "Handle returns without breaking stock or party balances.",
        bullets: ["Stock restored on return", "Credit note linked to original sale", "Party balance auto-adjusted"],
      },
      {
        title: "Invoice themes",
        description: "Professional PDF layouts for thermal and A4 printing.",
        bullets: ["Modern, billbook & GST layouts", "Logo, signature & bank details", "Live preview before print"],
      },
    ],
  },
  {
    id: "purchases",
    category: "Purchases",
    summary: "Record what comes into your shop and keep purchase history aligned with stock on hand.",
    icon: "truck",
    items: [
      {
        title: "Purchase bills",
        description: "Record supplier purchases and update stock in one step.",
        bullets: ["Supplier-wise purchase history", "Tax on purchase entries", "Stock increases on save"],
      },
      {
        title: "Purchase orders",
        description: "Track orders before goods arrive at your shop.",
        bullets: ["Expected delivery tracking", "Convert PO to purchase bill", "Supplier communication ready"],
      },
      {
        title: "Purchase returns",
        description: "Return goods to suppliers with proper stock reversal.",
        bullets: ["Debit note workflow", "Stock qty reduced correctly", "Supplier balance updated"],
      },
    ],
  },
  {
    id: "inventory",
    category: "Inventory",
    summary: "Know what you have, what is running low, and what moved today — down to serial number if needed.",
    icon: "box",
    items: [
      {
        title: "Item master",
        description: "SKU, HSN, units, pricing, categories, and opening stock.",
        bullets: ["Category-wise organisation", "Sales & purchase price", "Custom fields for your shop"],
      },
      {
        title: "Stock adjustments",
        description: "Correct damage, shrinkage, or count differences.",
        bullets: ["Increase or decrease qty", "Reason notes for audit", "Instant stock recalculation"],
      },
      {
        title: "Serial tracking",
        description: "IMEI and serial numbers for electronics and mobile inventory.",
        bullets: ["Serial status in stock / sold", "Attach serial to invoice line", "Reduce wrong-unit dispatch"],
      },
      {
        title: "Low-stock alerts",
        description: "Know what to reorder before shelves go empty.",
        bullets: ["Per-item threshold", "Low-stock report page", "Reorder before customer asks"],
      },
    ],
  },
  {
    id: "parties-finance",
    category: "Parties & finance",
    summary: "Customers, suppliers, payments, and month-end financial position in one connected ledger.",
    icon: "wallet",
    items: [
      {
        title: "Customer & supplier ledger",
        description: "Running balances, statements, and outstanding tracking.",
        bullets: ["To-collect & to-pay summary", "Full party statement", "GSTIN & contact on record"],
      },
      {
        title: "Payments & receipts",
        description: "Record money in and out against parties.",
        bullets: ["Cash, UPI, bank modes", "Allocate against invoices", "Running balance after each entry"],
      },
      {
        title: "Profit & loss report",
        description: "Monthly view of revenue, purchases, and operating costs.",
        bullets: ["MoM & YoY comparison", "Staff cost in expenses", "CSV export"],
      },
      {
        title: "Balance sheet",
        description: "Assets, liabilities, and equity snapshot for your shop.",
        bullets: ["Monthly as-of view", "Balance check indicator", "Export for CA review"],
      },
    ],
  },
  {
    id: "operations",
    category: "Operations",
    summary: "Counter billing, team management, and multi-shop control for day-to-day shop operations.",
    icon: "receipt",
    items: [
      {
        title: "POS billing",
        description: "Counter-ready checkout with fast search and keyboard shortcuts.",
        bullets: ["Fast item search & barcode", "Hold & resume bills", "Instant GST totals"],
      },
      {
        title: "Staff management",
        description: "Profiles, roles, and salary history in one place.",
        bullets: ["Joining date & salary revisions", "Role-based access", "Staff profile records"],
      },
      {
        title: "Attendance & payroll",
        description: "Mark attendance, run payroll with pro-rata and paid leave rules.",
        bullets: ["Present, absent, leave, half-day", "Salary segments on revision", "Payroll preview before generate"],
      },
      {
        title: "Multi-business switcher",
        description: "Manage more than one shop from a single login.",
        bullets: ["Separate books per business", "Quick org switcher", "One owner account"],
      },
    ],
  },
];
