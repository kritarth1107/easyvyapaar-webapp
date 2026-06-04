import { DecorativePanel, LoginForm } from "@/components/login";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl, SITE_NAME } from "@/lib/seo/site-metadata";

const loginJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${getSiteUrl()}/auth/login#webpage`,
      url: `${getSiteUrl()}/auth/login`,
      name: `Sign in to your shop | ${SITE_NAME}`,
      description:
        `Sign in to ${SITE_NAME} with your mobile number and OTP to manage your Indian retail store.`,
      isPartOf: { "@id": `${getSiteUrl()}/#website` },
      inLanguage: "en-IN",
    },
    {
      "@type": "WebSite",
      "@id": `${getSiteUrl()}/#website`,
      url: getSiteUrl(),
      name: SITE_NAME,
      description: "Retail ERP for Indian shops — billing, inventory, and GST.",
    },
  ],
};

export default function LoginPage() {
  return (
    <>
      <JsonLd data={loginJsonLd} />
      <div className="flex min-h-screen font-sans">
        <DecorativePanel />
        <LoginForm />
      </div>
    </>
  );
}
