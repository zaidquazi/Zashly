import { Helmet } from "react-helmet-async";
import { SITE_NAME, SITE_URL, DEFAULT_SEO } from "../../config/seo.config";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description: DEFAULT_SEO.description,
  sameAs: [],
};

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "CommunicationApplication",
  operatingSystem: "Web, iOS, Android",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description: DEFAULT_SEO.description,
  featureList: [
    "Real-time messaging",
    "Group chats",
    "Voice and video calls",
    "Secure authentication",
    "Moments and media sharing",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_SEO.description,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/login`,
    },
    "query-input": "required name=search_term_string",
  },
};

const webPageSchema = (pathname) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: SITE_NAME,
  url: `${SITE_URL}${pathname === "/" ? "" : pathname}`,
  isPartOf: { "@type": "WebSite", url: SITE_URL, name: SITE_NAME },
});

const SCHEMA_BY_TYPE = {
  landing: [organizationSchema, webApplicationSchema, websiteSchema],
  organization: [organizationSchema, websiteSchema],
  webpage: (pathname) => [webPageSchema(pathname)],
};

const JsonLd = ({ type, pathname = "/" }) => {
  const factory = SCHEMA_BY_TYPE[type];
  if (!factory) return null;

  const schemas = typeof factory === "function" ? factory(pathname) : factory;

  return (
    <Helmet>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default JsonLd;
