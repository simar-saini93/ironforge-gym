'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Edit, Mail, Phone, UserX, Trash2,
  RefreshCw, User, CheckCircle2, Dumbbell,
} from 'lucide-react';
import { formatDate, formatDateTime, fullName, initials } from '@/lib/utils/format';
import Badge   from '@/components/ui/Badge';
import Button  from '@/components/ui/Button';
import Modal   from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';

// ── Section card ──────────────────────────────────────────────
function Section({ title, color = 'var(--if-accent)', children }) {
  return (
    <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--if-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--if-text)' }}>{title}</span>
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--if-border)' }}>
      <Icon size={14} style={{ color: 'var(--if-muted)', flexShrink: 0 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)', width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

export default function TrainerDetail({ trainerId }) {
  const router = useRouter();

  const [trainer,       setTrainer]       = useState(null);
  const [attendance,    setAttendance]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [marking,       setMarking]       = useState(false);
  const [confirmModal,  setConfirmModal]  = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resending,     setResending]     = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchTrainer(); }, [trainerId]);

  async function fetchTrainer() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/trainers/${trainerId}`);
      if (!res.ok) throw new Error('Failed to fetch trainer');
      const json = await res.json();
      setTrainer(json.trainer);
      setAttendance(json.attendance || []);
    } catch (err) {
      console.error('Failed to fetch trainer:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function markAttendance(status) {
    setMarking(true);
    try {
      await fetch(`/api/admin/trainers/${trainerId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchTrainer();
    } catch (err) { console.error('Mark attendance error:', err?.message); }
    finally { setMarking(false); }
  }

  async function handleDeactivate() {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/trainers/${trainerId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !trainer.is_active }),
      });
      setConfirmModal(null);
      fetchTrainer();
    } catch (err) { alert(err?.message); }
    finally { setActionLoading(false); }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/trainers/${trainerId}`, { method: 'DELETE' });
      setConfirmModal(null);
      router.push('/admin/trainers');
    } catch (err) { alert(err?.message); }
    finally { setActionLoading(false); }
  }

  async function handleResendInvite() {
    setResending(true);
    try {
      const res = await fetch('/api/admin/resend-invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId }),
      });
      if (res.ok) alert('Invite resent successfully.');
      else alert((await res.json()).error || 'Failed to resend invite.');
    } catch (err) { alert(err?.message); }
    finally { setResending(false); }
  }

  if (loading) return <PageSpinner />;
  if (!trainer) return <div style={{ color: 'var(--if-muted)', padding: 40, textAlign: 'center' }}>Trainer not found.</div>;

  const name          = fullName(trainer.profile);
  const todayAtt      = attendance.find((a) => a.date === today);
  const activeMembers = trainer.assignments?.filter((a) => a.is_active) || [];
  const presentCount  = attendance.filter((a) => a.status === 'present').length;
  const rate          = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <>
      {/* Back + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button onClick={() => router.push('/admin/trainers')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-muted)', transition: 'color .15s', padding: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
        >
          <ArrowLeft size={15} /> Back to Trainers
        </button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" icon={<Mail size={13} />} loading={resending} onClick={handleResendInvite}>Resend Invite</Button>
          <Button variant="danger" size="sm" icon={<UserX size={13} />} onClick={() => setConfirmModal({ type: 'deactivate' })}>
            {trainer.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setConfirmModal({ type: 'delete' })}>Delete</Button>
          <Button variant="ghost" size="sm" icon={<Edit size={13} />} onClick={() => router.push(`/admin/trainers/${trainerId}/edit`)}>Edit</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profile card */}
          <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--if-accentbg2)', border: '2px solid var(--if-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--if-accent)' }}>
              {initials(name)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--if-text)', letterSpacing: '-.02em' }}>{name}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)', marginTop: 2 }}>{trainer.specialization || 'Trainer'}</p>
            </div>
            <Badge variant={trainer.is_active ? 'active' : 'expired'}>{trainer.is_active ? 'Active' : 'Inactive'}</Badge>
            <div style={{ width: '100%', height: 1, background: 'var(--if-border)' }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)', textAlign: 'center' }}>
              Joined {formatDate(trainer.created_at)}
            </p>
          </div>

          {/* Attendance rate */}
          <Section title="Attendance Rate" color="#a78bfa">
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>Overall Rate</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: rate < 70 ? '#f97316' : 'var(--if-accent)' }}>{rate}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--if-bg3)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ width: `${rate}%`, height: '100%', background: rate < 70 ? '#f97316' : 'var(--if-accent)', borderRadius: 10, transition: 'width .3s' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              {[
                { label: 'Active Members', value: activeMembers.length, color: 'var(--if-accent)' },
                { label: 'Days Present',   value: presentCount,         color: '#22c55e'          },
              ].map((s) => (
                <div key={s.label} style={{ background: 'var(--if-bg3)', border: '1px solid var(--if-border)', borderRadius: 8, padding: '10px 12px' }}>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)', marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Today's attendance */}
          <Section title="Today's Attendance" color="#a78bfa">
            {todayAtt ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge variant={todayAtt.status === 'present' ? 'active' : todayAtt.status === 'absent' ? 'expired' : 'yellow'}>
                  {todayAtt.status}
                </Badge>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>Marked for today</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { s: 'present', color: '#22c55e', bg: 'rgba(34,197,94,0.09)' },
                  { s: 'absent',  color: '#ef4444', bg: 'rgba(239,68,68,0.09)' },
                  { s: 'leave',   color: '#f97316', bg: 'rgba(249,115,22,0.09)' },
                ].map(({ s, color, bg }) => (
                  <button key={s} onClick={() => markAttendance(s)} disabled={marking}
                    style={{ flex: 1, height: 36, borderRadius: 8, border: `1px solid ${color}`, background: bg, fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'capitalize', color, cursor: 'pointer', transition: 'all .15s', opacity: marking ? 0.6 : 1 }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Personal information */}
          <Section title="Personal Information">
            <InfoRow icon={Mail}    label="Email"          value={trainer.profile?.email} />
            <InfoRow icon={Phone}   label="Phone"          value={trainer.profile?.phone} />
            <InfoRow icon={Dumbbell} label="Specialization" value={trainer.specialization} />
            <InfoRow icon={User}    label="Bio"            value={trainer.bio} />
          </Section>

          {/* Assigned members */}
          <Section title={`Assigned Members (${activeMembers.length})`} color="#38bdf8">
            {activeMembers.length === 0 ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)', textAlign: 'center', padding: '12px 0' }}>No members assigned</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {activeMembers.map((a) => {
                  const mName = fullName(a.member?.profile);
                  return (
                    <div key={a.id} onClick={() => router.push(`/admin/members/${a.member?.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--if-bg3)', border: '1px solid var(--if-border)', borderRadius: 8, cursor: 'pointer', transition: 'border-color .15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--if-accent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--if-border)')}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--if-accentbg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, color: 'var(--if-accent)', flexShrink: 0 }}>
                        {initials(mName)}
                      </div>
                      <div>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--if-text)', lineHeight: 1.3 }}>{mName}</p>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--if-muted)' }}>{a.member?.member_number}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Attendance history */}
          <Section title="Attendance History" color="#a78bfa">
            {attendance.length === 0 ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)', textAlign: 'center', padding: '12px 0' }}>No records yet</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date', 'Status', 'Notes'].map((h) => (
                      <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '0 0 8px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => (
                    <tr key={a.id} style={{ borderTop: '1px solid var(--if-border)' }}>
                      <td style={{ padding: '9px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)' }}>{formatDate(a.date)}</td>
                      <td style={{ padding: '9px 0' }}>
                        <Badge variant={a.status === 'present' ? 'active' : a.status === 'absent' ? 'expired' : 'yellow'} size="sm">{a.status}</Badge>
                      </td>
                      <td style={{ padding: '9px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>{a.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </div>
      </div>

      {/* ── Confirm modals ── */}
      <Modal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.type === 'delete' ? 'Delete Trainer' : trainer.is_active ? 'Deactivate Trainer' : 'Activate Trainer'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant="warning"
              loading={actionLoading}
              onClick={confirmModal?.type === 'delete' ? handleDelete : handleDeactivate}
              style={confirmModal?.type === 'delete' ? { background: 'transparent', color: 'var(--if-red)', border: 'none' } : {}}
            >
              {confirmModal?.type === 'delete' ? 'Delete' : trainer.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      >
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--if-text2)', lineHeight: 1.6 }}>
          {confirmModal?.type === 'delete'
            ? `Permanently delete ${name}? This cannot be undone and will remove all their data.`
            : trainer.is_active
              ? `Deactivate ${name}? They will lose access to the trainer portal.`
              : `Reactivate ${name}? They will regain access to the trainer portal.`
          }
        </p>
      </Modal>
    </>
  );
}
