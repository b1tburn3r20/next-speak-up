import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "./auth/provider";
import { Toaster } from "sonner";
import Navbar from "./navbar/navbar";
import { Instrument_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import Modals from "@/components/cb/modals";
import { TopProgressBar } from "@/components/app/top-progress-bar";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { THEME_VALUES } from "@/components/app/theme-values";

const InstrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-geist' });

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
    <html lang="en" suppressHydrationWarning className={cn("font-geist", InstrumentSans.variable)}>
      <body
        suppressHydrationWarning
        className={`bg-background-dark font-semibold text-lg antialiased`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={THEME_VALUES}
          >
            <TopProgressBar />
            <Navbar>
              <main className="">
                {children}
              </main>
            </Navbar>
            <Toaster />
            <OnboardingGate />
          </ThemeProvider>
          <Modals />
        </AuthProvider>
      </body>
    </html>
  );
}
