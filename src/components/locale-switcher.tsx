"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const localeLabels: Record<string, string> = {
  ja: "JA",
  en: "EN",
  "zh-TW": "繁中",
  th: "TH",
};

const localeNames: Record<string, string> = {
  ja: "日本語",
  en: "English",
  "zh-TW": "繁體中文",
  th: "ไทย",
};

const locales = ["ja", "en", "zh-TW", "th"];

export function LocaleSwitcher({ current }: { current: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchTo(locale: string) {
    // Replace current locale prefix in pathname
    const newPath = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, `/${locale}`);
    window.location.href = newPath;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Switch language"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {localeLabels[current] || current}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[130px] z-50">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => {
                setOpen(false);
                if (locale !== current) switchTo(locale);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                locale === current ? "text-teal-600 font-medium" : "text-gray-700"
              }`}
            >
              {localeNames[locale]}
              {locale === current && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
