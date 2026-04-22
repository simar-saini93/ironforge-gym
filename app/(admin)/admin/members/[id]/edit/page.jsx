'use client';

import { use } from 'react';
import EditMemberForm from '@/components/admin/members/EditMemberForm';
import AdminShell     from '@/components/admin/layout/AdminShell';

export default function EditMemberPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  return (
    <AdminShell topbarProps={{ title: 'Edit Member', subtitle: 'Update member details' }}>
      <EditMemberForm memberId={params.id} />
    </AdminShell>
  );
}
