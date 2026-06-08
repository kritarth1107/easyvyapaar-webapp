import { LEGAL_EFFECTIVE_DATE, LEGAL_LAST_UPDATED } from "../company";
import type { LegalDocument } from "../types";

export const termsOfService: LegalDocument = {
  slug: "terms-of-service",
  title: "Terms of Service",
  description:
    "Terms and conditions governing access to and use of Mahajaan, operated by ZEROKNOW TECHNOLOGIES PRIVATE LIMITED.",
  lastUpdated: LEGAL_LAST_UPDATED,
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      id: "agreement",
      title: "1. Agreement to terms",
      paragraphs: [
        'These Terms of Service ("Terms") constitute a legally binding agreement between you and ZEROKNOW TECHNOLOGIES PRIVATE LIMITED (CIN: U62090CT2026PTC020346) ("Company", "we", "us", or "our") governing your access to and use of Mahajaan, including the websites mahajaan.com and mahajaan.in, related applications, APIs, integrations, and services (collectively, the "Service").',
        'By creating an account, accessing, or using the Service, you agree to these Terms and our Privacy Policy. If you are accepting on behalf of a business, you represent that you have authority to bind that business. If you do not agree, do not use the Service.',
      ],
    },
    {
      id: "eligibility",
      title: "2. Eligibility",
      paragraphs: [
        "You must be at least 18 years old and legally capable of entering into a contract under Indian law.",
        "You must provide accurate registration information and keep your account details current.",
        "You may not use the Service for unlawful purposes or in violation of applicable tax, labour, consumer protection, or commercial laws.",
      ],
    },
    {
      id: "service-description",
      title: "3. Description of the Service",
      paragraphs: [
        "Mahajaan is a cloud-based retail business management platform that may include billing, POS, inventory, purchases, parties, reports, staff and payroll features, GST-related tools, messaging integrations, AI-assisted features, and related functionality. Features may vary by plan, region, or release stage.",
        "We may add, modify, suspend, or discontinue features at any time. Beta or experimental features are provided as-is and may change without notice.",
      ],
    },
    {
      id: "account-security",
      title: "4. Accounts and security",
      bullets: [
        "You are responsible for all activity under your account and for maintaining the confidentiality of login credentials.",
        "You must promptly notify us of any unauthorised access or security breach at hello@mahajaan.com.",
        "You are responsible for configuring user roles and permissions within your organisation.",
        "We may suspend or terminate accounts that appear compromised, fraudulent, or abusive.",
      ],
    },
    {
      id: "merchant-responsibilities",
      title: "5. Merchant responsibilities",
      paragraphs: [
        "You are solely responsible for the accuracy, legality, and completeness of business data you enter into the Service, including inventory, prices, invoices, tax details, payroll, attendance, and customer communications.",
        "You are responsible for compliance with GST, income tax, labour laws, shop and establishment requirements, and all other laws applicable to your business.",
        "The Service provides tools and calculations based on the data you supply. It does not replace professional advice from chartered accountants, tax practitioners, lawyers, or labour consultants.",
        "If you use customer-facing channels such as WhatsApp or online catalog features, you are responsible for customer consent, order fulfilment, pricing accuracy, refunds, and consumer protection compliance.",
      ],
    },
    {
      id: "acceptable-use",
      title: "6. Acceptable use",
      paragraphs: ["You agree not to:"],
      bullets: [
        "Use the Service to store or transmit unlawful, infringing, defamatory, or harmful content",
        "Attempt to gain unauthorised access to the Service, other accounts, or our systems",
        "Reverse engineer, scrape, or misuse the Service except as permitted by law",
        "Interfere with the integrity, performance, or security of the Service",
        "Upload malware or use the Service to send spam or deceptive messages",
        "Misrepresent your identity, business, or affiliation",
        "Use the Service in a manner that violates third-party rights or platform policies, including messaging provider rules",
      ],
    },
    {
      id: "subscription-fees",
      title: "7. Plans, fees, and taxes",
      paragraphs: [
        "Some features may be offered free of charge during early access or promotional periods. Paid plans, if introduced, will be described at the point of purchase.",
        "Fees, billing cycles, renewals, and refunds for paid plans will be governed by the pricing terms presented at purchase unless otherwise agreed in writing.",
        "You are responsible for all applicable taxes associated with your use of the Service, except taxes based on our net income.",
      ],
    },
    {
      id: "intellectual-property",
      title: "8. Intellectual property",
      paragraphs: [
        "The Service, including software, branding, design, documentation, and underlying technology, is owned by the Company or its licensors and is protected by intellectual property laws.",
        "We grant you a limited, non-exclusive, non-transferable, revocable licence to use the Service for your internal business purposes in accordance with these Terms.",
        "You retain ownership of business content you upload or create. You grant us a worldwide licence to host, process, transmit, display, and use that content solely to provide, secure, and improve the Service.",
      ],
    },
    {
      id: "confidentiality",
      title: "9. Confidentiality",
      paragraphs: [
        "Each party may receive confidential information from the other. You agree not to misuse our confidential information, including non-public product details, security information, or pricing not publicly published.",
        "We will use reasonable measures to protect your business data in accordance with our Privacy Policy.",
      ],
    },
    {
      id: "third-party",
      title: "10. Third-party services",
      paragraphs: [
        "The Service may integrate with or rely on third-party services such as cloud infrastructure, payment gateways, messaging platforms, analytics tools, or AI providers. Your use of those services may be subject to separate terms and privacy policies.",
        "We are not responsible for third-party services we do not control, but we will use reasonable efforts to select reliable providers.",
      ],
    },
    {
      id: "disclaimers",
      title: "11. Disclaimers",
      paragraphs: [
        'THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS TO THE MAXIMUM EXTENT PERMITTED BY LAW. WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY OF REPORTS OR CALCULATIONS.',
        "We do not warrant that the Service will be uninterrupted, error-free, secure, or free of harmful components. You use the Service at your own risk.",
      ],
    },
    {
      id: "limitation-liability",
      title: "12. Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by applicable law, the Company and its directors, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, data, goodwill, or business opportunity, arising out of or related to the Service or these Terms.",
        "To the maximum extent permitted by applicable law, our aggregate liability for all claims arising out of or relating to the Service or these Terms shall not exceed the greater of (a) the amount you paid us for the Service in the twelve (12) months preceding the claim, or (b) INR 5,000.",
        "Nothing in these Terms limits liability that cannot be limited under applicable law, including liability for fraud or wilful misconduct.",
      ],
    },
    {
      id: "indemnity",
      title: "13. Indemnity",
      paragraphs: [
        "You agree to indemnify, defend, and hold harmless the Company and its affiliates, officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or related to: (a) your use of the Service; (b) your business data or customer communications; (c) your violation of these Terms or applicable law; or (d) any dispute between you and your customers, employees, suppliers, or other third parties.",
      ],
    },
    {
      id: "suspension-termination",
      title: "14. Suspension and termination",
      paragraphs: [
        "You may stop using the Service at any time. You may request account closure in accordance with our Data Deletion Instructions.",
        "We may suspend or terminate your access immediately if you materially breach these Terms, create security or legal risk, fail to pay applicable fees, or if required by law or a platform partner.",
        "Upon termination, your right to use the Service ceases. Sections that by their nature should survive termination will survive, including intellectual property, disclaimers, limitation of liability, indemnity, and governing law.",
      ],
    },
    {
      id: "governing-law",
      title: "15. Governing law and dispute resolution",
      paragraphs: [
        "These Terms are governed by the laws of India.",
        "Subject to applicable law, courts at Raipur, Chhattisgarh shall have exclusive jurisdiction over disputes arising out of or relating to these Terms or the Service.",
        "Before initiating formal proceedings, the parties agree to attempt good-faith resolution by contacting hello@mahajaan.com and allowing thirty (30) days to resolve the matter.",
      ],
    },
    {
      id: "changes",
      title: "16. Changes to these Terms",
      paragraphs: [
        "We may update these Terms from time to time. The \"Last updated\" date will indicate the current version. Material changes may be notified through the Service, email, or website notice. Continued use after the effective date of updated Terms constitutes acceptance, to the extent permitted by law.",
      ],
    },
    {
      id: "contact",
      title: "17. Contact",
      paragraphs: [
        "ZEROKNOW TECHNOLOGIES PRIVATE LIMITED",
        "CIN: U62090CT2026PTC020346",
        "Email: hello@mahajaan.com",
        "Websites: mahajaan.com, mahajaan.in",
      ],
    },
  ],
};
