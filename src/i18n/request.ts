import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, type Locale } from './routing';

export default getRequestConfig(async () => {
  // Tenta obter o locale dos cookies, senão usa o padrão
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || defaultLocale;

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
    timeZone: 'America/Sao_Paulo',
    now: new Date(),
    // Adicionar configuração de formato padrão
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }
      }
    }
  };
});
