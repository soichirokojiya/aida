import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://umeko.life";

export const metadata: Metadata = {
  title: "うめこ｜LINE・Slackで使える会話整理AI｜言いづらいことをやわらかく",
  description:
    "LINEグループやSlackチャンネルに招待すれば会話を見守り、1対1なら伝え方の相談ができるAI「うめこ」。きつい言い方をやわらかくしたり、すれ違いを整理したり。1ヶ月無料、月額490円から。",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  openGraph: {
    title: "うめこ｜LINE・Slackで使える会話整理AI",
    description:
      "言いづらいことをやわらかく。すれ違いを少しずつ軽く。LINEグループやSlackチャンネルに招待しても、1対1で相談しても。1ヶ月無料。",
    url: BASE_URL,
    siteName: "うめこ",
    images: [
      {
        url: "/ogp.png",
        width: 1200,
        height: 630,
        alt: "うめこ - LINE・Slackで使える会話整理AI",
      },
    ],
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "うめこ｜LINE・Slackで使える会話整理AI",
    description:
      "言いづらいことをやわらかく。すれ違いを少しずつ軽く。1ヶ月無料。",
    images: ["/ogp.png"],
  },
  other: {
    "theme-color": "#0D9488",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-4ZB48ZQL7E" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-4ZB48ZQL7E');`,
          }}
        />
        {/* 構造化データ: SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "うめこ",
              applicationCategory: "CommunicationApplication",
              operatingSystem: "Web",
              description:
                "LINEで使える会話整理AI。グループの見守り、1対1の相談、言い換え、要約に対応。",
              offers: [
                {
                  "@type": "Offer",
                  name: "無料トライアル",
                  price: "0",
                  priceCurrency: "JPY",
                  description: "1ヶ月間無料",
                },
                {
                  "@type": "Offer",
                  name: "DMプラン",
                  price: "490",
                  priceCurrency: "JPY",
                  description: "月額490円で1対1の相談が使い放題",
                },
                {
                  "@type": "Offer",
                  name: "グループ利用権",
                  price: "980",
                  priceCurrency: "JPY",
                  description: "月額980円で1グループの見守り・整理が使い放題",
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
              name: "うめこ",
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
              mainEntity: [
                {
                  "@type": "Question",
                  name: "会話の内容は安全ですか？",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "会話データは実名ではなくLINE上の識別情報をもとに管理しています。会話内容が外部に公開されたり、第三者に販売されることはありません。",
                  },
                },
                {
                  "@type": "Question",
                  name: "無料期間が終わったらどうなりますか？",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "無料期間終了後は、DMもグループもうめこが応答しなくなります。DMプラン（月額490円）やグループ利用権（月額980円）に登録すると使えるようになります。",
                  },
                },
                {
                  "@type": "Question",
                  name: "グループに入れたらすべての会話に返信しますか？",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "いいえ。普段は静かに見守っていて、空気が悪くなりそうなときや「うめこ」と呼びかけられたときに反応します。",
                  },
                },
                {
                  "@type": "Question",
                  name: "1対1では何ができますか？",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "伝え方の相談、メッセージの言い換え、気持ちの整理、モヤモヤの言語化などに使えます。",
                  },
                },
                {
                  "@type": "Question",
                  name: "解約はかんたんにできますか？",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "はい。いつでも解約できます。LINEをブロックして利用を止めることもできます。",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
