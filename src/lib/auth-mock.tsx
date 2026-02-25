import React from 'react';

export const mockUser = {
    id: 'offline-user-id',
    name: 'Offline Zenit',
    username: 'offline-zenit',
    email: 'offline@zenit.local',
    emailVerified: new Date().toISOString(), // Optional verified status mock
    image: null,
    plano: 'PREMIUM', // Giving premium to local user by default
    planoExpiraEm: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    createdAt: new Date('2024-01-01').toISOString(),
};

export const mockSession = {
    user: mockUser,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
};

// Hook for Client Components
export function useSession() {
    return {
        data: mockSession,
        status: 'authenticated', // 'loading' | 'authenticated' | 'unauthenticated'
        update: async (data?: any) => mockSession,
    };
}

// For Server Components
export async function getServerSession() {
    return mockSession;
}

// Provider for layout (dummy)
export function SessionProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

// Other common next-auth exports
export async function signIn() {
    window.location.href = '/dashboard';
}

export async function signOut(options?: { callbackUrl?: string, redirect?: boolean }) {
    window.location.href = options?.callbackUrl || '/';
}

export type NextAuthConfig = any;

// Default export for NextAuth initialization mock
export default function NextAuth(options: any) {
    return {
        handlers: {
            GET: async () => new Response('Mocked NextAuth GET'),
            POST: async () => new Response('Mocked NextAuth POST'),
        },
        auth: async () => mockSession,
        signIn,
        signOut,
    };
}
