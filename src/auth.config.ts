import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
    providers: [
        // O CredentialsProvider será definido aqui sem a lógica de DB para o Middleware
        // No src/auth.ts ele será estendido com a lógica real
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Senha", type: "password" },
            },
            async authorize() {
                return null // Placeholder, será sobrescrito em src/auth.ts
            }
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token?.sub && session.user) {
                session.user.id = token.sub
            }
            if (token?.plano && session.user) {
                (session.user as any).plano = token.plano
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id
                token.plano = (user as any).plano
            }
            return token
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLogged = !!auth?.user
            const isAuthRoute = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')
            const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname === '/'

            if (isAuthRoute) {
                if (isLogged) {
                    return Response.redirect(new URL('/dashboard', nextUrl))
                }
                return true // Permite acesso a não logados
            }

            if (isDashboardRoute) {
                if (isLogged) return true
                return false // Redireciona para SignIn se não logado
            }

            return true
        }
    },
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
