import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "./auth/Provider";
import PageFooter from "./PageComponents/PageFooter";
import { Toaster } from "sonner";
import { OnboardingModal } from "./GeneralComponents/Onboarding/OnboardingModal";
import Navbar from "./navbar/navbar";
import { Open_Sans, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body
        suppressHydrationWarning
        className={`${openSans.variable} bg-background-dark font-semibold text-lg antialiased`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar>
              <main className="">
                {children}
              </main>
            </Navbar>
            <Toaster />
            {/* <OnboardingModal /> */}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
