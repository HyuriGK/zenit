import NextAuth from '@/lib/auth-mock';
import { authOptions } from './authOptions';

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);