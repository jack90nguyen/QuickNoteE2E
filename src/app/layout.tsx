import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";

const spaceMono = Space_Mono({ 
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ["latin"],
  variable: '--font-space-mono',
});

export const metadata: Metadata = {
  title: "Note E2E",
  description: "Secure markdown notes with E2E encryption",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Note E2E",
  },
  icons: {
    icon: "/favicon-256.png",
    apple: "/favicon-256.png",
  },
  openGraph: {
    title: "Note E2E",
    description: "Secure markdown notes with E2E encryption",
    images: [{ url: "/cover.jpg" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Note E2E",
    description: "Secure markdown notes with E2E encryption",
    images: ["/cover.jpg"],
  },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceMono.className} ${spaceMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}