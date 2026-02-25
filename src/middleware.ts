import { authConfig } from "@/auth.config"
import NextAuth from "next-auth"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLogged = !!req.auth
    const { nextUrl } = req

    const isAuthRoute = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')
    const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname === '/'

    if (isAuthRoute) {
        if (isLogged) {
            return NextResponse.redirect(new URL('/dashboard', nextUrl))
        }
        return null
    }

    if (isDashboardRoute && !isLogged) {
        return NextResponse.redirect(new URL('/login', nextUrl))
    }

    return null
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
