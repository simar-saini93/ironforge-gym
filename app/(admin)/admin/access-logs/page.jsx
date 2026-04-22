'use client';

import AccessLogsList from '@/components/admin/access-logs/AccessLogsList';
import AdminShell     from '@/components/admin/layout/AdminShell';

export default function AccessLogsPage() {
  return (
    <AdminShell topbarProps={{ title: 'Access Logs', subtitle: 'Monitor gym entry and exit' }}>
      <AccessLogsList />
    </AdminShell>
  );
}