import type { NextAuthConfig } from '@/lib/auth-mock';

export const authOptions = {
  providers: [],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
    updateAge: 60 * 60, // Atualiza a sessão se for mais antiga que 1 hora
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ session }: { session: any }) {
      return session;
    },
    async jwt({ token }: { token: any }) {
      return token;
    }
  },
  secret: 'mock-offline-secret',
  trustHost: true,
} satisfies NextAuthConfig;