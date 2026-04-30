import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppConvexProvider } from "@/components/convex-provider";
import { appBranding } from "@/lib/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: appBranding.name,
  description: "Internal marketing command center for campaign planning, approvals, agents, integrations, and learning.",
};

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppConvexProvider>{children}</AppConvexProvider>
      </body>
    </html>
  );
}
