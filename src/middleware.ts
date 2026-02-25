import { authConfig } from "@/auth.config"
import NextAuth from "next-auth"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLogged = !!req.auth
    const { nextUrl } = req

    console.log(`[Middleware] Path: ${nextUrl.pathname}, isLogged: ${isLogged}`)
    if (isLogged) {
        console.log(`[Middleware] Auth payload:`, req.auth?.user?.email || 'No email')
    }

    const isAuthRoute = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')
    const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname === '/'

    if (isAuthRoute) {
        if (isLogged) {
            console.log(`[Middleware] Redirecting from ${nextUrl.pathname} to /dashboard because user is logged in.`)
            return NextResponse.redirect(new URL('/dashboard', nextUrl))
        }
        return null
    }

    if (isDashboardRoute && !isLogged) {
        console.log(`[Middleware] Redirecting from ${nextUrl.pathname} to /login because user is NOT logged in.`)
        return NextResponse.redirect(new URL('/login', nextUrl))
    }

    return null
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
