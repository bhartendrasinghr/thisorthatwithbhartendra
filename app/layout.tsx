import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"]
});

export const metadata: Metadata = {
  title: "This or That with Bhartendra — Beyond the noise",
  description:
    "A podcast that strips away the spin. Two choices, one honest conversation, hosted by Bhartendra Singh.",
  openGraph: {
    title: "This or That with Bhartendra",
    description: "Beyond the noise — a podcast hosted by Bhartendra Singh.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "This or That with Bhartendra",
    description: "Beyond the noise — a podcast hosted by Bhartendra Singh."
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans bg-ink-900 text-ink-50 antialiased">
        {children}
      </body>
    </html>
  );
}
