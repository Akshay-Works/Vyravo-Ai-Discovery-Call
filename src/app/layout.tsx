import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppHeader, AppFooter } from "@/components/AppHeader";

export const metadata: Metadata = {
  title: {
    default: "Book a Free Discovery Call | Vyravo AI",
    template: "%s | Vyravo AI",
  },
  description:
    "Schedule a free 30-minute AI automation consultation with Vyravo AI. Get AI-powered lead qualification, personalized recommendations, and a custom proposal.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Vyravo AI",
    title: "Book a Free Discovery Call | Vyravo AI",
    description:
      "Complete the AI qualification form, get personalized automation recommendations, and book your free discovery call.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-white antialiased font-[var(--font-body)]">
        <AppHeader />
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
