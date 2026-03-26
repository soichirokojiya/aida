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

export const metadata: Metadata = {
  title: "うめこ | 会話をやさしく整理するAI",
  description:
    "言いづらいことをやわらかく。すれ違いを少しずつ軽く。グループでも1対1でも使える会話サポートAI「うめこ」",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "うめこ | 会話をやさしく整理するAI",
    description:
      "言いづらいことをやわらかく。すれ違いを少しずつ軽く。LINEグループに招待しても、1対1で相談しても。",
    images: [{ url: "/umeko-avatar.png", width: 1080, height: 1080 }],
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    title: "うめこ | 会話をやさしく整理するAI",
    description: "言いづらいことをやわらかく。すれ違いを少しずつ軽く。",
    images: ["/umeko-avatar.png"],
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
