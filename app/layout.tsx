import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });
const cond = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-cond" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Sekepal — takaran makan pakai tangan",
  description:
    "Hitung kebutuhan kalori & protein harian, lalu terjemahkan jadi kepal nasi, telapak lauk, dan ibu jari minyak. Tanpa timbangan.",
  applicationName: "Sekepal",
  appleWebApp: { capable: true, title: "Sekepal", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#F3EEE3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sans.variable} ${cond.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
