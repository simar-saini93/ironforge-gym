import LeadsList from '@/components/admin/crm/LeadsList';
import AdminShell from '@/components/admin/layout/AdminShell';

export const metadata = { title: 'IronForge — CRM / Leads' };

export default function CRMPage() {
  return (
    <AdminShell topbarProps={{ title: 'CRM / Leads', subtitle: 'Track and convert potential members' }}>
      <LeadsList />
    </AdminShell>
  );
}