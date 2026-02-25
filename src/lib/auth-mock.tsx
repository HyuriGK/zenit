'use client';

import {
    useSession as useNextAuthSession,
    signIn as nextAuthSignIn,
    signOut as nextAuthSignOut
} from 'next-auth/react';

// Bridge for existing Client Components
export function useSession() {
    const session = useNextAuthSession();
    return {
        ...session,
        // Mantendo compatibilidade com o formato esperado pelos componentes antigos se necessário
        data: session.data,
        status: session.status,
    };
}

export const signIn = nextAuthSignIn;
export const signOut = nextAuthSignOut;

// Note: getServerSession should be used in server components. 
// Since this file is 'use client', we can't export a real server-side auth here easily 
// but we can export the function name to avoid import errors.
export async function getServerSession() {
    return null; // Should be imported from @/auth in server components
}

export type NextAuthConfig = any;

