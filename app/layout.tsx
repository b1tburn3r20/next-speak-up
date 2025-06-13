import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "./auth/Provider";
import PageFooter from "./PageComponents/PageFooter";
import { Toaster } from "sonner";
import { OnboardingModal } from "./GeneralComponents/Onboarding/OnboardingModal";
import Navbar from "./navbar/navbar";

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
  title: {
    default: "Congress Directory | Speakup",
    template: "%s | Speakup",
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
    siteName: "Speakup",
    title: {
      default: "Congress Directory",
      template: "%s | Speakup",
    },
    description: "Comprehensive directory and data about the U.S. Congress",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Congress Directory",
      template: "%s | Speakup",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
            <OnboardingModal />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
