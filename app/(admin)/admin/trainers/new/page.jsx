import TrainerForm from '@/components/admin/trainers/TrainerForm';
import AdminShell  from '@/components/admin/layout/AdminShell';

export const metadata = { title: 'IronForge — Add Trainer' };

export default function NewTrainerPage() {
  return (
    <AdminShell topbarProps={{ title: 'Add Trainer', subtitle: 'Create a new trainer account' }}>
      <TrainerForm />
    </AdminShell>
  );
}