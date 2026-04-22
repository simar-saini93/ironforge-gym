import TrainersList from '@/components/admin/trainers/TrainersList';
import AdminShell   from '@/components/admin/layout/AdminShell';

export const metadata = { title: 'IronForge — Trainers' };

export default function TrainersPage() {
  return (
    <AdminShell topbarProps={{ title: 'Trainers', subtitle: 'Manage your training staff' }}>
      <TrainersList />
    </AdminShell>
  );
}