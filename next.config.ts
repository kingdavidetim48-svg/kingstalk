import type { NextConfig } from "next";

// ─── Content Security Policy ──────────────────────────────────────────────────
//
// Constructed specifically for KingsTalk's actual third-party dependencies.
// Do NOT copy-paste generic CSP directives here; verify each source against
// the integrations actually used by this application.
//
// Sources covered:
//   - Clerk:      *.clerk.accounts.dev, *.clerk.com, clerk.kingstalk.com (auth JS + iframe)
//   - R2/CF:      *.r2.cloudflarestorage.com (audio playback after signed-URL redirect)
//   - Modal:      CHATTERBOX_API_URL (internal server→server only; not a browser src)
//   - Dicebear:   api.dicebear.com (avatar SVGs generated server-side as data URIs)
//   - Google Fonts: fonts.googleapis.com, fonts.gstatic.com
//   - Web Push:   self (service worker)
//   - Vercel/dev: vercel.live (preview deployments only)
//
// 'unsafe-inline' for style-src is required by Tailwind CSS v4 (runtime CSS-in-JS).
// 'unsafe-eval' is NOT included — remove if build confirms it is not needed.
//
// To tighten further in production, add a nonce via middleware and remove 'unsafe-inline'.

const isDev = process.env.NODE_ENV === "development";

const ContentSecurityPolicy = [
  // Fetch directives
  `default-src 'self'`,

  // Scripts: Clerk SDKs, self
  // Note: Clerk's hosted JS is loaded from their CDN
  `script-src 'self' https://clerk.kingstalk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,

  // Styles: self + inline for Tailwind CSS v4 runtime, Google Fonts
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

  // Fonts: Google Fonts CDN
  `font-src 'self' https://fonts.gstatic.com`,

  // Images: self, Clerk user avatars (img.clerk.com), Dicebear avatars, data URIs, R2
  `img-src 'self' data: blob: https://img.clerk.com https://api.dicebear.com https://*.r2.cloudflarestorage.com`,

  // Media (audio): self + R2 signed URLs (after 302 redirect from /api/audio/[id])
  `media-src 'self' https://*.r2.cloudflarestorage.com`,

  // Connect: tRPC + Clerk API + Clerk websocket
  `connect-src 'self' https://clerk.kingstalk.com https://*.clerk.accounts.dev https://api.clerk.com wss://*.clerk.accounts.dev${isDev ? " ws://localhost:*" : ""}`,

  // Frames: Clerk auth UI embeds
  `frame-src https://clerk.kingstalk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com`,

  // Workers: service worker for Web Push (same-origin only)
  `worker-src 'self'`,

  // Manifest: PWA manifest
  `manifest-src 'self'`,

  // Base URI: restrict to self
  `base-uri 'self'`,

  // Form actions: self only
  `form-action 'self'`,

  // Block embedding of the app in external frames (belt-and-suspenders with X-Frame-Options)
  `frame-ancestors 'none'`,

  // Block mixed content
  `upgrade-insecure-requests`,
]
  .join("; ")
  .trim();

// ─── Security Headers ─────────────────────────────────────────────────────────

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    // Force HTTPS for 2 years, include subdomains
    // Only effective once served over HTTPS — safe to include in all envs
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Prevent MIME sniffing
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Deny framing — belt-and-suspenders alongside CSP frame-ancestors
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Referrer: send origin only on same-origin, nothing on cross-origin
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Restrict browser feature access — KingsTalk does NOT use geolocation,
    // payment APIs, USB, Bluetooth, etc.
    // Microphone IS required for voice cloning — keep it self-only.
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "geolocation=()",
      "microphone=(self)",
      "payment=()",
      "usb=()",
      "bluetooth=()",
      "display-capture=()",
    ].join(", "),
  },
  {
    // Prevent browsers from automatically detecting cross-site scripting
    // (legacy header, most modern browsers use CSP instead)
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    // Tell browsers not to send the DNS prefetch for privacy
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

// ─── Next.js Config ───────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

