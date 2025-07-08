import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "./auth/Provider";
import PageFooter from "./PageComponents/PageFooter";
import { Toaster } from "sonner";
import { OnboardingModal } from "./GeneralComponents/Onboarding/OnboardingModal";
import Navbar from "./navbar/navbar";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Together",
    template: "%s | Together",
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
    siteName: "Together",
    title: {
      default: "Together | Make a change in the US 1 person at a time.",
      template: "%s | Together",
    },
    description: "Comprehensive directory and data about the U.S. Congress",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Together | Make a change in the US 1 person at a time.",
      template: "%s | Together",
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
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${openSans.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar>
              <main className="container mx-auto space-x-4 ">
                {children}
                <PageFooter />
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
