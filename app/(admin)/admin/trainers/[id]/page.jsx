'use client';

import { use } from 'react';
import TrainerDetail from '@/components/admin/trainers/TrainerDetail';
import AdminShell    from '@/components/admin/layout/AdminShell';

export default function TrainerDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  return (
    <AdminShell topbarProps={{ title: 'Trainer Detail', subtitle: 'View trainer profile and attendance' }}>
      <TrainerDetail trainerId={params.id} />
    </AdminShell>
  );
}
