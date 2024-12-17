import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import AuthProvider from "./auth/Provider";
import PageFooter from "./PageComponents/PageFooter";

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
    default: "Congress Directory | YourSiteName",
    template: "%s | YourSiteName",
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
    siteName: "YourSiteName",
    title: {
      default: "Congress Directory",
      template: "%s | YourSiteName",
    },
    description: "Comprehensive directory and data about the U.S. Congress",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Congress Directory",
      template: "%s | YourSiteName",
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
    <html lang="en">
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
            <SidebarProvider>
              <AppSidebar />
              <main className="container mx-auto space-x-4">
                <SidebarTrigger />
                {children}
                <PageFooter />
              </main>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
