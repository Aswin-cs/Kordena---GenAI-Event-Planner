import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kordena | GenAI Event Planner",
  description: "Serene, balanced, and focused intelligent event planning powered by generative AI.",
  keywords: "event planner, AI event planner, GenAI events, wedding planner, conference planning, party planner",
  icons: {
    icon: "/favicon.ico",
  },
};

import AuthProvider from "./components/AuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F4F7F5] text-[#2D3748] antialiased selection:bg-[#10B981]/20 selection:text-[#10B981]">
        {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.4.1) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#10B981] focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#059669] font-bold text-xs"
        >
          Skip to main content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
