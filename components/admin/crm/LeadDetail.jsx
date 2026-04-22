'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Phone, Mail, UserCheck, ExternalLink, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/utils/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { followupSchema, flattenZodErrors } from '@/lib/schemas/index';

const STATUS_VARIANT = {
  new: 'blue', contacted: 'yellow', interested: 'purple',
  converted: 'active', lost: 'expired',
};

const STATUSES = ['new', 'contacted', 'interested', 'converted', 'lost'];

export default function LeadDetail({ leadId }) {
  const router   = useRouter();
  const supabase = createClient();

  const [lead,          setLead]          = useState(null);
  const [followups,     setFollowups]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [followupOpen,  setFollowupOpen]  = useState(false);
  const [addingFU,      setAddingFU]      = useState(false);
  const [fuErrors,      setFuErrors]      = useState({});
  const [fuForm,        setFuForm]        = useState({ method: '', notes: '' });
  const [updatingStatus,setUpdatingStatus]= useState(false);
  const [memberName,    setMemberName]    = useState(null);

  useEffect(() => { fetchLead(); }, [leadId]);

  async function fetchLead() {
    setLoading(true);
    const [{ data: l }, { data: f }] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).single(),
      supabase.from('lead_followups').select('*').eq('lead_id', leadId).order('followed_at', { ascending: false }),
    ]);
    setLead(l);
    setFollowups(f || []);

    // If converted, fetch member name
    if (l?.converted_member_id) {
      const { data: member } = await supabase
        .from('members')
        .select('id, profile:profiles(first_name, last_name)')
        .eq('id', l.converted_member_id)
        .single();
      if (member) {
        setMemberName(`${member.profile?.first_name || ''} ${member.profile?.last_name || ''}`.trim());
      }
    }

    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm('Permanently delete this lead? This cannot be undone.')) return;
    try {
      await supabase.from('lead_followups').delete().eq('lead_id', leadId);
      await supabase.from('leads').delete().eq('id', leadId);
      router.push('/admin/crm');
    } catch (err) {
      alert(err?.message || 'Failed to delete lead');
    }
  }

  async function updateStatus(status) {
    // Confirm before converting — irreversible action
    if (status === 'converted') {
      if (!confirm('Convert this lead to a member? This will permanently remove them from the leads list and cannot be undone.')) return;
    }
    setUpdatingStatus(true);
    try {
      // If converting — find matching member by email/phone and link
      if (status === 'converted') {
        let memberId = null;

        if (lead.email) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', lead.email)
            .maybeSingle();

          if (profile) {
            const { data: member } = await supabase
              .from('members')
              .select('id')
              .eq('profile_id', profile.id)
              .maybeSingle();
            if (member) memberId = member.id;
          }
        }

        // Delete converted lead from DB permanently
        await supabase.from('lead_followups').delete().eq('lead_id', leadId);
        await supabase.from('leads').delete().eq('id', leadId);
        router.push('/admin/crm');
        return;
      } else {
        await supabase.from('leads').update({ status }).eq('id', leadId);
      }

      fetchLead();
    } catch (err) {
      console.error('Update status error:', err?.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function addFollowup() {
    const result = followupSchema.safeParse(fuForm);
    const e = flattenZodErrors(result);
    if (!result.success) { setFuErrors(e); return; }

    setAddingFU(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from('lead_followups').insert({
        lead_id:     leadId,
        method:      fuForm.method,
        notes:       fuForm.notes,
        followed_by: user.id,
        followed_at: new Date().toISOString(),
      });
      if (insertError) throw new Error(insertError.message);
      setFollowupOpen(false);
      setFuForm({ method: '', notes: '' });
      fetchLead();
    } catch (err) {
      alert(err?.message || 'Failed to add followup');
    } finally {
      setAddingFU(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (!lead) return <div style={{ color: 'var(--if-muted)', padding: 40, textAlign: 'center' }}>Lead not found.</div>;

  const isConverted = lead.status === 'converted';
  const isLost      = lead.status === 'lost';
  const isDone      = isConverted || isLost;
  const name        = [lead.first_name, lead.last_name].filter(Boolean).join(' ');

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button onClick={() => router.push('/admin/crm')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-muted)', padding: 0, transition: 'color .15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
        >
          <ArrowLeft size={15} /> Back to CRM
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          {!isDone && (
            <Button variant="ghost" size="sm" icon={<Plus size={13} />} onClick={() => setFollowupOpen(true)}>
              Add Followup
            </Button>
          )}
          {!isConverted && (
            <Button size="sm" icon={<UserCheck size={13} />} onClick={() => updateStatus('converted')} loading={updatingStatus}>
              Mark as Converted
            </Button>
          )}
          {isLost && (
            <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>
              Delete Lead
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profile card */}
          <div style={{
            background: 'var(--if-card)', border: `1px solid ${isDone ? 'var(--if-border)' : 'var(--if-border)'}`,
            borderRadius: 12, padding: '20px',
            opacity: isDone ? 0.85 : 1,
          }}>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800,
              color: 'var(--if-text)', marginBottom: 6,
              textDecoration: isDone ? 'line-through' : 'none',
              color: isDone ? 'var(--if-muted)' : 'var(--if-text)',
            }}>
              {name}
            </h2>

            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              <Badge variant={STATUS_VARIANT[lead.status] || 'default'}>{lead.status}</Badge>
              <Badge variant="yellow" size="sm">{lead.source?.replace('_', ' ')}</Badge>
            </div>

            {/* Contact info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {lead.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text2)' }}>
                  <Phone size={13} style={{ color: 'var(--if-muted)' }} />{lead.phone}
                </div>
              )}
              {lead.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text2)' }}>
                  <Mail size={13} style={{ color: 'var(--if-muted)' }} />{lead.email}
                </div>
              )}
            </div>

            {/* Converted — link to member */}
            {isConverted && (
              <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid #22c55e', borderRadius: 8, marginBottom: 10 }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#22c55e', marginBottom: 4 }}>
                  ✓ Converted to Member
                </p>
                {memberName && lead.converted_member_id ? (
                  <button
                    onClick={() => router.push(`/admin/members/${lead.converted_member_id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#22c55e', padding: 0 }}
                  >
                    {memberName} <ExternalLink size={12} />
                  </button>
                ) : (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#22c55e' }}>
                    Member record linked
                  </p>
                )}
              </div>
            )}

            {lead.notes && (
              <div style={{ padding: '10px', background: 'var(--if-bg3)', borderRadius: 8 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)', lineHeight: 1.6 }}>{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Status update — only for active leads */}
          {!isDone && (
            <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-muted)', marginBottom: 10 }}>
                Update Status
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STATUSES.filter((s) => s !== 'converted').map((s) => (
                  <button key={s} onClick={() => updateStatus(s)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${lead.status === s ? 'var(--if-accent)' : 'var(--if-border2)'}`, background: lead.status === s ? 'var(--if-accentbg2)' : 'transparent', fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: lead.status === s ? 'var(--if-accent)' : 'var(--if-text2)', cursor: 'pointer', textAlign: 'left', textTransform: 'capitalize', transition: 'all .15s' }}
                    disabled={updatingStatus}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — followups */}
        <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--if-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--if-text)' }}>
              Followup History ({followups.length})
            </span>
            {!isDone && (
              <Button size="sm" variant="ghost" icon={<Plus size={13} />} onClick={() => setFollowupOpen(true)}>Add</Button>
            )}
          </div>

          <div style={{ padding: '16px 18px' }}>
            {followups.length === 0 ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)', textAlign: 'center', padding: '20px 0' }}>
                {isDone ? 'No followups recorded.' : 'No followups yet. Add the first one.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {followups.map((f) => (
                  <div key={f.id} style={{ padding: '14px', background: 'var(--if-bg3)', borderRadius: 10, border: '1px solid var(--if-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Badge variant="yellow" size="sm">{f.method?.replace('_', ' ')}</Badge>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--if-muted)' }}>{formatDateTime(f.followed_at)}</span>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text2)', lineHeight: 1.6 }}>{f.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Followup Modal */}
      <Modal open={followupOpen} onClose={() => setFollowupOpen(false)} title="Add Followup" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFollowupOpen(false)}>Cancel</Button>
            <Button loading={addingFU} onClick={addFollowup}>Save Followup</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="Method" required value={fuForm.method}
            onChange={(e) => setFuForm((p) => ({ ...p, method: e.target.value }))}
            error={fuErrors.method}
            options={[
              { value: 'call',      label: 'Phone Call' },
              { value: 'whatsapp',  label: 'WhatsApp'   },
              { value: 'email',     label: 'Email'      },
              { value: 'in_person', label: 'In Person'  },
              { value: 'walk_in',   label: 'Walk-in'    },
              { value: 'other',     label: 'Other'      },
            ]}
            placeholder="Select method"
          />
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-text2)', display: 'block', marginBottom: 6 }}>
              Notes *
            </label>
            <textarea value={fuForm.notes} onChange={(e) => setFuForm((p) => ({ ...p, notes: e.target.value }))} rows={3}
              placeholder="What was discussed?"
              style={{ width: '100%', background: 'var(--if-card)', border: `1px solid ${fuErrors.notes ? 'var(--if-red)' : 'var(--if-border2)'}`, borderRadius: 8, padding: '10px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', outline: 'none', resize: 'vertical' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--if-accent)'; }}
              onBlur={(e)  => { e.target.style.borderColor = fuErrors.notes ? 'var(--if-red)' : 'var(--if-border2)'; }}
            />
            {fuErrors.notes && <p style={{ color: 'var(--if-red)', fontSize: 12, marginTop: 4 }}>{fuErrors.notes}</p>}
          </div>
        </div>
      </Modal>
    </>
  );
}
