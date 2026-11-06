import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./auth/provider";
import { Toaster } from "sonner";
import Navbar from "./navbar/navbar";
import { Nunito } from "next/font/google";
import Modals from "@/components/cb/modals";
import { TopProgressBar } from "@/components/app/top-progress-bar";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { SiteFooter } from "@/components/app/site-footer";
import { RewardToast } from "@/components/civic/progress-strip";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={nunito.variable}>
      <body
        suppressHydrationWarning
      >
        <AuthProvider>
                      <TopProgressBar />
            <Navbar>
              <main className="">
                {children}
              </main>
              <SiteFooter />
            </Navbar>
            <Toaster />
            <RewardToast />
            <OnboardingGate />
          <Modals />
        </AuthProvider>
      </body>
    </html>
  );
}
