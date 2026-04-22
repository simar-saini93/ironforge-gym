'use client';
import TrainerDashboard from '@/components/trainer/dashboard/TrainerDashboard';
import TrainerShell     from '@/components/trainer/layout/TrainerShell';

export default function TrainerDashboardPage() {
  return (
    <TrainerShell>
      <TrainerDashboard />
    </TrainerShell>
  );
}
