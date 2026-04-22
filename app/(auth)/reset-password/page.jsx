import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata = {
  title:       'IronForge — Reset Password',
  description: 'Reset your IronForge account password',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
