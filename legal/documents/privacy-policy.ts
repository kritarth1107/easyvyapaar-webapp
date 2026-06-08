import { LEGAL_EFFECTIVE_DATE, LEGAL_LAST_UPDATED } from "../company";
import type { LegalDocument } from "../types";

export const privacyPolicy: LegalDocument = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  description:
    "How ZEROKNOW TECHNOLOGIES PRIVATE LIMITED collects, uses, stores, and protects personal data when you use Mahajaan.",
  lastUpdated: LEGAL_LAST_UPDATED,
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      id: "introduction",
      title: "1. Introduction",
      paragraphs: [
        'This Privacy Policy ("Policy") explains how ZEROKNOW TECHNOLOGIES PRIVATE LIMITED (CIN: U62090CT2026PTC020346) ("Company", "we", "us", or "our") collects, uses, stores, shares, and protects information when you access or use Mahajaan, our retail business management platform, through mahajaan.com, mahajaan.in, related mobile or web applications, APIs, integrations (including messaging channels such as WhatsApp, where enabled), and associated services (collectively, the "Service").',
        'By registering for, accessing, or using the Service, you acknowledge that you have read and understood this Policy. If you do not agree, please do not use the Service.',
        "This Policy is published in accordance with applicable Indian laws, including the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023 (DPDPA), to the extent applicable.",
      ],
    },
    {
      id: "roles",
      title: "2. Roles and scope",
      paragraphs: [
        "For account, billing, and platform operations data, the Company acts as a Data Fiduciary (or equivalent controller) under applicable law.",
        "When you use Mahajaan to store information about your customers, employees, suppliers, or other third parties, you act as the data controller for that business data. You are responsible for having a lawful basis to collect and process such data and for providing appropriate notices to those individuals. We process that data on your instructions as a Data Processor / service provider to operate the Service.",
      ],
    },
    {
      id: "information-we-collect",
      title: "3. Information we collect",
      subsections: [
        {
          id: "account-information",
          title: "3.1 Account and identity information",
          bullets: [
            "Name, mobile number, email address, and login credentials",
            "Business profile details, organisation name, trade name, and user role",
            "Verification information you provide during registration or onboarding",
          ],
        },
        {
          id: "business-data",
          title: "3.2 Business and transaction data you enter",
          bullets: [
            "Inventory, pricing, stock, categories, and product records",
            "Sales invoices, quotations, purchase bills, returns, and payment records",
            "Party and customer details, including contact information and balances",
            "GST, HSN, tax, and compliance-related fields you submit",
            "Staff records, attendance, payroll, salary history, and related workforce data",
            "Reports, notes, attachments, and custom fields added by you or your users",
          ],
        },
        {
          id: "technical-data",
          title: "3.3 Technical and usage information",
          bullets: [
            "Device type, browser type, operating system, and app version",
            "IP address, timestamps, pages or features accessed, and audit logs",
            "Cookies, session identifiers, and similar technologies where used",
            "Error logs, diagnostics, and security event records",
          ],
        },
        {
          id: "communications",
          title: "3.4 Communications and support",
          bullets: [
            "Messages you send to us by email or in-product support channels",
            "Feedback, bug reports, and survey responses",
            "Records of account deletion, privacy, or grievance requests",
          ],
        },
        {
          id: "integrations",
          title: "3.5 Third-party and messaging integrations",
          paragraphs: [
            "If you connect or use optional integrations (for example WhatsApp Business, payment providers, AI features, or catalog enrichment), we may receive information necessary to deliver those features, such as message content, customer phone numbers, delivery status, or product search queries. The data received depends on the integration you enable and the permissions you grant.",
          ],
        },
      ],
    },
    {
      id: "how-we-use",
      title: "4. How we use information",
      bullets: [
        "Provide, operate, maintain, secure, and improve the Service",
        "Authenticate users, manage organisations, and enforce access controls",
        "Generate invoices, reports, inventory records, payroll calculations, and other business outputs you request",
        "Send service-related communications, security alerts, and administrative notices",
        "Respond to support requests, legal notices, and grievances",
        "Detect, prevent, and investigate fraud, abuse, or security incidents",
        "Comply with applicable law, regulatory requests, and valid legal process",
        "Develop new features, including search, recommendations, analytics, and AI-assisted tools, where enabled",
      ],
    },
    {
      id: "lawful-basis",
      title: "5. Lawful basis and consent",
      paragraphs: [
        "We process personal data where necessary to perform our contract with you, to comply with legal obligations, for legitimate business interests such as security and product improvement, or based on your consent where required by law.",
        "Where the Service processes personal data of your customers, employees, or other third parties on your behalf, you represent that you have provided appropriate notice and obtained all consents required under applicable law.",
        "You may withdraw consent for optional processing where consent is the basis, without affecting the lawfulness of processing before withdrawal. Some features may not function if required data is not provided.",
      ],
    },
    {
      id: "sharing",
      title: "6. How we share information",
      paragraphs: [
        "We do not sell your personal data. We may share information only as described below:",
      ],
      bullets: [
        "Service providers and subprocessors that host infrastructure, provide email delivery, analytics, messaging, payment, AI, or security services, under contractual confidentiality and security obligations",
        "Professional advisers such as lawyers, auditors, or insurers, where necessary and subject to confidentiality",
        "Authorities, regulators, courts, or law enforcement when required by applicable law or a valid legal request",
        "A successor entity in connection with a merger, acquisition, reorganisation, or sale of assets, subject to this Policy or equivalent protections",
        "Other users in your organisation according to the permissions and roles you configure",
      ],
    },
    {
      id: "retention",
      title: "7. Data retention",
      paragraphs: [
        "We retain personal data for as long as your account is active or as needed to provide the Service, unless a longer retention period is required or permitted by law.",
        "Business records you create (such as invoices, tax records, payroll, and accounting entries) may be retained for statutory periods required under Indian tax, accounting, or commercial laws, even after account closure or deletion requests, where retention is legally necessary.",
        "Backup copies may persist for a limited period before being overwritten in the ordinary course of operations.",
      ],
    },
    {
      id: "security",
      title: "8. Security",
      paragraphs: [
        "We implement reasonable administrative, technical, and organisational safeguards designed to protect personal data against unauthorised access, alteration, disclosure, or destruction. These may include access controls, encryption in transit where supported, logging, and monitoring.",
        "No method of transmission or storage is completely secure. You are responsible for safeguarding your login credentials and controlling user access within your organisation.",
      ],
    },
    {
      id: "rights",
      title: "9. Your rights",
      paragraphs: [
        "Subject to applicable law, including the DPDPA, you may have the right to access personal data we hold about you; request correction or updating of inaccurate or incomplete data; request erasure of personal data, subject to legal retention requirements; withdraw consent for processing based on consent; nominate another individual to exercise rights in the event of death or incapacity, where applicable; and raise a grievance with us regarding our processing of your personal data.",
        "To exercise these rights, contact us using the details in Section 13. We may need to verify your identity before responding. If you are an end customer or employee of a merchant using Mahajaan, please contact that merchant first; we may direct your request to the merchant where they are the data controller.",
      ],
    },
    {
      id: "children",
      title: "10. Children",
      paragraphs: [
        "The Service is intended for use by businesses and authorised adults. It is not directed to children under 18 years of age. We do not knowingly collect personal data from children. If you believe a child has provided personal data to us, contact us and we will take appropriate steps.",
      ],
    },
    {
      id: "cross-border",
      title: "11. Cross-border processing",
      paragraphs: [
        "Your data may be stored or processed in India and, where necessary to provide the Service, in other countries through our infrastructure or service providers. Where required by law, we take steps to ensure appropriate safeguards for cross-border transfers.",
      ],
    },
    {
      id: "third-party-links",
      title: "12. Third-party websites and services",
      paragraphs: [
        "The Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. Their policies govern their collection and use of your information.",
      ],
    },
    {
      id: "contact-grievance",
      title: "13. Contact and grievance redressal",
      paragraphs: [
        "For privacy questions, rights requests, or grievances under applicable Indian data protection law, contact:",
        "ZEROKNOW TECHNOLOGIES PRIVATE LIMITED",
        "Email: hello@mahajaan.com",
        "Product: Mahajaan (mahajaan.com / mahajaan.in)",
        "We will acknowledge grievances within the timelines required by applicable law and work to resolve them promptly.",
      ],
    },
    {
      id: "changes",
      title: "14. Changes to this Policy",
      paragraphs: [
        "We may update this Policy from time to time. The \"Last updated\" date at the top of this page will reflect the latest version. Material changes may be communicated through the Service, by email, or by posting a notice on our websites. Continued use of the Service after changes become effective constitutes acceptance of the updated Policy, to the extent permitted by law.",
      ],
    },
  ],
};
