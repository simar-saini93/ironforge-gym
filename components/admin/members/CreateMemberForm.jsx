'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, CreditCard, CheckCircle2, ChevronRight, ChevronLeft, Upload, X, ArrowLeft, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { memberStep1Schema, memberStep2Schema, flattenZodErrors } from '@/lib/schemas/member';
import { formatCurrency } from '@/utils/format';

// ── Step indicator ───────────────────────────────────────────
function StepBar({ current }) {
  const STEPS = [
    { n: 1, label: 'Personal Info',  icon: User       },
    { n: 2, label: 'Plan & Payment', icon: CreditCard  },
    { n: 3, label: 'Confirm',        icon: CheckCircle2},
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
      {STEPS.map((step, i) => {
        const done    = current > step.n;
        const active  = current === step.n;
        const Icon    = step.icon;

        return (
          <div key={step.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width:          36, height: 36, borderRadius: '50%',
                display:        'flex', alignItems: 'center', justifyContent: 'center',
                background:     done ? 'var(--if-accent)' : active ? 'var(--if-accentbg2)' : 'var(--if-bg3)',
                border:         active ? '2px solid var(--if-accent)' : done ? 'none' : '1px solid var(--if-border2)',
                color:          done ? '#000' : active ? 'var(--if-accent)' : 'var(--if-muted)',
                transition:     'all .2s',
              }}>
                <Icon size={16} />
              </div>
              <span style={{
                fontFamily:    "'Outfit', sans-serif",
                fontSize:      11, fontWeight: active || done ? 600 : 400,
                color:         active ? 'var(--if-accent)' : done ? 'var(--if-text)' : 'var(--if-muted)',
                whiteSpace:    'nowrap',
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 1, margin: '0 12px', marginBottom: 22,
                background: done ? 'var(--if-accent)' : 'var(--if-border2)',
                transition: 'background .2s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── STEP 1 — Personal Info ───────────────────────────────────
function Step1({ data, onChange, errors }) {
  const [preview, setPreview] = useState(null);

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    onChange('photo', file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Profile photo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 12,
          background: 'var(--if-bg3)', border: '2px dashed var(--if-border2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0, position: 'relative',
        }}>
          {preview
            ? <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <User size={28} style={{ color: 'var(--if-muted)' }} />
          }
        </div>
        <div>
          <label htmlFor="photo-upload" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600,
            color: 'var(--if-accent)', cursor: 'pointer',
          }}>
            <Upload size={13} />
            {preview ? 'Change Photo' : 'Upload Photo'}
          </label>
          <input id="photo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)', marginTop: 3 }}>
            JPG, PNG up to 5MB. Optional.
          </p>
          {preview && (
            <button onClick={() => { onChange('photo', null); setPreview(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--if-red)', fontSize: 11, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Name row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Input label="First Name" required value={data.first_name} onChange={(e) => onChange('first_name', e.target.value)} error={errors.first_name} placeholder="John" />
        <Input label="Last Name"  required value={data.last_name}  onChange={(e) => onChange('last_name',  e.target.value)} error={errors.last_name}  placeholder="Doe" />
      </div>

      {/* Email + Phone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Input label="Email Address" required type="email" value={data.email} onChange={(e) => onChange('email', e.target.value)} error={errors.email} placeholder="john@email.com" />
        <Input label="Phone Number"  required type="tel"   value={data.phone} onChange={(e) => onChange('phone', e.target.value)} error={errors.phone} placeholder="+91 98765 43210" />
      </div>

      {/* DOB + Gender */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Input label="Date of Birth" type="date" value={data.dob} onChange={(e) => onChange('dob', e.target.value)} />
        <Select
          label="Gender"
          value={data.gender}
          onChange={(e) => onChange('gender', e.target.value)}
          options={[
            { value: 'male',   label: 'Male'   },
            { value: 'female', label: 'Female' },
            { value: 'other',  label: 'Other'  },
          ]}
          placeholder="Select gender"
        />
      </div>

      {/* Address */}
      <div>
        <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-text2)', display: 'block', marginBottom: 6 }}>
          Address
        </label>
        <textarea
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Full address..."
          rows={2}
          style={{
            width: '100%', background: 'var(--if-card)',
            border: '1px solid var(--if-border2)', borderRadius: 8,
            padding: '10px 12px', fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, color: 'var(--if-text)', outline: 'none',
            resize: 'vertical', transition: 'border-color .15s',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--if-accent)'; e.target.style.boxShadow = '0 0 0 3px var(--if-accentbg)'; }}
          onBlur={(e)  => { e.target.style.borderColor = 'var(--if-border2)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Emergency contact */}
      <div style={{ padding: '16px', background: 'var(--if-bg3)', borderRadius: 10, border: '1px solid var(--if-border)' }}>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--if-muted)', marginBottom: 12 }}>
          Emergency Contact
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="Contact Name" value={data.emergency_name} onChange={(e) => onChange('emergency_name', e.target.value)} placeholder="Jane Doe" />
          <Input label="Contact Phone" type="tel" value={data.emergency_phone} onChange={(e) => onChange('emergency_phone', e.target.value)} placeholder="+91 98765 43210" />
        </div>
      </div>
    </div>
  );
}

// ── STEP 2 — Plan & Payment ──────────────────────────────────
function Step2({ data, onChange, errors, plans }) {
  const selectedPlan = plans.find((p) => p.id === data.plan_id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Plan selection */}
      <div>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-text2)', marginBottom: 10 }}>
          Select Plan *
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {plans.map((plan) => {
            const selected = data.plan_id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => onChange('plan_id', plan.id)}
                style={{
                  padding:      '16px 14px',
                  borderRadius: 10,
                  border:       `2px solid ${selected ? 'var(--if-accent)' : 'var(--if-border2)'}`,
                  background:   selected ? 'var(--if-accentbg2)' : 'var(--if-card)',
                  cursor:       'pointer',
                  transition:   'all .15s',
                  textAlign:    'center',
                }}
                onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--if-border)'; }}
                onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--if-border2)'; }}
              >
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: selected ? 'var(--if-accent)' : 'var(--if-text)', textTransform: 'capitalize', marginBottom: 4 }}>
                  {plan.billing_cycle.replace('_', ' ')}
                </p>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: selected ? 'var(--if-accent)' : 'var(--if-text)', lineHeight: 1 }}>
                  {formatCurrency(plan.price)}
                </p>
                {plan.description && (
                  <p style={{ fontSize: 11, color: 'var(--if-muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                    {plan.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {errors.plan_id && <p style={{ color: 'var(--if-red)', fontSize: 12, marginTop: 6 }}>{errors.plan_id}</p>}
      </div>

      {/* Start date */}
      <Input
        label="Start Date"
        required
        type="date"
        value={data.start_date}
        onChange={(e) => onChange('start_date', e.target.value)}
        error={errors.start_date}
      />

      {/* Payment */}
      <div style={{ padding: '16px', background: 'var(--if-bg3)', borderRadius: 10, border: '1px solid var(--if-border)' }}>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--if-muted)', marginBottom: 12 }}>
          Payment Details
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input
            label="Amount Paid"
            required
            type="number"
            value={data.amount_paid}
            onChange={(e) => onChange('amount_paid', e.target.value)}
            error={errors.amount_paid}
            placeholder={selectedPlan ? String(selectedPlan.price) : '0'}
            hint={selectedPlan ? `Plan price: ${formatCurrency(selectedPlan.price)}` : undefined}
          />
          <Select
            label="Payment Method"
            required
            value={data.payment_method}
            onChange={(e) => onChange('payment_method', e.target.value)}
            error={errors.payment_method}
            options={[
              { value: 'cash',          label: 'Cash'          },
              { value: 'card',          label: 'Card'          },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'other',         label: 'Other'         },
            ]}
            placeholder="Select method"
          />
        </div>
        <div style={{ marginTop: 14 }}>
          <Input
            label="Reference Number"
            value={data.reference_no}
            onChange={(e) => onChange('reference_no', e.target.value)}
            placeholder="Receipt / transaction ID (optional)"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-text2)', display: 'block', marginBottom: 6 }}>
          Notes
        </label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder="Any additional notes..."
          rows={2}
          style={{
            width: '100%', background: 'var(--if-card)',
            border: '1px solid var(--if-border2)', borderRadius: 8,
            padding: '10px 12px', fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, color: 'var(--if-text)', outline: 'none',
            resize: 'vertical',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--if-accent)'; e.target.style.boxShadow = '0 0 0 3px var(--if-accentbg)'; }}
          onBlur={(e)  => { e.target.style.borderColor = 'var(--if-border2)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>
    </div>
  );
}

// ── STEP 3 — Confirm ─────────────────────────────────────────
function Step3({ data, plans }) {
  const plan = plans.find((p) => p.id === data.plan_id);

  function Row({ label, value }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--if-border)' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>{label}</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{value || '—'}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary card */}
      <div style={{ background: 'var(--if-bg3)', borderRadius: 12, padding: '20px', border: '1px solid var(--if-border)' }}>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-accent)', marginBottom: 14 }}>
          Member Details
        </p>
        <Row label="Full Name"  value={`${data.first_name} ${data.last_name}`} />
        <Row label="Email"      value={data.email} />
        <Row label="Phone"      value={data.phone} />
        <Row label="DOB"        value={data.dob} />
        <Row label="Gender"     value={data.gender} />
      </div>

      <div style={{ background: 'var(--if-bg3)', borderRadius: 12, padding: '20px', border: '1px solid var(--if-border)' }}>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-accent)', marginBottom: 14 }}>
          Plan & Payment
        </p>
        <Row label="Plan"           value={plan?.billing_cycle?.replace('_', ' ')} />
        <Row label="Start Date"     value={data.start_date} />
        <Row label="Amount Paid"    value={data.amount_paid ? formatCurrency(data.amount_paid) : null} />
        <Row label="Payment Method" value={data.payment_method?.replace('_', ' ')} />
        {data.reference_no && <Row label="Reference" value={data.reference_no} />}
      </div>

      {/* Email notice */}
      <div style={{
        display: 'flex', gap: 12, padding: '14px 16px',
        background: 'var(--if-accentbg2)', borderRadius: 10,
        border: '1px solid var(--if-accent)',
      }}>
        <CheckCircle2 size={18} style={{ color: 'var(--if-accent)', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-accent)' }}>
            Invite + Receipt emails will be sent
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)', marginTop: 2 }}>
            Welcome email with password setup link + payment receipt will be sent to <strong>{data.email}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Form ────────────────────────────────────────────────
const INITIAL = {
  // Step 1
  first_name: '', last_name: '', email: '', phone: '',
  dob: '', gender: '', address: '', photo: null,
  emergency_name: '', emergency_phone: '',
  // Step 2
  plan_id: '', start_date: new Date().toISOString().split('T')[0],
  amount_paid: '', payment_method: '', reference_no: '', notes: '',
};

export default function CreateMemberForm() {
  const router   = useRouter();
  const supabase = createClient();

  const [step,    setStep]    = useState(1);
  const [data,    setData]    = useState(INITIAL);
  const [errors,  setErrors]  = useState({});
  const [plans,   setPlans]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fromLead,   setFromLead]   = useState(false);
  const [leads,      setLeads]      = useState([]);
  const [selectedLead, setSelectedLead] = useState('');

  // Fetch plans
  useEffect(() => {
    supabase
      .from('membership_plans')
      .select('id, billing_cycle, price, description')
      .eq('is_active', true)
      .then(({ data }) => setPlans(data || []));
  }, []);

  // Fetch converted leads that don't have a member yet
  useEffect(() => {
    supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone, date_of_birth, interested_plan_id, emergency_name, emergency_phone')
      .eq('status', 'converted')
      .is('converted_member_id', null)
      .then(({ data }) => setLeads(data || []));
  }, []);

  // When lead is selected — autofill form
  function handleLeadSelect(leadId) {
    setSelectedLead(leadId);
    if (!leadId) {
      setData(INITIAL);
      return;
    }
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    setData((prev) => ({
      ...prev,
      first_name: lead.first_name    || '',
      last_name:  lead.last_name     || '',
      email:      lead.email         || '',
      phone:      lead.phone         || '',
      dob:     lead.date_of_birth    || '',
      plan_id:         lead.interested_plan_id || '',
      emergency_name:  lead.emergency_name      || '',
      emergency_phone: lead.emergency_phone     || '',
    }));
  }

  function onChange(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep1() {
    const result = memberStep1Schema.safeParse(data);
    const e = flattenZodErrors(result);
    setErrors(e);
    return result.success;
  }

  function validateStep2() {
    const result = memberStep2Schema.safeParse(data);
    const e = flattenZodErrors(result);
    setErrors(e);
    return result.success;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // 1. Get current admin's branch_id
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile }  = await supabase
        .from('profiles')
        .select('branch_id')
        .eq('id', user.id)
        .single();

      const branchId = profile.branch_id;

      // 2. Invite user via Supabase Auth
      const { data: inviteData, error: inviteError } = await supabase.auth.admin
        ? await supabase.auth.admin.inviteUserByEmail(data.email, {
            data: { role: 'member' },
            redirectTo: `${window.location.origin}/auth/callback`,
          })
        : { data: null, error: { message: 'Admin client not available' } };

      // Fallback: use signUp if admin.inviteUserByEmail unavailable
      let authUserId;

      if (inviteError) {
        // Use service role via API route
        const res = await fetch('/api/admin/invite-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, firstName: data.first_name }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to invite user');
        authUserId = json.userId;
      } else {
        authUserId = inviteData?.user?.id;
      }

      if (!authUserId) throw new Error('Failed to create auth user');

      // 3. Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id:         authUserId,
        branch_id:  branchId,
        role:       'member',
        first_name: data.first_name.trim(),
        last_name:  data.last_name.trim(),
        email:      data.email.trim().toLowerCase(),
        phone:      data.phone.trim() || null,
      });
      if (profileError) throw profileError;

      // 4. Generate member number
      const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
      const memberNumber = `IGF-${String((count || 0) + 1).padStart(5, '0')}`;

      // 5. Upload profile photo if provided
      let profilePicUrl = null;
      if (data.photo) {
        const ext  = data.photo.name.split('.').pop();
        const path = `members/${authUserId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, data.photo, { upsert: true, contentType: data.photo.type });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          profilePicUrl = urlData.publicUrl;
        }
      }

      // 6. Create member record
      const { data: member, error: memberError } = await supabase.from('members').insert({
        profile_id:      authUserId,
        branch_id:       branchId,
        member_number:   memberNumber,
        profile_pic_url: profilePicUrl,
        date_of_birth:   data.dob || null,
        gender:          data.gender || null,
        address:         data.address || null,
        emergency_name:  data.emergency_name || null,
        emergency_phone: data.emergency_phone || null,
      }).select('id').single();
      if (memberError) throw memberError;

      // 7. Calculate end date based on plan
      const plan = plans.find((p) => p.id === data.plan_id);
      const start = new Date(data.start_date);
      const end   = new Date(start);
      if      (plan?.billing_cycle === 'monthly')  end.setMonth(end.getMonth() + 1);
      else if (plan?.billing_cycle === 'yearly')   end.setFullYear(end.getFullYear() + 1);
      else if (plan?.billing_cycle === 'weekly')   end.setDate(end.getDate() + 7);
      else end.setDate(end.getDate() + 1); // day_pass

      // 8. Create subscription
      const { data: sub, error: subError } = await supabase.from('member_subscriptions').insert({
        member_id:  member.id,
        plan_id:    data.plan_id,
        branch_id:  branchId,
        start_date: data.start_date,
        end_date:   end.toISOString().split('T')[0],
        status:     'active',
        renewed_by: user.id,
        notes:      data.notes || null,
      }).select('id').single();
      if (subError) throw subError;

      // 9. Record payment
      await supabase.from('payments').insert({
        member_id:       member.id,
        subscription_id: sub.id,
        branch_id:       branchId,
        amount:          Number(data.amount_paid),
        payment_method:  data.payment_method,
        reference_no:    data.reference_no || null,
        recorded_by:     user.id,
        notes:           data.notes || null,
      });

      // 10. Send receipt email
      try {
        const { data: paymentRow } = await supabase
          .from('payments')
          .select('id')
          .eq('member_id', member.id)
          .eq('subscription_id', sub.id)
          .single();
        if (paymentRow?.id) {
          await fetch('/api/admin/receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_id: paymentRow.id, type: 'new' }),
          });
        }
      } catch (e) { console.error('Receipt email:', e?.message); }

      // 11. Audit log
      await supabase.from('audit_logs').insert({
        branch_id:  branchId,
        profile_id: user.id,
        action:     'MEMBER_CREATED',
        entity:     'members',
        entity_id:  member.id,
        new_value:  { member_number: memberNumber, email: data.email },
      });

      // 12. If from lead — delete lead from DB (converted leads are removed)
      if (selectedLead) {
        await supabase.from('lead_followups').delete().eq('lead_id', selectedLead);
        await supabase.from('leads').delete().eq('id', selectedLead);
      }

      router.push(`/admin/members/${member.id}?created=true`);

    } catch (err) {
      console.error('Create member error:', err);
      alert(err.message || 'Failed to create member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Back button */}
      <button
        onClick={() => router.push('/admin/members')}
        style={{
          display:     'flex', alignItems: 'center', gap: 6,
          background:  'none', border: 'none',
          cursor:      'pointer', marginBottom: 24, padding: 0,
          fontFamily:  "'Outfit', sans-serif",
          fontSize:    13, fontWeight: 600,
          color:       'var(--if-muted)',
          transition:  'color .15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
      >
        <ArrowLeft size={15} />
        Back to Members
      </button>

      {/* Lead conversion toggle */}
      <div style={{ marginBottom: 24, background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: fromLead ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: fromLead ? 'var(--if-accentbg2)' : 'var(--if-bg3)', border: `1px solid ${fromLead ? 'var(--if-accent)' : 'var(--if-border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={15} style={{ color: fromLead ? 'var(--if-accent)' : 'var(--if-muted)' }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>Convert from Lead</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)' }}>Auto-fill details from a converted lead</p>
            </div>
          </div>
          <button onClick={() => { setFromLead((p) => !p); setSelectedLead(''); setData(INITIAL); }}
            style={{ width: 44, height: 24, borderRadius: 12, background: fromLead ? 'var(--if-accent)' : 'var(--if-border2)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
          >
            <div style={{ position: 'absolute', top: 3, left: fromLead ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
          </button>
        </div>

        {fromLead && (
          <div>
            {leads.length === 0 ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)', padding: '8px 0' }}>
                No converted leads available. Convert a lead from CRM first.
              </p>
            ) : (
              <select
                value={selectedLead}
                onChange={(e) => handleLeadSelect(e.target.value)}
                style={{ width: '100%', height: 40, background: 'var(--if-bg3)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
              >
                <option value=''>Select a lead...</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {`${l.first_name} ${l.last_name || ''}`.trim()} {`${l.phone ? '— ' + l.phone : ''}`}
                  </option>
                ))}
              </select>
            )}
            {selectedLead && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#22c55e', marginTop: 8 }}>
                ✓ Lead details auto-filled below. Review and complete remaining fields.
              </p>
            )}
          </div>
        )}
      </div>

      <StepBar current={step} />

      {/* Step content */}
      <div style={{
        background: 'var(--if-card)', border: '1px solid var(--if-border)',
        borderRadius: 12, padding: '28px',
      }}>
        {step === 1 && <Step1 data={data} onChange={onChange} errors={errors} />}
        {step === 2 && <Step2 data={data} onChange={onChange} errors={errors} plans={plans} />}
        {step === 3 && <Step3 data={data} plans={plans} />}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: step === 1 ? 'flex-end' : 'space-between',
        marginTop: 20, gap: 12,
      }}>
        {step > 1 && (
          <Button
            variant="ghost"
            icon={<ChevronLeft size={15} />}
            onClick={() => setStep((s) => s - 1)}
            disabled={submitting}
          >
            Back
          </Button>
        )}

        {step < 3 ? (
          <Button
            icon={<ChevronRight size={15} />}
            iconPosition="right"
            onClick={handleNext}
          >
            Continue
          </Button>
        ) : (
          <Button
            icon={<CheckCircle2 size={15} />}
            loading={submitting}
            onClick={handleSubmit}
          >
            Create Member & Send Invite
          </Button>
        )}
      </div>
    </div>
  );
}
