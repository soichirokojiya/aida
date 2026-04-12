import Link from "next/link";
import { notFound } from "next/navigation";
import { LineMock } from "@/components/line-mock";
import { SlackMock } from "@/components/slack-mock";
import { PlatformTabs } from "@/components/platform-tabs";
import { isValidLocale, getMessages } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";

const LINE_ADD_URL = "https://lin.ee/nHtneAR";
const SLACK_INSTALL_URL = "/api/slack/install";

function LineButton({ children, size = "lg" }: { children: React.ReactNode; size?: "lg" | "sm" }) {
  const cls = size === "lg"
    ? "px-8 py-4 text-base md:text-lg"
    : "px-6 py-3 text-sm";
  return (
    <Link
      href={LINE_ADD_URL}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full bg-[#06C755] text-white font-semibold shadow-lg hover:bg-[#05b04c] transition-all hover:shadow-xl hover:-translate-y-0.5 ${cls}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
      {children}
    </Link>
  );
}

function SlackButton({ children, size = "lg" }: { children: React.ReactNode; size?: "lg" | "sm" }) {
  const cls = size === "lg"
    ? "px-8 py-4 text-base md:text-lg"
    : "px-6 py-3 text-sm";
  return (
    <Link
      href={SLACK_INSTALL_URL}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full bg-[#4A154B] text-white font-semibold shadow-lg hover:bg-[#611f64] transition-all hover:shadow-xl hover:-translate-y-0.5 ${cls}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" />
      </svg>
      {children}
    </Link>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const m = await getMessages(locale);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/umeko-logo.png" alt={m.nav.brand} className="w-8 h-8 rounded-full" />
            <span className="font-bold text-gray-800">{m.nav.brand}</span>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher current={locale} />
            <LineButton size="sm">LINE</LineButton>
            <SlackButton size="sm">Slack</SlackButton>
          </div>
        </div>
      </nav>

      {/* ── 1. Hero ── */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F0] via-white to-[#EBF2FA]" />
        <div className="absolute top-20 -left-40 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/umeko-logo.png" alt={m.nav.brand} className="w-16 h-16 rounded-2xl shadow-md mb-6" />

              <h1 className="text-3xl md:text-[2.75rem] font-bold text-gray-800 leading-[1.3] tracking-tight mb-5">
                {m.hero.h1_1}
                <br />
                <span className="text-teal-600">{m.hero.h1_2}</span>
              </h1>

              <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-3">
                {m.hero.sub1}
              </p>
              <p className="text-gray-500 text-base leading-relaxed mb-3">
                {m.hero.sub2}
              </p>
              <p className="text-gray-500 text-base leading-relaxed mb-3">
                {m.hero.sub3_1}<strong className="text-gray-700">{m.hero.sub3_strong}</strong>{m.hero.sub3_2}
              </p>
              <p className="text-gray-500 text-base leading-relaxed mb-8">
                {m.hero.sub4}
              </p>

              <div className="flex flex-wrap gap-3">
                <LineButton>{m.hero.lineBtn}</LineButton>
                <SlackButton>{m.hero.slackBtn}</SlackButton>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                {m.hero.freeTrial}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 max-w-[340px]">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="w-full"
                  src="/demo-dm-follow.mp4"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. 掲載媒体 ── */}
      <section className="py-10 px-6 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs text-gray-400 mb-6">{m.media.label}</p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap opacity-70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media-mainichi.png" alt="毎日新聞" className="w-32 md:w-36 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media-nishinippon.png" alt="西日本新聞" className="w-32 md:w-36 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media-niconico.png" alt="ニコニコニュース" className="w-32 md:w-36 object-contain" />
          </div>
        </div>
      </section>

      {/* ── 3. 共感 ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">{m.empathy.label}</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            {m.empathy.title}
          </h2>

          <div className="space-y-4 max-w-xl mx-auto">
            {(m.empathy.items as string[]).map((text: string, i: number) => (
              <p key={i} className="text-gray-600 text-base leading-relaxed">{text}</p>
            ))}
          </div>

          <p className="text-center text-gray-500 text-base mt-10">
            {m.empathy.closing}
          </p>
        </div>
      </section>

      {/* ── 4. うめこという存在 ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/umeko-logo.png" alt={m.nav.brand} className="w-20 h-20 rounded-full shadow-lg mx-auto mb-6 border-4 border-teal-50" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              {m.brand.title}
            </h2>
            <p className="text-gray-500 text-base leading-relaxed max-w-lg mx-auto">
              {m.brand.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-12">
            {(m.brand.traits as string[]).map((text: string, i: number) => (
              <div key={i} className="bg-[#FAFBFC] rounded-xl py-4 px-5 border border-gray-100 text-center">
                <p className="text-base text-gray-700">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-teal-50/60 rounded-2xl p-8 border border-teal-100/60">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/umeko-logo.png" alt="" className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 leading-[1.9] text-sm whitespace-pre-line">
                {m.brand.bio}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. できること ── */}
      <section className="py-20 px-6 bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            {m.features.title}
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {(m.features.items as any[]).map((item: any, i: number) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                <span className="text-3xl block mb-3">{item.icon}</span>
                <p className="font-medium text-gray-800 mb-2">{item.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <LineButton size="sm">{m.features.cta}</LineButton>
            <p className="mt-2 text-xs text-gray-400">{m.features.ctaSub}</p>
          </div>
        </div>
      </section>

      {/* ── 6. グループで使う ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">{m.group.label}</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {m.group.title}
          </h2>
          <p className="text-center text-gray-500 text-base mb-12 max-w-lg mx-auto">
            {m.group.desc}
          </p>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <LineMock
              title={m.mock.familyGroup}
              messages={m.mock.familyChat}
              memberCount={3}
              inputPlaceholder={m.mock.lineInput}
              membersLabel={m.mock.members}
            />
            <div className="space-y-6">
              <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-gray-100">
                <p className="font-medium text-gray-800 mb-3">{m.group.whatUmekoDoes}</p>
                <ul className="space-y-2 text-base text-gray-600">
                  {(m.group.actions as string[]).map((text: string, i: number) => (
                    <li key={i} className="flex gap-2"><span className="text-teal-500">&#10003;</span>{text}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-gray-100">
                <p className="font-medium text-gray-800 mb-3">{m.group.useCasesTitle}</p>
                <ul className="space-y-1.5 text-base text-gray-500">
                  {(m.group.useCases as string[]).map((text: string, i: number) => (
                    <li key={i}>・{text}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6.5 いるだけで変わる ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-[#F6FAF8]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-10">
            {m.presence.title}
          </h2>

          <div className="space-y-4 max-w-xl mx-auto">
            {(m.presence.lines as string[]).map((text: string, i: number) => (
              <p key={i} className="text-gray-600 text-base leading-relaxed">{text}</p>
            ))}
          </div>

          <div className="mt-12 bg-teal-50/60 rounded-2xl p-8 border border-teal-100/60">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/umeko-logo.png" alt="" className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 leading-[1.9] text-sm whitespace-pre-line">
                {m.presence.umeko}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. 1対1で使う ── */}
      <section className="py-20 px-6 bg-[#F6FAF8]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">{m.dm.label}</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {m.dm.title}
          </h2>
          <p className="text-center text-gray-500 text-base mb-12 max-w-lg mx-auto">
            {m.dm.desc}
          </p>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="font-medium text-gray-800 mb-3">{m.dm.useCasesTitle}</p>
                <ul className="space-y-2 text-base text-gray-600">
                  {(m.dm.useCases as string[]).map((text: string, i: number) => (
                    <li key={i} className="flex gap-2"><span className="text-sky-500">&#10003;</span>{text}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <LineMock
                title={m.mock.dmTitle}
                messages={m.mock.dmConsult}
                inputPlaceholder={m.mock.lineInput}
                membersLabel={m.mock.members}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. ユースケース ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            {m.scenarios.title}
          </h2>

          {/* 親子 */}
          <div className="mb-12">
            <p className="text-teal-600 text-sm font-medium mb-2">{m.scenarios.family.label}</p>
            <p className="text-gray-800 font-medium text-lg mb-1">{m.scenarios.family.title}</p>
            <p className="text-gray-500 text-sm mb-5">{m.scenarios.family.desc}</p>
            <div className="grid md:grid-cols-3 gap-4">
              {(m.scenarios.family.cards as any[]).map((card: any, i: number) => (
                <div key={i} className="bg-[#FAFBFC] rounded-xl p-5 border border-gray-100">
                  <p className="text-xl mb-2">{card.icon}</p>
                  <p className="font-medium text-gray-800 text-sm mb-1">{card.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 職場・Slack */}
          <div>
            <p className="text-teal-600 text-sm font-medium mb-2">{m.scenarios.work.label}</p>
            <p className="text-gray-800 font-medium text-lg mb-1">{m.scenarios.work.title}</p>
            <p className="text-gray-500 text-sm mb-5">{m.scenarios.work.desc}</p>
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <div className="bg-[#FAFBFC] rounded-xl p-5 border border-gray-100">
                  <ul className="space-y-2 text-sm text-gray-600">
                    {(m.scenarios.work.useCases as string[]).map((text: string, i: number) => (
                      <li key={i} className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>{text}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <SlackMock
                    channel={m.mock.devTeam}
                    messages={m.mock.slackBusiness}
                    inputPlaceholder={m.mock.slackInput}
                    brandName={m.nav.brand}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#4A154B] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                    {m.scenarios.work.watching}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 py-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A154B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                  <div className="bg-purple-50 border border-[#4A154B]/20 rounded-full px-4 py-1.5">
                    <p className="text-[#4A154B] text-xs font-bold">{m.scenarios.work.detect}</p>
                  </div>
                </div>
                <SlackMock
                  channel={m.mock.dmTitle}
                  messages={m.mock.slackDmIntervention}
                  isDm
                  inputPlaceholder={m.mock.slackInputDm}
                  brandName={m.nav.brand}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. 料金 ── */}
      <section className="py-20 px-6 bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {m.pricing.title}
          </h2>
          <p className="text-center text-gray-500 text-base mb-8">
            {m.pricing.freeTrial}
          </p>

          <PlatformTabs
            tabLineLabel={m.pricing.tabLine}
            tabSlackLabel={m.pricing.tabSlack}
            lineContent={
              <div>
                <div className="max-w-md mx-auto">
                  <div className="bg-white rounded-2xl p-8 border border-[#06C755]/30 shadow-sm text-center">
                    <p className="text-[#06C755] font-medium text-sm mb-1">{m.pricing.line.label}</p>
                    <p className="text-4xl font-bold text-gray-800 mb-1">{m.pricing.line.price}<span className="text-base font-normal text-gray-500"> {m.pricing.line.period}</span></p>
                    <p className="text-gray-500 text-sm mb-6">{m.pricing.line.desc}</p>
                    <ul className="space-y-2 text-base text-gray-600 text-left">
                      {(m.pricing.line.features as string[]).map((text: string, i: number) => (
                        <li key={i} className="flex gap-2"><span className="text-[#06C755]">&#10003;</span>{text}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-400 mt-4">{m.pricing.line.extra}</p>
                  </div>
                </div>
                <div className="text-center mt-8">
                  <LineButton size="sm">{m.pricing.line.cta}</LineButton>
                  <p className="mt-3 text-sm text-gray-400">{m.pricing.line.cancel}</p>
                </div>
              </div>
            }
            slackContent={
              <div>
                <div className="max-w-md mx-auto">
                  <div className="bg-white rounded-2xl p-8 border border-[#4A154B]/30 shadow-sm text-center">
                    <p className="text-[#4A154B] font-medium text-sm mb-1">{m.pricing.slack.label}</p>
                    <p className="text-4xl font-bold text-gray-800 mb-1">{m.pricing.slack.price}<span className="text-base font-normal text-gray-500"> {m.pricing.slack.period}</span></p>
                    <p className="text-gray-500 text-sm mb-6">{m.pricing.slack.desc}</p>
                    <ul className="space-y-2 text-base text-gray-600 text-left">
                      {(m.pricing.slack.features as string[]).map((text: string, i: number) => (
                        <li key={i} className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>{text}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-400 mt-4">{m.pricing.slack.extra}</p>
                  </div>
                </div>
                <div className="text-center mt-8">
                  <SlackButton size="sm">{m.pricing.slack.cta}</SlackButton>
                  <p className="mt-3 text-sm text-gray-400">{m.pricing.slack.cancel}</p>
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* ── 10. よくある質問 ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            {m.faq.title}
          </h2>

          <div className="space-y-6">
            {(m.faq.items as any[]).map((item: any, i: number) => (
              <div key={i} className="border-b border-gray-200 pb-6">
                <p className="font-medium text-gray-800 mb-2">{item.q}</p>
                <p className="text-gray-500 text-base leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. CTA ── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F0] via-white to-[#EBF2FA]" />
        <div className="absolute top-10 -right-20 w-60 h-60 bg-teal-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/umeko-logo.png" alt={m.nav.brand} className="w-16 h-16 rounded-2xl shadow-md mx-auto mb-6" />

          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {m.cta.title_1}
            <br />
            {m.cta.title_2}
          </h2>

          <p className="text-gray-500 text-base leading-relaxed mb-10">
            {m.cta.desc}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <LineButton>{m.cta.lineBtn}</LineButton>
            <SlackButton>{m.cta.slackBtn}</SlackButton>
          </div>
          <p className="mt-3 text-sm text-gray-400">
            {m.cta.free}
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://qr-official.line.me/gs/M_031xyrtk_GW.png?oat_content=qr"
            alt="LINE QR"
            className="w-28 h-28 mx-auto mt-8 rounded-xl"
          />
          <p className="mt-2 text-xs text-gray-400">{m.cta.qr}</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/umeko-logo.png" alt={m.nav.brand} className="w-6 h-6 rounded-full" />
            <span className="text-sm font-semibold text-gray-700">{m.nav.brand}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <a href="https://cfac.co.jp" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition">{m.footer.company}</a>
            <span>{m.footer.copyright}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
