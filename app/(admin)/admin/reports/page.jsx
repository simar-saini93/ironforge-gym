'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReportsView from '@/components/admin/reports/ReportsView';
import AdminShell  from '@/components/admin/layout/AdminShell';

function ReportsInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'revenue';
  return (
    <AdminShell topbarProps={{ title: 'Reports', subtitle: 'Analytics and insights' }}>
      <ReportsView defaultTab={tab} />
    </AdminShell>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsInner />
    </Suspense>
  );
}
