import { Link } from "react-router";

/** Compact legal links on auth pages. */
const AuthLegalFooter = () => (
  <footer className="mt-6 text-center text-xs opacity-60" role="contentinfo">
    <nav aria-label="Legal">
      <Link to="/privacy" className="hover:text-primary hover:underline">
        Privacy
      </Link>
      <span className="mx-2" aria-hidden="true">
        ·
      </span>
      <Link to="/terms" className="hover:text-primary hover:underline">
        Terms
      </Link>
      <span className="mx-2" aria-hidden="true">
        ·
      </span>
      <Link to="/" className="hover:text-primary hover:underline">
        Home
      </Link>
    </nav>
  </footer>
);

export default AuthLegalFooter;
