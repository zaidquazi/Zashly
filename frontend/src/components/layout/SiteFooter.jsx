import { Link } from "react-router";
import { LoaderPinwheel } from "lucide-react";
import { SITE_NAME } from "../../config/seo.config";

const footerLinks = {
  Product: [
    { label: "Features", to: "/features" },
    { label: "About", to: "/about" },
    { label: "Sign Up", to: "/signup" },
    { label: "Sign In", to: "/login" },
  ],
  Legal: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms & Conditions", to: "/terms" },
  ],
};

const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-base-300 bg-base-200/80 mt-auto"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-24 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2 space-y-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
              aria-label={`${SITE_NAME} home`}
            >
              <LoaderPinwheel className="size-8 text-primary animate-spin-slow" aria-hidden="true" />
              <span className="text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                {SITE_NAME}
              </span>
            </Link>
            <p className="text-sm opacity-70 max-w-md leading-relaxed">
              Secure real-time messaging, voice &amp; video calls, and AI-ready chat — built for
              modern teams and communities who value privacy and speed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-2">
            {Object.entries(footerLinks).map(([section, links]) => (
              <nav key={section} aria-label={`${section} links`}>
                <h2 className="font-semibold text-sm uppercase tracking-wide mb-3 opacity-80">
                  {section}
                </h2>
                <ul className="space-y-2">
                  {links.map(({ label, to }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="text-sm opacity-70 hover:opacity-100 hover:text-primary transition-colors focus:outline-none focus-visible:underline"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-base-300 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs opacity-60">
          <p>
            © {year} {SITE_NAME}. All rights reserved.
          </p>
          <p>Secure messaging · Real-time chat · Built for the web</p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
