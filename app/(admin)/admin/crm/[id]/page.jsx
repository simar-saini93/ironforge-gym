'use client';

import { use } from 'react';

import LeadDetail from '@/components/admin/crm/LeadDetail';
import AdminShell from '@/components/admin/layout/AdminShell';

export default function LeadDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  return (
    <AdminShell topbarProps={{ title: 'Lead Detail', subtitle: 'View and manage lead followups' }}>
      <LeadDetail leadId={params.id} />
    </AdminShell>
  );
}
