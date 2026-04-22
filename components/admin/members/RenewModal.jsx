'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Modal   from '@/components/ui/Modal';
import Button  from '@/components/ui/Button';
import Input   from '@/components/ui/Input';
import Select  from '@/components/ui/Select';
import { renewSchema, flattenZodErrors } from '@/lib/schemas/index';
import { calcEndDate, formatCurrency, formatDate } from '@/utils/format';

export default function RenewModal({ open, onClose, memberId, memberName, onSuccess }) {
  const supabase = createClient();

  const [plans,      setPlans]      = useState([]);
  const [activeSub,  setActiveSub]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(false);
  const [errors,     setErrors]     = useState({});
  const [form, setForm] = useState({
    plan_id: '', start_date: '', amount_paid: '',
    payment_method: '', reference_no: '', notes: '',
  });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFetching(true);

    Promise.all([
      supabase.from('membership_plans').select('id, billing_cycle, price').eq('is_active', true),
      supabase.from('member_subscriptions')
        .select('id, end_date, status, plan:membership_plans(billing_cycle)')
        .eq('member_id', memberId)
        .in('status', ['active', 'frozen'])
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]).then(([{ data: plansData }, { data: sub }]) => {
      setPlans(plansData || []);
      setActiveSub(sub);
      // Auto-set start date to day AFTER active sub ends
      let startDate = new Date().toISOString().split('T')[0];
      if (sub?.end_date) {
        const [y, m, d] = sub.end_date.split('-').map(Number);
        const next = new Date(Date.UTC(y, m - 1, d + 1));
        startDate = next.toISOString().split('T')[0];
      }
      setForm((p) => ({ ...p, start_date: startDate }));
      setFetching(false);
    });
  }, [open, memberId]);

  const selectedPlan = plans.find((p) => p.id === form.plan_id);
  const previewEndDate = form.plan_id && form.start_date
    ? calcEndDate(form.start_date, selectedPlan?.billing_cycle)
    : null;

  function onChange(field, value) {
    if (field === 'plan_id') {
      const plan = plans.find((p) => p.id === value);
      setForm((p) => ({ ...p, plan_id: value, amount_paid: plan ? String(plan.price) : p.amount_paid }));
    } else {
      setForm((p) => ({ ...p, [field]: value }));
    }
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  async function handleSubmit() {
    const result = renewSchema.safeParse({ ...form, member_id: memberId });
    const e = flattenZodErrors(result);
    if (!result.success) { setErrors(e); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile }  = await supabase.from('profiles').select('branch_id').eq('id', user.id).single();

      // Mark current active sub as completed
      if (activeSub?.id) {
        await supabase.from('member_subscriptions')
          .update({ status: 'completed' })
          .eq('id', activeSub.id);
      }

      const endDate = calcEndDate(form.start_date, selectedPlan?.billing_cycle);

      const { data: sub, error: subError } = await supabase
        .from('member_subscriptions')
        .insert({
          member_id:  memberId,
          plan_id:    form.plan_id,
          branch_id:  profile.branch_id,
          start_date: form.start_date,
          end_date:   endDate,
          status:     'active',
          renewed_by: user.id,
          notes:      form.notes || null,
        })
        .select('id').single();

      if (subError) throw subError;

      const { data: paymentInserted } = await supabase.from('payments').insert({
        member_id:       memberId,
        subscription_id: sub.id,
        branch_id:       profile.branch_id,
        amount:          Number(form.amount_paid),
        payment_method:  form.payment_method,
        reference_no:    form.reference_no || null,
        recorded_by:     user.id,
        notes:           form.notes || null,
      }).select('id').single();

      if (paymentInserted?.id) {
        fetch('/api/admin/receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: paymentInserted.id, type: 'renew' }),
        }).catch((e) => console.error('Receipt email error:', e?.message));
      }

      onSuccess();
    } catch (err) {
      console.error('Renew error:', err?.message);
      alert(err?.message || 'Failed to renew subscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Renew — ${memberName}`} size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button icon={<RefreshCw size={14} />} loading={loading} onClick={handleSubmit}>Renew Subscription</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Current sub info */}
        {activeSub && (
          <div style={{ padding: '10px 14px', background: 'var(--if-accentbg2)', border: '1px solid var(--if-accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)' }}>
              Current sub ends
            </span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--if-accent)' }}>
              {formatDate(activeSub.end_date)}
            </span>
          </div>
        )}

        {/* Plan */}
        <div>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-text2)', marginBottom: 10 }}>
            Select Plan *
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {plans.map((plan) => {
              const sel = form.plan_id === plan.id;
              return (
                <div key={plan.id} onClick={() => onChange('plan_id', plan.id)}
                  style={{ padding: '12px', borderRadius: 10, border: `2px solid ${sel ? 'var(--if-accent)' : 'var(--if-border2)'}`, background: sel ? 'var(--if-accentbg2)' : 'var(--if-card)', cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}
                >
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: sel ? 'var(--if-accent)' : 'var(--if-text)', textTransform: 'capitalize', marginBottom: 2 }}>
                    {plan.billing_cycle.replace('_', ' ')}
                  </p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: sel ? 'var(--if-accent)' : 'var(--if-text)' }}>
                    {formatCurrency(plan.price)}
                  </p>
                </div>
              );
            })}
          </div>
          {errors.plan_id && <p style={{ color: 'var(--if-red)', fontSize: 12, marginTop: 4 }}>{errors.plan_id}</p>}
        </div>

        {/* Start date — editable, auto-populated from active sub end date */}
        <Input
          label="Start Date"
          required
          type="date"
          value={form.start_date}
          onChange={(e) => onChange('start_date', e.target.value)}
          error={errors.start_date}
          hint={activeSub ? `Auto-set from current sub end date` : undefined}
        />

        {/* End date preview */}
        {previewEndDate && (
          <div style={{ padding: '8px 14px', background: 'var(--if-bg3)', border: '1px solid var(--if-border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>New sub ends</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--if-text)' }}>{formatDate(previewEndDate)}</span>
          </div>
        )}

        {/* Payment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Amount Paid" required type="number" value={form.amount_paid}
            onChange={(e) => onChange('amount_paid', e.target.value)} error={errors.amount_paid}
            hint={selectedPlan ? `Plan: ${formatCurrency(selectedPlan.price)}` : undefined}
          />
          <Select label="Payment Method" required value={form.payment_method}
            onChange={(e) => onChange('payment_method', e.target.value)} error={errors.payment_method}
            options={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'other', label: 'Other' }]}
            placeholder="Select method"
          />
        </div>

        <Input label="Reference No" value={form.reference_no}
          onChange={(e) => onChange('reference_no', e.target.value)}
          placeholder="Receipt / transaction ID (optional)"
        />
      </div>
    </Modal>
  );
}
