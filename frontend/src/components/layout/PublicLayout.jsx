import PublicHeader from "./PublicHeader";
import SiteFooter from "./SiteFooter";

/** Marketing / legal page shell with semantic structure and skip link. */
const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col" data-theme="light">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] btn btn-primary btn-sm"
    >
      Skip to main content
    </a>
    <PublicHeader />
    <main id="main-content" className="flex-1" role="main">
      {children}
    </main>
    <SiteFooter />
  </div>
);

export default PublicLayout;
