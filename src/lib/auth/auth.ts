import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { siteConfig } from '@/config/site.config';

// Dynamic import to avoid Edge runtime issues
async function getUserCrudDynamic() {
  const { getUserCrud } = await import('@/lib/db/crud/user.crud');
  return getUserCrud();
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!account || account.provider !== 'google') {
        console.error('[Auth] Sign in rejected: Invalid account or provider');
        return false;
      }

      try {
        const userCrud = await getUserCrudDynamic();

        const { user: dbUser } = await userCrud.findOrCreateByGoogle({
          email: user.email!,
          name: user.name!,
          googleId: account.providerAccountId,
          avatarUrl: user.image || undefined,
        });

        // Auto-assign admin role if email matches admin list
        const isAdminEmail = siteConfig.adminEmails.includes(user.email!.toLowerCase());
        const hasAdminRole = dbUser.roles?.includes('admin');
        const needsApproval = dbUser.accountStatus !== 'approved';
        if (isAdminEmail && (!hasAdminRole || needsApproval)) {
          await userCrud.update(dbUser._id, {
            roles: ['user', 'admin'],
            ...(needsApproval ? { accountStatus: 'approved', approvedAt: new Date() } : {}),
          } as Partial<typeof dbUser>);
        }

        return true;
      } catch (error) {
        console.error('[Auth] Error during sign in:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          userEmail: user.email,
        });

        if (error instanceof Error) {
          if (
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('ETIMEDOUT') ||
            error.message.includes('getaddrinfo') ||
            error.message.includes('connect ECONNRESET')
          ) {
            console.error(
              '[Auth] Database connection failed. Check MongoDB connection string and network access.'
            );
          }
        }

        return false;
      }
    },

    async jwt({ token, user, account, trigger }) {
      if (account && user) {
        const userCrud = await getUserCrudDynamic();
        const dbUser = await userCrud.findByGoogleId(account.providerAccountId);

        if (dbUser) {
          token.userId = dbUser._id;
          token.plan = dbUser.plan;
          token.creditBalance = dbUser.creditBalance;
          token.roles = dbUser.roles || ['user'];
          token.accountStatus = dbUser.accountStatus || 'pending';
          token.name = dbUser.name;
          token.picture = dbUser.avatarUrl;
        }
      }

      if (trigger === 'update' && token.userId) {
        const userCrud = await getUserCrudDynamic();
        const dbUser = await userCrud.findById(token.userId as string);
        if (dbUser) {
          token.plan = dbUser.plan;
          token.creditBalance = dbUser.creditBalance;
          token.roles = dbUser.roles || ['user'];
          token.accountStatus = dbUser.accountStatus || 'pending';
          token.name = dbUser.name;
          token.picture = dbUser.avatarUrl;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.plan = token.plan as string;
        session.user.creditBalance = token.creditBalance as number;
        session.user.roles = (token.roles as string[]) || ['user'];
        session.user.accountStatus = (token.accountStatus as string) || 'pending';
        if (token.name) {
          session.user.name = token.name as string;
        }
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
});

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: string;
      creditBalance: number;
      roles: string[];
      accountStatus: string;
    };
  }

  interface JWT {
    userId?: string;
    plan?: string;
    creditBalance?: number;
    roles?: string[];
    accountStatus?: string;
    name?: string;
    picture?: string;
  }
}
