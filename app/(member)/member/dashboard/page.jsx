import MemberDashboard from '@/components/member/dashboard/MemberDashboard';
import MemberShell     from '@/components/member/layout/MemberShell';

export const metadata = { title: 'IronForge — My Dashboard' };

export default function MemberDashboardPage() {
  return (
    <MemberShell>
      <MemberDashboard />
    </MemberShell>
  );
}