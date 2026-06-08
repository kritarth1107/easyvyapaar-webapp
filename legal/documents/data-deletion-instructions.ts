import { LEGAL_EFFECTIVE_DATE, LEGAL_LAST_UPDATED } from "../company";
import type { LegalDocument } from "../types";

export const dataDeletionInstructions: LegalDocument = {
  slug: "data-deletion-instructions",
  title: "Data Deletion Instructions",
  description:
    "How to request deletion of your Mahajaan account and associated personal data.",
  lastUpdated: LEGAL_LAST_UPDATED,
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      id: "overview",
      title: "1. Overview",
      paragraphs: [
        "This page explains how users of Mahajaan can request deletion of account-related personal data processed by ZEROKNOW TECHNOLOGIES PRIVATE LIMITED (CIN: U62090CT2026PTC020346) in connection with the Service available at mahajaan.com and mahajaan.in.",
        "These instructions apply to account holders and authorised business users. If you are a customer, employee, or other individual whose data was entered into Mahajaan by a shop or business, please contact that business directly in the first instance. The business is responsible for the data it uploaded about you.",
      ],
    },
    {
      id: "what-you-can-delete",
      title: "2. What you can request to delete",
      paragraphs: [
        "Subject to legal and operational requirements, you may request deletion of:",
      ],
      bullets: [
        "Your user account and login profile",
        "Contact details associated with your account, such as name, mobile number, and email",
        "Organisation membership and access permissions linked to your user account",
        "Personal identifiers and preferences stored for your account",
        "Support communications that identify you personally, where retention is not required",
      ],
    },
    {
      id: "what-may-be-retained",
      title: "3. What may be retained",
      paragraphs: [
        "We may retain certain information even after a deletion request where permitted or required by law, including:",
      ],
      bullets: [
        "GST invoices, purchase records, payroll records, accounting entries, and tax-related documents that must be retained under Indian tax or commercial law",
        "Audit logs, security records, and fraud-prevention data for a limited period",
        "Information necessary to establish, exercise, or defend legal claims",
        "Anonymised or aggregated data that no longer identifies you",
        "Backup copies until those backups are rotated and overwritten in the ordinary course of business",
        "Business records that belong to an organisation that remains active, where other authorised users continue to operate the account",
      ],
    },
    {
      id: "organisation-accounts",
      title: "4. Organisation and multi-user accounts",
      paragraphs: [
        "If your business organisation continues to use Mahajaan after you leave, business records created for that organisation may remain with the organisation account.",
        "If you are the sole owner or authorised administrator and wish to delete the entire organisation and its associated data, you must clearly state that in your request. We may require additional verification because deletion may be irreversible and may affect statutory record-keeping obligations.",
        "We may refuse or delay full organisational deletion where retention is required by law or where outstanding fees, disputes, or security reviews are pending.",
      ],
    },
    {
      id: "how-to-request",
      title: "5. How to request deletion",
      paragraphs: [
        "Send an email from your registered account email address, or from the mobile number associated with your account, to:",
        "Email: hello@mahajaan.com",
        "Subject line: Data Deletion Request — Mahajaan",
        "Include the following information:",
      ],
      bullets: [
        "Your full name",
        "Registered mobile number and/or email address",
        "Business or organisation name on Mahajaan, if applicable",
        "Whether you are requesting deletion of only your user profile or the entire organisation account",
        "A clear statement that you want your personal data/account deleted",
        "Any additional context that will help us locate your account",
      ],
    },
    {
      id: "verification",
      title: "6. Verification",
      paragraphs: [
        "To protect your account from unauthorised deletion, we may verify your identity by confirming control of the registered mobile number or email, requesting organisation ownership confirmation, or asking for reasonable supporting information.",
        "We may decline requests that cannot be verified or that appear fraudulent.",
      ],
    },
    {
      id: "processing-timeline",
      title: "7. Processing timeline",
      paragraphs: [
        "We will acknowledge your request within seven (7) business days.",
        "Verified deletion requests are typically completed within thirty (30) days, unless a longer period is required for legal retention, backup rotation, complex organisation closure, or regulatory review.",
        "We will inform you when deletion is complete or explain why certain data must be retained.",
      ],
    },
    {
      id: "messaging-integrations",
      title: "8. WhatsApp and third-party integrations",
      paragraphs: [
        "If you connected third-party services such as WhatsApp Business, you should also disconnect or delete data held in those third-party systems according to their own policies.",
        "We will delete Mahajaan-side integration data we control, but we cannot delete records stored solely on third-party platforms.",
      ],
    },
    {
      id: "alternatives",
      title: "9. Alternatives to deletion",
      paragraphs: [
        "If you only want to stop using the Service temporarily, you may deactivate user access or stop logging in instead of deleting your account.",
        "If you need correction rather than deletion, email hello@mahajaan.com with the subject line: Data Correction Request — Mahajaan.",
      ],
    },
    {
      id: "grievance",
      title: "10. Grievances",
      paragraphs: [
        "If you are dissatisfied with our response to a deletion request, you may raise a grievance by replying to our acknowledgement email or writing again to hello@mahajaan.com with the subject line: Privacy Grievance — Mahajaan.",
        "We will review grievances in accordance with applicable Indian data protection law.",
      ],
    },
    {
      id: "contact",
      title: "11. Contact",
      paragraphs: [
        "ZEROKNOW TECHNOLOGIES PRIVATE LIMITED",
        "CIN: U62090CT2026PTC020346",
        "Email: hello@mahajaan.com",
        "Websites: mahajaan.com, mahajaan.in",
      ],
    },
  ],
};
