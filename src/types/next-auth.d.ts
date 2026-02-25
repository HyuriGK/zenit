import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    username?: string | null;
    usernameChangedAt?: Date | null;
    name?: string | null;
    image?: string | null;
    emailVerified?: Date | null;
    plano?: string;
    planoExpiraEm?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      username?: string | null;
      usernameChangedAt?: Date | null;
      name?: string | null;
      image?: string | null;
      emailVerified?: Date | null;
      plano?: string;
      planoExpiraEm?: Date | null;
      createdAt?: Date;
      updatedAt?: Date;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    username?: string | null;
    usernameChangedAt?: Date | null;
    name?: string | null;
    image?: string | null;
    emailVerified?: Date | null;
    plano?: string;
    planoExpiraEm?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }
}
