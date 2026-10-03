import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const SITE = "https://pcbuilder237.vercel.app";
const TITRE = "PC Builder 237 : comparez les prix des PC à Yaoundé et Douala";
const DESCRIPTION =
  "Prix constatés en boutique par des agents, avec preuves photo. Neuf, reconditionné et occasion.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITRE, template: "%s | PC Builder 237" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "fr_CM",
    siteName: "PC Builder 237",
    title: TITRE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary", title: TITRE, description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="entete">
          <Link href="/" className="entete-nom">
            PC Builder 237
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
