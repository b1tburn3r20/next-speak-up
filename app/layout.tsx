import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./auth/provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "./navbar/navbar";
import { Nunito } from "next/font/google";
import Modals from "@/components/cb/modals";
import { TopProgressBar } from "@/components/app/top-progress-bar";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { SiteFooter } from "@/components/app/site-footer";
import { RewardToast } from "@/components/civic/progress-strip";
import { GlossaryProvider } from "@/components/glossary/glossary-provider";
import { getGlossaryRows } from "@/lib/glossary/glossary";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: {
    default: "Coolbills",
    template: "%s | Coolbills",
  },

  description:
    "Browse and search through comprehensive data about the U.S. Congress",
  keywords: [
    "Congress",
    "Politics",
    "Government",
    "Representatives",
    "Senators",
  ],
  metadataBase: new URL("https://yoursite.com"),
  // Added to an iPhone's home screen, it opens like an app, which is where iOS allows notifications.
  appleWebApp: { capable: true, title: "Coolbills", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Coolbills",
    title: {
      default: "Coolbills | Make a change in the US 1 person at a time.",
      template: "%s | Coolbills",
    },
    description: "Comprehensive directory and data about the U.S. Congress",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Coolbills | Make a change in the US 1 person at a time.",
      template: "%s | Coolbills",
    },
    description: "Comprehensive directory and data about the U.S. Congress",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={nunito.variable}>
      <body
        suppressHydrationWarning
      >
        <ThemeProvider>
        <AuthProvider>
                      <TopProgressBar />
            {/* The glossary, cached for a week on the server, so summaries can explain their words. */}
            <GlossaryProvider rows={await getGlossaryRows()}>
            <Navbar>
              <main className="">
                {children}
              </main>
              <SiteFooter />
            </Navbar>
            </GlossaryProvider>
            <Toaster />
            <RewardToast />
            <OnboardingGate />
          <Modals />
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
