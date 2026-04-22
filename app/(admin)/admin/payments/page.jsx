import PaymentsList from '@/components/admin/payments/PaymentsList';
import AdminShell   from '@/components/admin/layout/AdminShell';

export const metadata = { title: 'IronForge — Payments' };

export default function PaymentsPage() {
  return (
    <AdminShell topbarProps={{ title: 'Payments', subtitle: 'View all payment records' }}>
      <PaymentsList />
    </AdminShell>
  );
}