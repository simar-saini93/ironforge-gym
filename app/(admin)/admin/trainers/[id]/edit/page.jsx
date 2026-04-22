'use client';

import { use } from 'react';
import TrainerForm from '@/components/admin/trainers/TrainerForm';
import AdminShell  from '@/components/admin/layout/AdminShell';

export default function EditTrainerPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  return (
    <AdminShell topbarProps={{ title: 'Edit Trainer', subtitle: 'Update trainer details' }}>
      <TrainerForm trainerId={params.id} />
    </AdminShell>
  );
}
