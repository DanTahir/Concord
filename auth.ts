import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { queryTyped } from './app/lib/db';
import type { UserAndUserGroup } from './app/lib/definitions';
import bcrypt from 'bcrypt';

async function getUserAndGroup(email: string): Promise<UserAndUserGroup | undefined> {
  try {
    const user = await queryTyped<UserAndUserGroup>(`
      SELECT *
      FROM users
      JOIN usergroups ON users.userGroupId = usergroups.userGroupId
      WHERE users.email = $1
    `, [email]);
    return user[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
          if (parsedCredentials.success) {
            const { email, password } = parsedCredentials.data;
            const user = await getUserAndGroup(email);
            if (!user) return null;
            console.log(`useremail: ${user.email} userpass: ${user.hashedpassword}, typedpass: ${password}`);
            const passwordsMatch = await bcrypt.compare(password, user.hashedpassword);
            if (passwordsMatch) return user;
          }
          console.log('Invalid credentials');
          return null;
      },
    }),
  ],
});