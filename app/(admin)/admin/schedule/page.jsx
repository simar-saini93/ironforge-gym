'use client';
import ScheduleView from '@/components/admin/schedule/ScheduleView';
import AdminShell   from '@/components/admin/layout/AdminShell';

export default function SchedulePage() {
  return (
    <AdminShell topbarProps={{ title: 'Schedule', subtitle: 'Trainer duty, gym timings and holidays' }}>
      <ScheduleView />
    </AdminShell>
  );
}
