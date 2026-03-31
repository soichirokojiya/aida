import { NextRequest, NextResponse } from "next/server";

const locales = ["ja", "en", "zh-TW", "th"];
const defaultLocale = "ja";

// Simple in-memory rate limiter (resets on cold start, but sufficient for burst protection)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

function getPreferredLocale(request: NextRequest): string {
  const accept = request.headers.get("accept-language");
  if (!accept) return defaultLocale;

  // Parse Accept-Language header
  const langs = accept.split(",").map((part) => {
    const [lang, q] = part.trim().split(";q=");
    return { lang: lang.trim(), q: q ? parseFloat(q) : 1 };
  }).sort((a, b) => b.q - a.q);

  for (const { lang } of langs) {
    // Exact match
    if (locales.includes(lang)) return lang;
    // zh-TW, zh-Hant → zh-TW
    if (lang.startsWith("zh-TW") || lang.startsWith("zh-Hant")) return "zh-TW";
    // zh (simplified) → not matched, fall through
    if (lang === "th" || lang.startsWith("th-")) return "th";
    if (lang === "en" || lang.startsWith("en-")) return "en";
    if (lang === "ja" || lang.startsWith("ja-")) return "ja";
  }

  return defaultLocale;
}

function pathnameHasLocale(pathname: string): boolean {
  return locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip locale routing for API, admin, billing, static assets
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") // static files (images, css, js, etc.)
  ) {
    // Protect /admin and /api/admin routes with Basic Auth
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      const authHeader = request.headers.get("authorization");

      if (!authHeader || !authHeader.startsWith("Basic ")) {
        return new NextResponse("Authentication required", {
          status: 401,
          headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
        });
      }

      const credentials = Buffer.from(authHeader.split(" ")[1], "base64").toString();
      const [user, pass] = credentials.split(":");

      const adminUser = process.env.ADMIN_USER || "admin";
      const adminPass = process.env.ADMIN_PASSWORD;

      if (!adminPass || user !== adminUser || pass !== adminPass) {
        return new NextResponse("Invalid credentials", {
          status: 401,
          headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
        });
      }
    }

    // Rate limit webhook endpoints (60 requests per minute per IP)
    if (pathname.startsWith("/api/webhook")) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      if (isRateLimited(`webhook:${ip}`, 60, 60_000)) {
        return new NextResponse("Too many requests", { status: 429 });
      }
    }

    return NextResponse.next();
  }

  // If pathname already has a locale, continue
  if (pathnameHasLocale(pathname)) {
    return NextResponse.next();
  }

  // Redirect root and unknown paths to preferred locale
  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Match all paths except _next/static, _next/image, favicon
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
