'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Edit, RefreshCw, Snowflake, ShieldOff, Trash2,
  Mail, Phone, Calendar, User, CheckCircle2, UserPlus, X, Sun,
} from 'lucide-react';
import { formatDate, formatDateTime, formatCurrency, daysLeft, daysLeftLabel, fullName, initials, planLabel, subStatusVariant } from '@/lib/utils/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import RenewModal from '@/components/admin/members/RenewModal';
import { PhotoCard } from '@/components/admin/members/PhotoCard';

// ── Trainer Assign Section ────────────────────────────────────
function TrainerAssignSection({ memberId, currentTrainer, onChanged }) {
  const [trainers,   setTrainers]  = useState([]);
  const [selected,   setSelected]  = useState('');
  const [saving,     setSaving]    = useState(false);
  const [showSelect, setShowSelect]= useState(false);

  useEffect(() => {
    fetch(`/api/admin/members/${memberId}/trainer`)
      .then((r) => r.json())
      .then(({ trainers }) => setTrainers(trainers || []));
  }, []);

  async function handleAssign() {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/members/${memberId}/trainer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', trainer_id: selected }),
      });
      setShowSelect(false); setSelected(''); onChanged();
    } catch (err) { alert(err?.message || 'Failed to assign trainer'); }
    finally { setSaving(false); }
  }

  async function handleUnassign() {
    if (!confirm('Remove assigned trainer?')) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/members/${memberId}/trainer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unassign' }),
      });
      onChanged();
    } catch (err) { alert(err?.message || 'Failed to unassign trainer'); }
    finally { setSaving(false); }
  }

  return (
    <Section title="Assigned Trainer" color="#a78bfa">
      {currentTrainer && !showSelect ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--if-accentbg2)', border: '1px solid var(--if-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--if-accent)' }}>
              {initials(fullName(currentTrainer.profile))}
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{fullName(currentTrainer.profile)}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="sm" variant="ghost" onClick={() => setShowSelect(true)}>Change</Button>
            <Button size="sm" variant="danger" loading={saving} onClick={handleUnassign}>Remove</Button>
          </div>
        </div>
      ) : !showSelect ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>No trainer assigned</p>
          <Button size="sm" icon={<UserPlus size={13} />} onClick={() => setShowSelect(true)}>Assign</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select value={selected} onChange={(e) => setSelected(e.target.value)}
            style={{ width: '100%', height: 38, background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
          >
            <option value="">Select a trainer...</option>
            {trainers.map((t) => <option key={t.id} value={t.id}>{fullName(t.profile)}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="ghost" icon={<X size={13} />} onClick={() => { setShowSelect(false); setSelected(''); }}>Cancel</Button>
            <Button size="sm" loading={saving} disabled={!selected} onClick={handleAssign}>
              {currentTrainer ? 'Change Trainer' : 'Assign Trainer'}
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}

// ── Section card ─────────────────────────────────────────────
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

// ── Info row ─────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--if-border)' }}>
      <Icon size={14} style={{ color: 'var(--if-muted)', flexShrink: 0 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)', width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

export default function MemberDetail({ memberId }) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [member,      setMember]      = useState(null);
  const [payments,    setPayments]    = useState([]);
  const [accessLogs,  setAccessLogs]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [renewOpen,   setRenewOpen]   = useState(false);
  const [showCreated, setShowCreated] = useState(false);
  const [freezing,    setFreezing]    = useState(false);

  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowCreated(true);
      setTimeout(() => setShowCreated(false), 4000);
    }
    fetchMember();
  }, [memberId]);

  async function fetchMember() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/members/${memberId}`);
      if (!res.ok) throw new Error('Failed to fetch member');
      const json = await res.json();
      setMember(json.member);
      setPayments(json.payments || []);
      setAccessLogs(json.accessLogs || []);
    } catch (err) {
      console.error('Failed to fetch member:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFreeze() {
    const sub = activeSub();
    if (!sub) return;
    if (!confirm('Freeze this membership? The end date will be automatically extended when unfrozen.')) return;
    setFreezing(true);
    try {
      await fetch('/api/admin/subscriptions', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sub.id, status: 'frozen' }),
      });
      fetchMember();
    } catch (err) { alert(err?.message || 'Failed to freeze'); }
    finally { setFreezing(false); }
  }

  async function handleUnfreeze() {
    const sub = activeSub();
    if (!sub) return;
    if (!confirm('Unfreeze this membership? The end date will be extended by the number of frozen days.')) return;
    setFreezing(true);
    try {
      await fetch('/api/admin/subscriptions', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sub.id, status: 'active' }),
      });
      fetchMember();
    } catch (err) { alert(err?.message || 'Failed to unfreeze'); }
    finally { setFreezing(false); }
  }

  async function handleDeactivate() {
    if (!confirm('Deactivate this member? They will lose access immediately.')) return;
    await fetch(`/api/admin/members/${memberId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: false }) });
    fetchMember();
  }

  async function handleDelete() {
    if (!confirm('PERMANENTLY DELETE this member? This cannot be undone.')) return;
    if (!confirm('This will delete all subscriptions, payments and access logs. Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push('/admin/members');
    } catch (err) { alert(err?.message || 'Failed to delete member'); }
  }

  async function handleResendInvite() {
    const res = await fetch('/api/admin/resend-invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: member.profile?.email, firstName: member.profile?.first_name }),
    });
    if (res.ok) alert('Invite email resent.');
    else alert('Failed to resend invite.');
  }

  if (loading) return <PageSpinner />;
  if (!member) return <div style={{ color: 'var(--if-muted)', padding: 40, textAlign: 'center' }}>Member not found.</div>;

  function activeSub() {
    return member.subscription?.find((s) => s.status === 'active' || s.status === 'frozen') || member.subscription?.[0];
  }

  function realSubStatus(s) {
    if (!s) return null;
    if (s.status === 'frozen') return 'frozen';
    const today = new Date().toISOString().split('T')[0];
    if (s.end_date < today) return 'expired';
    return 'active';
  }

  const name      = fullName(member.profile);
  const sub       = activeSub();
  const subStatus = realSubStatus(sub);
  const isFrozen  = subStatus === 'frozen';
  const days      = daysLeft(sub?.end_date);
  const trainer   = member.trainer?.find((t) => t.is_active)?.trainer;

  return (
    <>
      {/* Created success banner */}
      {showCreated && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(34,197,94,0.09)', border: '1px solid #22c55e', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#22c55e' }}>
          <CheckCircle2 size={16} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 }}>
            Member created successfully. Invite email sent to {member.profile?.email}
          </span>
        </div>
      )}

      {/* Frozen banner */}
      {isFrozen && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'rgba(56,189,248,0.08)', border: 'none', borderRadius: 10, padding: '16px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#38bdf8' }}>
            <Snowflake size={16} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 }}>
              Membership is frozen. End date will be extended when unfrozen.
            </span>
          </div>
          <button
            onClick={handleUnfreeze}
            disabled={freezing}
            style={{
              display:       'flex',
              alignItems:    'center',
              gap:           6,
              height:        40,
              padding:       '0 16px',
              borderRadius:  8,
              border:        '1px solid #38bdf8',
              background:    'rgba(56, 189, 248, 0.08)',
              color:         'rgb(56, 189, 248)',
              fontFamily:    "'Outfit', sans-serif",
              fontSize:      14,
              fontWeight:    700,
              letterSpacing: '.05em',
              cursor:        freezing ? 'not-allowed' : 'pointer',
              opacity:       freezing ? 0.7 : 1,
              outline:       'none',
              flexShrink:    0,
              textTransform:   'uppercase',
            }}
          >
            <Sun size={13} />
            {freezing ? 'Unfreezing...' : 'Unfreeze'}
          </button>
        </div>
      )}

      {/* Back + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button onClick={() => router.push('/admin/members')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-muted)', transition: 'color .15s', padding: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
        >
          <ArrowLeft size={15} /> Back to Members
        </button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" icon={<Mail size={13} />} onClick={handleResendInvite}>Resend Invite</Button>
          {!isFrozen && sub && (
            <Button variant="ghost" size="sm" icon={<Snowflake size={13} />} loading={freezing} onClick={handleFreeze}>Freeze</Button>
          )}
          {isFrozen && (
            <Button variant="ghost" size="sm" icon={<Sun size={13} />} loading={freezing} onClick={handleUnfreeze}>Unfreeze</Button>
          )}
          <Button variant="danger" size="sm" icon={<ShieldOff size={13} />} onClick={handleDeactivate}>Deactivate</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>Delete</Button>
          <Button variant="ghost" size="sm" icon={<Edit size={13} />} onClick={() => router.push(`/admin/members/${memberId}/edit`)}>Edit</Button>
          <Button size="sm" icon={<RefreshCw size={13} />} onClick={() => setRenewOpen(true)}>Renew</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profile card */}
          <div style={{ background: 'var(--if-card)', border: `1px solid ${isFrozen ? '#38bdf8' : 'var(--if-border)'}`, borderRadius: 12, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <PhotoCard name={name} url={member.profile_pic_url} memberId={memberId} onUpdated={fetchMember} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--if-text)', letterSpacing: '-.02em' }}>{name}</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--if-muted)', marginTop: 2 }}>{member.member_number}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!member.is_active ? (
                <Badge variant="expired">Inactive</Badge>
              ) : sub ? (
                <Badge variant={subStatusVariant(subStatus)} style={{ textTransform: 'capitalize' }}>{subStatus}</Badge>
              ) : (
                <Badge variant="expired">No Plan</Badge>
              )}
            </div>
            <div style={{ width: '100%', height: 1, background: 'var(--if-border)' }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)', textAlign: 'center' }}>
              Member since {formatDate(member.created_at)}
            </p>
          </div>

          {/* Subscription card */}
          <Section title="Current Subscription" color={isFrozen ? '#38bdf8' : '#22c55e'}>
            {sub ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isFrozen && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(56,189,248,0.08)', border: '1px solid #38bdf8', borderRadius: 8 }}>
                    <Snowflake size={12} style={{ color: '#38bdf8' }} />
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>MEMBERSHIP FROZEN</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge variant="yellow">{planLabel(sub.plan?.billing_cycle)}</Badge>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: 'var(--if-text)' }}>
                    {formatCurrency(sub.plan?.price)}
                  </span>
                </div>
                <div style={{ height: 1, background: 'var(--if-border)', margin: '4px 0' }} />
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Start</span><span style={{ color: 'var(--if-text)' }}>{formatDate(sub.start_date)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>End</span>
                    <span style={{ color: isFrozen ? '#38bdf8' : days !== null && days <= 7 ? 'var(--if-red)' : days !== null && days <= 14 ? '#f97316' : 'var(--if-text)' }}>
                      {formatDate(sub.end_date)} {isFrozen && '(paused)'}
                    </span>
                  </div>
                  {!isFrozen && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Remaining</span>
                      <span style={{ color: days !== null && days <= 7 ? 'var(--if-red)' : 'var(--if-text)', fontWeight: 600 }}>
                        {daysLeftLabel(sub.end_date)}
                      </span>
                    </div>
                  )}
                </div>
                {!isFrozen && days !== null && days <= 14 && (
                  <Button fullWidth size="sm" icon={<RefreshCw size={13} />} onClick={() => setRenewOpen(true)}>Renew Now</Button>
                )}
                {isFrozen && (
                  <Button fullWidth size="sm" icon={<Sun size={13} />} loading={freezing} onClick={handleUnfreeze}>Unfreeze Membership</Button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--if-muted)', fontSize: 13, padding: '12px 0' }}>
                No active subscription
                <div style={{ marginTop: 10 }}>
                  <Button size="sm" onClick={() => setRenewOpen(true)}>Add Subscription</Button>
                </div>
              </div>
            )}
          </Section>

          <TrainerAssignSection memberId={memberId} currentTrainer={trainer} onChanged={fetchMember} />
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Section title="Personal Information">
            <InfoRow icon={Mail}     label="Email"         value={member.profile?.email} />
            <InfoRow icon={Phone}    label="Phone"         value={member.profile?.phone} />
            <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(member.date_of_birth)} />
            <InfoRow icon={User}     label="Gender"        value={member.gender} />
            <InfoRow icon={User}     label="Address"       value={member.address} />
            {member.emergency_name && (
              <>
                <div style={{ marginTop: 12, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-muted)' }}>Emergency Contact</span>
                </div>
                <InfoRow icon={User}  label="Name"  value={member.emergency_name} />
                <InfoRow icon={Phone} label="Phone" value={member.emergency_phone} />
              </>
            )}
          </Section>

          <Section title="Payment History" color="#22c55e">
            {payments.length === 0 ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)', textAlign: 'center', padding: '12px 0' }}>No payments recorded</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date', 'Amount', 'Method', 'Reference'].map((h) => (
                      <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '0 0 8px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--if-border)' }}>
                      <td style={{ padding: '9px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)' }}>{formatDate(p.payment_date)}</td>
                      <td style={{ padding: '9px 0', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{formatCurrency(p.amount)}</td>
                      <td style={{ padding: '9px 0' }}><Badge variant="yellow" size="sm">{p.payment_method?.replace('_', ' ')}</Badge></td>
                      <td style={{ padding: '9px 0', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--if-muted)' }}>{p.reference_no || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="Recent Access Logs" color="#38bdf8">
            {accessLogs.length === 0 ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)', textAlign: 'center', padding: '12px 0' }}>No access logs yet</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date & Time', 'Method', 'Status', 'Reason'].map((h) => (
                      <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '0 0 8px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accessLogs.map((a) => (
                    <tr key={a.id} style={{ borderTop: '1px solid var(--if-border)' }}>
                      <td style={{ padding: '9px 0', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--if-text2)' }}>{formatDateTime(a.accessed_at)}</td>
                      <td style={{ padding: '9px 0' }}><Badge variant="blue" size="sm">{a.method}</Badge></td>
                      <td style={{ padding: '9px 0' }}><Badge variant={a.status === 'granted' ? 'active' : 'expired'} size="sm">{a.status}</Badge></td>
                      <td style={{ padding: '9px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>{a.denied_reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </div>
      </div>

      <RenewModal
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        memberId={memberId}
        memberName={name}
        onSuccess={() => { setRenewOpen(false); fetchMember(); }}
      />
    </>
  );
}
