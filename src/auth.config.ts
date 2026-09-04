import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnKiosco = nextUrl.pathname.startsWith('/kiosco');
      const isApiPublic = nextUrl.pathname.startsWith('/api/public');
      const isIcon = nextUrl.pathname.startsWith('/api/icon');

      // Las API públicas y los íconos no requieren autenticación
      if (isApiPublic || isIcon) {
        return true;
      }

      if (isOnAdmin || isOnKiosco) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/admin', nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.rol;
        token.esProfesorCrossfit = user.esProfesorCrossfit;
        token.esProfesorMusculacion = user.esProfesorMusculacion;
      }
      return token;
    },
    session({ session, token }) {
      if (token.role && session.user) {
        session.user.rol = token.role as string;
        session.user.esProfesorCrossfit = token.esProfesorCrossfit as boolean;
        session.user.esProfesorMusculacion = token.esProfesorMusculacion as boolean;
      }
      return session;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
