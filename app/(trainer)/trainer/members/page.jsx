'use client';
import TrainerMembers from '@/components/trainer/dashboard/TrainerMembers';
import TrainerShell   from '@/components/trainer/layout/TrainerShell';

export default function TrainerMembersPage() {
  return (
    <TrainerShell>
      <TrainerMembers />
    </TrainerShell>
  );
}
