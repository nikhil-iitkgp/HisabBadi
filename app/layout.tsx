import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const metadataBase = new URL("https://hisabbadi.onrender.com");

export const metadata: Metadata = {
  metadataBase,
  title: "HisabBadi",
  description: "Modern receipt generator for mandi and grain traders",
  icons: {
    icon: [
      { url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [{ url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "HisabBadi",
    description: "Modern receipt generator for mandi and grain traders",
    images: [
      {
        url: "/high-resolution-color-logo.png",
        alt: "HisabBadi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HisabBadi",
    description: "Modern receipt generator for mandi and grain traders",
    images: ["/high-resolution-color-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
