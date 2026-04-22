import MemberTrainer from '@/components/member/dashboard/MemberTrainer';
import MemberShell   from '@/components/member/layout/MemberShell';

export const metadata = { title: 'IronForge — My Trainer' };

export default function MemberTrainerPage() {
  return (
    <MemberShell>
      <MemberTrainer />
    </MemberShell>
  );
}
