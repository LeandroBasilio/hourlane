import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";
import "./globals.css";

export const dynamic = "force-dynamic";

const isPublic = process.env.SITE_LAUNCH_READY === "true";

export const metadata: Metadata = {
  title: {
    default: "Hourlane — Weniger Büroarbeit. Klarere Abläufe.",
    template: "%s | Hourlane",
  },
  description:
    "KI-Automatisierung für Sanitär-, Heizungs- und Klimabetriebe. Anfragen ordnen, Rückrufe koordinieren und Angebote im Blick behalten. Gemeinsam mit Ihrem Team.",
  robots: { index: isPublic, follow: isPublic },
  openGraph: {
    title: "Hourlane — Mehr Zeit fürs Wesentliche.",
    description:
      "Klare Abläufe für Ihr Büro. Automatisierung für Sanitär-, Heizungs- und Klimabetriebe.",
    locale: "de_DE",
    type: "website",
    siteName: "Hourlane",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <a className="skip-link" href="#main">
          Zum Inhalt springen
        </a>
        {children}
      </body>
    </html>
  );
}
