import MemberAttendance from '@/components/member/dashboard/MemberAttendance';
import MemberShell      from '@/components/member/layout/MemberShell';

export const metadata = { title: 'IronForge — My Attendance' };

export default function MemberAttendancePage() {
  return (
    <MemberShell>
      <MemberAttendance />
    </MemberShell>
  );
}