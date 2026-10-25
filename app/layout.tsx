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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
