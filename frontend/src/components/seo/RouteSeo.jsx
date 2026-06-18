import { useLocation } from "react-router";
import { getSeoForPath, isNoIndexPath } from "../../config/seo.config";
import Seo from "./Seo";

/** Applies route-aware SEO metadata on every navigation. */
const RouteSeo = () => {
  const { pathname } = useLocation();
  const seo = getSeoForPath(pathname);
  const noindex = seo.noindex ?? isNoIndexPath(pathname);

  return (
    <Seo
      title={seo.title}
      description={seo.description}
      keywords={seo.keywords}
      pathname={pathname}
      ogType={seo.ogType}
      noindex={noindex}
      jsonLd={noindex ? undefined : seo.jsonLd}
    />
  );
};

export default RouteSeo;
