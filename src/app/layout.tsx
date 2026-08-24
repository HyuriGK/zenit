import { SessionProvider } from '@/components/providers/SessionProvider';
import { InactivityTracker } from '@/components/auth/InactivityTracker';
import { IntlProvider } from '@/components/providers/IntlProvider';
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, VT323 } from "next/font/google";
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

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Azimov - Gerenciamento Pessoal",
  description: "Sistema completo de gerenciamento pessoal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Azimov",
  },
  icons: {
    icon: [
      { url: '/images/logo-com-fundo.png', type: 'image/png' },
    ],
    shortcut: '/images/logo-com-fundo.png',
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
        className={`${geistSans.variable} ${geistMono.variable} ${vt323.variable} antialiased`}
      >
        <SessionProvider>
          <InactivityTracker />
          <IntlProvider initialMessages={messages}>
            {children}
          </IntlProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
