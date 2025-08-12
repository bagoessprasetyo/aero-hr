import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import { HeaderWrapper } from "@/components/layout/header-wrapper";

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

export const metadata: Metadata = {
  title: "Aero HR - Payroll Management System",
  description: "Indonesian HR and payroll management system with PPh 21 and BPJS compliance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <HeaderWrapper />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
