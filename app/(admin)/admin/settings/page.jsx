import SettingsView from '@/components/admin/settings/SettingsView';
import AdminShell   from '@/components/admin/layout/AdminShell';

export const metadata = { title: 'IronForge — Settings' };

export default function SettingsPage() {
  return (
    <AdminShell topbarProps={{ title: 'Settings', subtitle: 'Manage branch and membership plans' }}>
      <SettingsView />
    </AdminShell>
  );
}
