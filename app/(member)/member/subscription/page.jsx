import MemberSubscription from '@/components/member/dashboard/MemberSubscription';
import MemberShell        from '@/components/member/layout/MemberShell';

export const metadata = { title: 'IronForge — My Subscription' };

export default function MemberSubscriptionPage() {
  return (
    <MemberShell>
      <MemberSubscription />
    </MemberShell>
  );
}
