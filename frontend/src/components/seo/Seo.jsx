import { Helmet } from "react-helmet-async";
import {
  SITE_NAME,
  TWITTER_HANDLE,
  DEFAULT_OG_IMAGE,
  buildCanonicalUrl,
} from "../../config/seo.config";
import JsonLd from "./JsonLd";

/**
 * Document head manager — titles, meta, canonical, OG/Twitter, robots.
 */
const Seo = ({
  title,
  description,
  keywords,
  pathname = "/",
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noindex = false,
  jsonLd,
}) => {
  const canonicalUrl = canonical || buildCanonicalUrl(pathname);
  const fullTitle =
    title?.includes(SITE_NAME) || title?.includes("|")
      ? title
      : `${title} | ${SITE_NAME}`;

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}
        <link rel="canonical" href={canonicalUrl} />

        {noindex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow, max-image-preview:large" />
        )}

        {/* Open Graph */}
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content={ogType} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={`${SITE_NAME} — secure real-time messaging`} />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={TWITTER_HANDLE} />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        {pathname === "/" && !noindex && (
          <link rel="preload" as="image" href="/i.png" fetchPriority="high" />
        )}
      </Helmet>
      {jsonLd && <JsonLd type={jsonLd} pathname={pathname} />}
    </>
  );
};

export default Seo;
