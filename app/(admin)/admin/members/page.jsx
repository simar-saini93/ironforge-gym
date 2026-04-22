import MembersTable from '@/components/admin/members/MembersTable';
import AdminShell from '@/components/admin/layout/AdminShell';

export const metadata = { title: 'IronForge — Members' };

export default function MembersPage() {
  return (
    <AdminShell topbarProps={{ title: 'Members', subtitle: 'Manage gym memberships' }}>
      <MembersTable />
    </AdminShell>
  );
}