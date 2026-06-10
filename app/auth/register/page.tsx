import { RegisterForm, RegisterSidebar } from "@/components/register";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl, SITE_NAME } from "@/lib/seo/site-metadata";

type RegisterPageProps = {
  searchParams: Promise<{ mobile?: string }>;
};

const registerJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${getSiteUrl()}/auth/register#webpage`,
      url: `${getSiteUrl()}/auth/register`,
      name: `Create your free shop account | ${SITE_NAME}`,
      description:
        `Register your shop on ${SITE_NAME} with optional GST verification, business details, and mobile OTP.`,
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

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const initialMobile = params.mobile?.replace(/\D/g, "").slice(-10) ?? "";

  return (
    <>
      <JsonLd data={registerJsonLd} />
      <div className="flex min-h-screen min-h-[100dvh] w-full font-sans overflow-x-hidden">
        <RegisterSidebar />
        <RegisterForm initialMobile={initialMobile} />
      </div>
    </>
  );
}
