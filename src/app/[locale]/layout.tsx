import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isValidLocale, getMessages, type Locale } from "@/lib/i18n";

const BASE_URL = "https://umeko.life";

const ogLocaleMap: Record<Locale, string> = {
  ja: "ja_JP",
  en: "en_US",
  "zh-TW": "zh_TW",
  th: "th_TH",
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const m = await getMessages(locale);

  const alternateLanguages: Record<string, string> = {};
  for (const l of locales) {
    alternateLanguages[l] = `${BASE_URL}/${l}`;
  }

  return {
    title: m.meta.title,
    description: m.meta.description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `/${locale}`,
      languages: alternateLanguages,
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large" as const,
      "max-video-preview": -1,
    },
    openGraph: {
      title: m.meta.title,
      description: m.meta.description,
      url: `${BASE_URL}/${locale}`,
      siteName: "Umeko",
      images: [
        {
          url: "/ogp.png",
          width: 1200,
          height: 630,
          alt: m.meta.ogAlt,
        },
      ],
      type: "website",
      locale: ogLocaleMap[locale],
    },
    twitter: {
      card: "summary_large_image",
      title: m.meta.title,
      description: m.meta.description,
      images: ["/ogp.png"],
    },
    other: {
      "theme-color": "#0D9488",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const m = await getMessages(locale);

  const htmlLang = locale === "zh-TW" ? "zh-Hant-TW" : locale;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang="${htmlLang}"`,
        }}
      />
      {/* 構造化データ: SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Umeko",
            applicationCategory: "CommunicationApplication",
            operatingSystem: "Web",
            description: m.structuredData.appDesc,
            offers: [
              {
                "@type": "Offer",
                name: m.structuredData.freeTrial,
                price: "0",
                priceCurrency: "JPY",
                description: m.structuredData.freeDesc,
              },
              {
                "@type": "Offer",
                name: m.structuredData.planName,
                price: "980",
                priceCurrency: "JPY",
                description: m.structuredData.planDesc,
              },
            ],
          }),
        }}
      />
      {/* 構造化データ: Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Umeko",
            url: BASE_URL,
            logo: `${BASE_URL}/umeko-logo.png`,
            parentOrganization: {
              "@type": "Organization",
              name: "cfac",
              url: "https://cfac.co.jp",
            },
          }),
        }}
      />
      {/* 構造化データ: FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: m.structuredData.faqItems.map(
              (item: { q: string; a: string }) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.a,
                },
              })
            ),
          }),
        }}
      />
      {children}
    </>
  );
}
