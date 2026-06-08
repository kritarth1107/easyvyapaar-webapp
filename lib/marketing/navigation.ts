export type NavLink = {
  label: string;
  href: string;
};

export type NavDropdownGroup = {
  title: string;
  items: NavLink[];
};

export const PRIMARY_NAV: Array<NavLink | { label: string; groups: NavDropdownGroup[] }> = [
  { label: "Features", href: "/features" },
  {
    label: "Use cases",
    groups: [
      {
        title: "Industry type",
        items: [
          { label: "Retail shops", href: "/use-cases#retail" },
          { label: "Distribution", href: "/use-cases#distribution" },
          { label: "Wholesale", href: "/use-cases#wholesale" },
          { label: "Manufacturing", href: "/use-cases#manufacturing" },
          { label: "Service businesses", href: "/use-cases#services" },
        ],
      },
      {
        title: "Sectors",
        items: [
          { label: "Kirana & FMCG", href: "/use-cases#kirana" },
          { label: "Electronics & mobile", href: "/use-cases#electronics" },
          { label: "Pharmacy", href: "/use-cases#pharmacy" },
          { label: "Textile & apparel", href: "/use-cases#textile" },
          { label: "Restaurants", href: "/use-cases#restaurants" },
          { label: "Hardware", href: "/use-cases#hardware" },
        ],
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Use cases", href: "/use-cases" },
      { label: "Pricing", href: "/pricing" },
      { label: "POS billing", href: "/features#pos" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "GST billing guide", href: "/blog/gst-billing-guide-for-retail-shops" },
      { label: "Inventory tips", href: "/blog/inventory-management-for-kirana-stores" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Privacy policy", href: "/legal/privacy-policy" },
      { label: "Terms of service", href: "/legal/terms-of-service" },
      { label: "Data deletion", href: "/legal/data-deletion-instructions" },
    ],
  },
] as const;
