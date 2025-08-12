import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { ToastProvider } from "@/components/ui/toast";
import { KeyboardShortcutsProvider, SkipToMainContent } from "@/components/common/keyboard-shortcuts";

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
        <ToastProvider>
          <KeyboardShortcutsProvider>
            <SkipToMainContent />
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </KeyboardShortcutsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
