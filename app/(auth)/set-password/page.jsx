import { Suspense } from 'react';
import SetPasswordForm from '@/components/auth/SetPasswordForm';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title:       'IronForge — Set Password',
  description: 'Set your IronForge account password',
};

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--if-bg)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--if-accent)' }} />
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SetPasswordForm />
    </Suspense>
  );
}