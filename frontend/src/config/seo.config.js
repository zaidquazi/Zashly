/** Site-wide SEO configuration — override VITE_SITE_URL in production. */
export const SITE_NAME = "Zashly";
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://zashly.com"
).replace(/\/$/, "");

export const DEFAULT_OG_IMAGE = `${SITE_URL}/icon.png`;
export const TWITTER_HANDLE = "@zashly";

export const DEFAULT_SEO = {
  title: `${SITE_NAME} — Real-Time Secure Messaging & AI Chat`,
  description:
    "Zashly is a modern real-time chat and messaging app with end-to-end style security, group chats, and smart AI-assisted conversations.",
  keywords:
    "real-time chat, messaging app, secure communication, AI chat, group messaging, instant messaging, Zashly",
  ogType: "website",
};

/** Paths that must not be indexed (authenticated / private app surfaces). */
export const NOINDEX_PATH_PREFIXES = [
  "/app",
  "/friends",
  "/groups",
  "/chat",
  "/group",
  "/admin",
  "/settings",
  "/notifications",
  "/onboarding",
  "/edit-profile",
];

export const PUBLIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/features", changefreq: "monthly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/login", changefreq: "monthly", priority: "0.7" },
  { path: "/signup", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy", changefreq: "yearly", priority: "0.5" },
  { path: "/terms", changefreq: "yearly", priority: "0.5" },
];

/** Per-route SEO metadata (pathname → meta). */
export const ROUTE_SEO = {
  "/": {
    title: "Zashly — Real-Time Chat, Secure Messaging & AI Conversations",
    description:
      "Connect instantly with Zashly: a fast, secure real-time messaging app featuring group chats, moments, and AI-powered communication for teams and friends.",
    keywords:
      "real-time chat app, secure messaging, AI chat, instant messaging, group chat, private messaging, Zashly",
    jsonLd: "landing",
  },
  "/features": {
    title: "Features — Real-Time Messaging & Secure Chat | Zashly",
    description:
      "Explore Zashly features: end-to-end style security, real-time messaging, group channels, moments, notifications, and admin moderation tools.",
    keywords:
      "chat features, group messaging, secure chat features, real-time messaging features",
    jsonLd: "webpage",
  },
  "/about": {
    title: "About Zashly — Our Mission for Secure Real-Time Communication",
    description:
      "Learn about Zashly's mission to make secure, delightful real-time communication accessible — built for privacy-conscious users, communities, and modern teams.",
    keywords: "about Zashly, secure messaging company, real-time chat platform",
    jsonLd: "organization",
  },
  "/privacy": {
    title: "Privacy Policy | Zashly",
    description:
      "Read how Zashly collects, uses, and protects your data. Our privacy policy explains cookies, account data, messaging content, and your rights.",
    keywords: "Zashly privacy policy, data protection, messaging privacy",
    jsonLd: "webpage",
  },
  "/terms": {
    title: "Terms & Conditions | Zashly",
    description:
      "Zashly Terms & Conditions — acceptable use, account responsibilities, service availability, and legal terms for using our messaging platform.",
    keywords: "Zashly terms of service, terms and conditions, user agreement",
    jsonLd: "webpage",
  },
  "/login": {
    title: "Sign In | Zashly — Secure Real-Time Messaging",
    description:
      "Sign in to your Zashly account to access real-time chats, groups, and secure messaging.",
    keywords: "Zashly login, sign in, secure chat login",
    jsonLd: "webpage",
  },
  "/signup": {
    title: "Create Account | Zashly — Join Free Real-Time Chat",
    description:
      "Create your free Zashly account and start messaging in real time with friends and groups. Secure signup with email verification.",
    keywords: "Zashly signup, create account, free messaging app",
    jsonLd: "webpage",
  },
  "/app": {
    title: "Home | Zashly",
    description: "Your Zashly home — recent chats, moments, and friends.",
    noindex: true,
  },
  "/friends": {
    title: "Friends | Zashly",
    description: "Manage your friends and connections on Zashly.",
    noindex: true,
  },
  "/groups": {
    title: "Groups | Zashly",
    description: "Your group conversations on Zashly.",
    noindex: true,
  },

  "/notifications": {
    title: "Notifications | Zashly",
    description: "Your Zashly notifications.",
    noindex: true,
  },
  "/settings": {
    title: "Settings | Zashly",
    description: "Account and app settings.",
    noindex: true,
  },
  "/onboarding": {
    title: "Complete Your Profile | Zashly",
    description: "Finish setting up your Zashly profile.",
    noindex: true,
  },
  "/edit-profile": {
    title: "Edit Profile | Zashly",
    description: "Update your Zashly profile.",
    noindex: true,
  },
  "/admin": {
    title: "Admin | Zashly",
    description: "Zashly administration panel.",
    noindex: true,
  },
};

export function isNoIndexPath(pathname) {
  return NOINDEX_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getSeoForPath(pathname) {
  const exact = ROUTE_SEO[pathname];
  if (exact) return { ...DEFAULT_SEO, ...exact, pathname };

  if (pathname.startsWith("/chat/")) {
    return {
      ...DEFAULT_SEO,
      title: "Chat | Zashly",
      description: "Private conversation on Zashly.",
      noindex: true,
      pathname,
    };
  }
  if (pathname.startsWith("/group/")) {
    return {
      ...DEFAULT_SEO,
      title: "Group Chat | Zashly",
      description: "Private group conversation on Zashly.",
      noindex: true,
      pathname,
    };
  }


  if (isNoIndexPath(pathname)) {
    return { ...DEFAULT_SEO, title: `${SITE_NAME}`, noindex: true, pathname };
  }

  return { ...DEFAULT_SEO, pathname };
}

export function buildCanonicalUrl(pathname) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  return `${SITE_URL}${path}`;
}
