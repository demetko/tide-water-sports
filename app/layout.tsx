import type { Metadata } from "next";
import "./globals.css";
import { I18n } from '@/lib/i18n';
import { Header, Footer } from '@/components/site-shell';

export const metadata: Metadata = {
  title: "Tide — Your time on the water",
  description: "Book jet skis, parasailing and yacht charters on Bulgaria’s Black Sea coast.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><I18n><Header/>{children}<Footer/></I18n></body>
    </html>
  );
}
