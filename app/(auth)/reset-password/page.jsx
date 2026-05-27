import { Suspense } from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title:       'IronForge — Reset Password',
  description: 'Reset your IronForge account password',
};

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--if-bg)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--if-accent)' }} />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}