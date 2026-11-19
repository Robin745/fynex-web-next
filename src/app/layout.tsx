import type { Metadata } from "next";
import "./globals.css";
import { NavigationProgressBar } from "@/components/NavigationProgressBar";

export const metadata: Metadata = {
  title: {
    default: "FYNEX | Business Operations",
    template: "%s | FYNEX Business Operations",
  },
  description: "FYNEX - Multi-Client Business Operations, Financial Calculations, and Profit Intelligence.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <NavigationProgressBar />
        {children}
      </body>
    </html>
  );
}
