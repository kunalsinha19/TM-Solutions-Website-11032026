import "./globals.css";
import ToolsDock from "../components/ToolsDock";
import SiteHeader from "../components/SiteHeader";
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION } from "../lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Industrial Products and Quote-Driven B2B Website`,
    template: `%s | ${SITE_NAME}`
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "industrial products",
    "B2B products",
    "quote request",
    "product categories",
    "tara maa solutions"
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icon-512.svg", type: "image/svg+xml", sizes: "512x512" }
    ],
    apple: [
      { url: "/apple-touch-icon.svg", type: "image/svg+xml", sizes: "180x180" }
    ],
    shortcut: ["/favicon.svg"]
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

const themeScript = `
(function () {
  try {
    const storageKey = "tara-maa-theme";
    const savedTheme = window.localStorage.getItem(storageKey);
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolvedTheme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : systemDark
        ? "dark"
        : "light";
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  } catch (error) {
    document.documentElement.classList.remove("dark");
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-siteBg text-siteText transition-colors duration-300">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SiteHeader />
        <ToolsDock />
        {children}
      </body>
    </html>
  );
}
