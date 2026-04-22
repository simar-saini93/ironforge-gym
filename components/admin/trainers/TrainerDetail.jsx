'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, CheckCircle2, XCircle, Users, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatDateTime, fullName, initials } from '@/utils/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import Select from '@/components/ui/Select';

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

export default function TrainerDetail({ trainerId }) {
  const router   = useRouter();
  const supabase = createClient();

  const [trainer,    setTrainer]    = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [marking,    setMarking]    = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchTrainer(); }, [trainerId]);

  async function fetchTrainer() {
    setLoading(true);
    try {
      const [{ data: t }, { data: a }] = await Promise.all([
        supabase
          .from('trainers')
          .select(`
            id, is_active, specialization, bio,
            profile:profiles(first_name, last_name, email, phone),
            assignments:member_trainer_assignments(
              id, is_active, assigned_at,
              member:members(id, member_number, profile:profiles(first_name, last_name))
            )
          `)
          .eq('id', trainerId)
          .single(),

        supabase
          .from('trainer_attendance')
          .select('id, date, status, notes')
          .eq('trainer_id', trainerId)
          .order('date', { ascending: false })
          .limit(20),
      ]);

      setTrainer(t);
      setAttendance(a || []);
    } catch (err) {
      console.error('Failed to fetch trainer:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function markAttendance(status) {
    setMarking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile }  = await supabase.from('profiles').select('branch_id').eq('id', user.id).single();

      await supabase.from('trainer_attendance').upsert({
        trainer_id: trainerId,
        branch_id:  profile.branch_id,
        date:       today,
        status,
        marked_by:  user.id,
      }, { onConflict: 'trainer_id,date' });

      fetchTrainer();
    } catch (err) {
      console.error('Mark attendance error:', err?.message);
    } finally {
      setMarking(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (!trainer) return <div style={{ color: 'var(--if-muted)', padding: 40, textAlign: 'center' }}>Trainer not found.</div>;

  const name         = fullName(trainer.profile);
  const todayAtt     = attendance.find((a) => a.date === today);
  const activeMembers = trainer.assignments?.filter((a) => a.is_active) || [];

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const rate         = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <>
      {/* Back + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button onClick={() => router.push('/admin/trainers')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-muted)', padding: 0, transition: 'color .15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
        >
          <ArrowLeft size={15} /> Back to Trainers
        </button>
        <Button variant="ghost" size="sm" icon={<Edit size={13} />} onClick={() => router.push(`/admin/trainers/${trainerId}/edit`)}>Edit</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Left */}
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
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)' }}>Attendance Rate</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: rate < 70 ? '#f97316' : 'var(--if-accent)' }}>{rate}%</span>
              </div>
              <div style={{ width: '100%', height: 4, background: 'var(--if-bg3)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ width: `${rate}%`, height: '100%', background: rate < 70 ? '#f97316' : 'var(--if-accent)', borderRadius: 10 }} />
              </div>
            </div>
          </div>

          {/* Mark attendance */}
          <Section title="Today's Attendance" color="#a78bfa">
            {todayAtt ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge variant={todayAtt.status === 'present' ? 'present' : todayAtt.status === 'absent' ? 'absent' : 'leave'}>
                  {todayAtt.status}
                </Badge>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>Marked for today</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                {['present', 'absent', 'leave'].map((s) => (
                  <button key={s} onClick={() => markAttendance(s)} disabled={marking}
                    style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid var(--if-border2)', background: 'var(--if-bg3)', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'capitalize', color: 'var(--if-text2)', cursor: 'pointer', transition: 'all .15s', textTransform: 'capitalize' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Active Members', value: activeMembers.length, color: 'var(--if-accent)' },
              { label: 'Days Present', value: presentCount, color: '#22c55e' },
              { label: 'Joined', value: formatDate(trainer.created_at), color: '#38bdf8', full: true },
            ].map((s) => (
              <div key={s.label} style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 10, padding: '14px', gridColumn: s.full ? '1 / -1' : undefined }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)', marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Assigned members */}
          <Section title={`Assigned Members (${activeMembers.length})`} color="#38bdf8">
            {activeMembers.length === 0 ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)', textAlign: 'center', padding: '12px 0' }}>No members assigned</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {activeMembers.map((a) => {
                  const mName = fullName(a.member?.profile);
                  return (
                    <div key={a.id}
                      onClick={() => router.push(`/admin/members/${a.member?.id}`)}
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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Status', 'Notes'].map((h) => (
                    <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '0 0 8px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--if-muted)', padding: '16px 0', fontSize: 13 }}>No records yet</td></tr>
                ) : (
                  attendance.map((a) => (
                    <tr key={a.id} style={{ borderTop: '1px solid var(--if-border)' }}>
                      <td style={{ padding: '9px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)' }}>{formatDate(a.date)}</td>
                      <td style={{ padding: '9px 0' }}><Badge variant={a.status} size="sm">{a.status}</Badge></td>
                      <td style={{ padding: '9px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>{a.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Section>

          {/* Bio */}
          {trainer.bio && (
            <Section title="Bio">
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--if-text2)', lineHeight: 1.7 }}>{trainer.bio}</p>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
