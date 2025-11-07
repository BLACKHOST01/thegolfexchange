import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { Toaster } from "react-hot-toast";
import { ReactNode } from "react";
import CookieConsent from "@/app/components/CookieConsent";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Golf Exchange",
  description: "Your hub for premium golf equipment and news.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <ClientLayout>{children}</ClientLayout>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <CookieConsent />
      </body>
    </html>
  );
}
