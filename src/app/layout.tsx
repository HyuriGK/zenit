import { SessionProvider } from '@/components/providers/SessionProvider';
import { IntlProvider } from '@/components/providers/IntlProvider';
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zênit - Gerenciamento Pessoal",
  description: "Sistema completo de gerenciamento pessoal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zênit",
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.ico', sizes: '64x64' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/images/logo-com-fundo.png', sizes: '180x180' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <IntlProvider initialMessages={messages}>
            {children}
          </IntlProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}