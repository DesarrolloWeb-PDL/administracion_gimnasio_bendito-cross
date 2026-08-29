import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Extender tipos de NextAuth para incluir rol
declare module 'next-auth' {
  interface User {
    rol?: string;
    esProfesorCrossfit?: boolean;
    esProfesorMusculacion?: boolean;
  }
  interface Session {
    user: {
      rol?: string;
      esProfesorCrossfit?: boolean;
      esProfesorMusculacion?: boolean;
    } & import('next-auth').DefaultSession['user'];
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await prisma.usuario.findUnique({ where: { email } });
          if (!user) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
            return {
              id: user.id,
              name: user.nombre,
              email: user.email,
              rol: user.rol,
              esProfesorCrossfit: user.esProfesorCrossfit,
              esProfesorMusculacion: user.esProfesorMusculacion,
            };
          }
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});
