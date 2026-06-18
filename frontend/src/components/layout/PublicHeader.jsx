import { Link, useLocation } from "react-router";
import { MenuIcon, LoaderPinwheel, XIcon } from "lucide-react";
import { useState } from "react";
import { SITE_NAME } from "../../config/seo.config";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "About", to: "/about" },
];

const PublicHeader = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-base-300/80 bg-base-100/90 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-24">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            aria-label={`${SITE_NAME} home`}
          >
            <LoaderPinwheel className="size-8 text-primary animate-spin-slow" aria-hidden="true" />
            <span className="text-xl sm:text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              {SITE_NAME}
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Main navigation"
          >
            {navItems.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`btn btn-ghost btn-sm ${
                  pathname === to ? "btn-active text-primary" : ""
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-square md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>

        {open && (
          <nav
            id="mobile-nav"
            className="md:hidden pb-4 flex flex-col gap-1 border-t border-base-300 pt-3"
            aria-label="Mobile navigation"
          >
            {navItems.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`btn btn-ghost justify-start ${
                  pathname === to ? "btn-active" : ""
                }`}
              >
                {label}
              </Link>
            ))}
            <Link to="/login" className="btn btn-ghost justify-start" onClick={() => setOpen(false)}>
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-primary" onClick={() => setOpen(false)}>
              Get Started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
