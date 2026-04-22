import CreateMemberForm from '@/components/admin/members/CreateMemberForm';
import AdminShell from '@/components/admin/layout/AdminShell';

export const metadata = { title: 'IronForge — Add Member' };

export default function NewMemberPage() {
  return (
    <AdminShell topbarProps={{ title: 'Add Member', subtitle: 'Create a new gym membership' }}>
      <CreateMemberForm />
    </AdminShell>
  );
}