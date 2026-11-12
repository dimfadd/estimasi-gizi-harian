import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Sekepal — takaran makan pakai tangan",
  description:
    "Hitung kebutuhan kalori & protein harian, lalu terjemahkan jadi kepal nasi, telapak lauk, dan ibu jari minyak. Tanpa timbangan.",
  applicationName: "Sekepal",
  appleWebApp: { capable: true, title: "Sekepal", statusBarStyle: "black-translucent" },
  icons: { apple: "/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0C0A09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
