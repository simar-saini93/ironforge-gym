import SubscriptionsList from '@/components/admin/subscriptions/SubscriptionsList';
import AdminShell        from '@/components/admin/layout/AdminShell';

export const metadata = { title: 'IronForge — Subscriptions' };

export default function SubscriptionsPage() {
  return (
    <AdminShell topbarProps={{ title: 'Subscriptions', subtitle: 'Manage member subscriptions' }}>
      <SubscriptionsList />
    </AdminShell>
  );
}