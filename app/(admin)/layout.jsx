import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'IronForge — Admin',
};

export default async function AdminLayout({ children }) {
  const { userId, sessionClaims } = await auth();

  if (!userId) redirect('/login');

  const role = sessionClaims?.metadata?.role;

  if (role !== 'admin') redirect('/login?error=no_profile');

  return (
    <div data-admin-layout>
      {children}
    </div>
  );
}
