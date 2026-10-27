import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import { getUserByEmail } from '@/lib/db';
import { Role } from '@/lib/rbac';
import { AUTH_SECRET } from '@/lib/constants';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'sv@ptit.edu.vn' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập đầy đủ email và mật khẩu.');
        }

        const user = await getUserByEmail(credentials.email);
        if (!user) {
          throw new Error('Email hoặc mật khẩu không chính xác.');
        }

        if (user.password !== credentials.password) {
          throw new Error('Email hoặc mật khẩu không chính xác.');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
        };
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || 'github_client_id_ptit',
      clientSecret: process.env.GITHUB_SECRET || 'github_client_secret_ptit',
      profile(profile) {
        return {
          id: `gh_${profile.id}`,
          name: profile.name || profile.login || 'Sinh viên GitHub',
          email: profile.email || `${profile.login}@github.com`,
          image: profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`,
          role: 'user' as Role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) || 'user';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: AUTH_SECRET,
};
