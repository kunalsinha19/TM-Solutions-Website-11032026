const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.taramaasolutions.com";
const SITE_NAME = "Tara Maa Solutions";
const DEFAULT_TITLE = "Industrial Products and Quote-Driven B2B Website";
const DEFAULT_DESCRIPTION = "Tara Maa Solutions helps businesses discover industrial products, explore categories, and submit quote requests through a modern B2B website experience.";
const DEFAULT_OG_IMAGE = "/og-image.svg";
const DEFAULT_LOGO = "/logo.svg";

function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

function buildMetadata({ title, description, path = "/", image = DEFAULT_OG_IMAGE } = {}) {
  const resolvedTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | ${DEFAULT_TITLE}`;
  const resolvedDescription = description || DEFAULT_DESCRIPTION;
  const resolvedUrl = absoluteUrl(path);
  const resolvedImage = image ? absoluteUrl(image) : null;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: resolvedUrl
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: resolvedUrl,
      siteName: SITE_NAME,
      type: "website",
      ...(resolvedImage
        ? {
            images: [
              {
                url: resolvedImage,
                width: 1200,
                height: 630,
                alt: SITE_NAME
              }
            ]
          }
        : {})
    },
    twitter: {
      card: resolvedImage ? "summary_large_image" : "summary",
      title: resolvedTitle,
      description: resolvedDescription,
      ...(resolvedImage ? { images: [resolvedImage] } : {})
    }
  };
}

function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(DEFAULT_LOGO),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    email: "sales@taramaasolutions.com",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: "sales@taramaasolutions.com",
        availableLanguage: "en"
      }
    ]
  };
}

function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

module.exports = {
  SITE_NAME,
  SITE_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  DEFAULT_OG_IMAGE,
  DEFAULT_LOGO,
  absoluteUrl,
  buildMetadata,
  buildOrganizationSchema,
  buildWebsiteSchema
};
