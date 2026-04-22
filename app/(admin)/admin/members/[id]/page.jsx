'use client';

import { use } from 'react';
import MemberDetail from '@/components/admin/members/MemberDetail';
import AdminShell   from '@/components/admin/layout/AdminShell';

export default function MemberDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  return (
    <AdminShell topbarProps={{ title: 'Member Detail', subtitle: 'View and manage member profile' }}>
      <MemberDetail memberId={params.id} />
    </AdminShell>
  );
}
