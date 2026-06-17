import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Timbremap — the sound compass for music & gear",
    template: "%s · Timbremap",
  },
  description:
    "Vote on where albums, songs, and audio gear sit on a two-axis sound compass: treble↔bass and technical↔atmospheric. See the community consensus and find items that sound alike.",
  openGraph: {
    siteName: "Timbremap",
    type: "website",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col md:h-screen md:overflow-hidden">
        {children}
      </body>
    </html>
  );
}
