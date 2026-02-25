'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState } from 'react';
import ptMessages from '@/i18n/locales/pt.json';
import enMessages from '@/i18n/locales/en.json';

type Messages = Record<string, any>;

const messagesMap: Record<string, Messages> = {
  pt: ptMessages,
  en: enMessages,
};

export function IntlProvider({
  children,
  initialMessages
}: {
  children: React.ReactNode;
  initialMessages: Messages;
}) {
  const [messages, setMessages] = useState<Messages>(initialMessages);
  const [locale, setLocale] = useState<string>('pt');

  useEffect(() => {
    // Carregar idioma do localStorage/cookie
    const savedLocale = localStorage.getItem('locale') || 'pt';
    setLocale(savedLocale);

    // Carregar mensagens correspondentes
    const newMessages = messagesMap[savedLocale] || ptMessages;
    setMessages(newMessages);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
