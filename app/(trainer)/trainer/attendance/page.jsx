'use client';
import TrainerAttendance from '@/components/trainer/dashboard/TrainerAttendance';
import TrainerShell      from '@/components/trainer/layout/TrainerShell';

export default function TrainerAttendancePage() {
  return (
    <TrainerShell>
      <TrainerAttendance />
    </TrainerShell>
  );
}
