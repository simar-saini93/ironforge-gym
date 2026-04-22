import MemberPayments from '@/components/member/dashboard/MemberPayments';
import MemberShell    from '@/components/member/layout/MemberShell';

export const metadata = { title: 'IronForge — My Payments' };

export default function MemberPaymentsPage() {
  return (
    <MemberShell>
      <MemberPayments />
    </MemberShell>
  );
}
