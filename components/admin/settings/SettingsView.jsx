'use client';
import CurrencySettings from '@/components/admin/settings/CurrencySettings';
import { formatCurrency } from '@/utils/format';

import { useState, useEffect } from 'react';
import { Save, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { PageSpinner } from '@/components/ui/Spinner';
import { branchSchema, planSchema, flattenZodErrors } from '@/lib/schemas/index';

// ── Section wrapper ──────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div style={{
      background:   'var(--if-card)',
      border:       '1px solid var(--if-border)',
      borderRadius: 12,
      overflow:     'hidden',
    }}>
      <div style={{
        padding:      '16px 22px',
        borderBottom: '1px solid var(--if-border)',
      }}>
        <h2 style={{
          fontFamily:    "'Outfit', sans-serif",
          fontSize:      15, fontWeight: 700,
          color:         'var(--if-text)',
          letterSpacing: '-.01em',
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize:   13, color: 'var(--if-muted)', marginTop: 2,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ padding: '22px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Plan row ─────────────────────────────────────────────────
function PlanRow({ plan, onEdit, onDelete, onToggle }) {
  const CYCLE_LABEL = {
    day_pass: 'Day Pass',
    weekly:   'Weekly',
    monthly:  'Monthly',
    yearly:   'Yearly',
  };

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          12,
      padding:      '14px 16px',
      background:   'var(--if-bg3)',
      border:       '1px solid var(--if-border)',
      borderRadius: 10,
      transition:   'border-color .15s',
    }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--if-border2)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--if-border)')}
    >
      {/* Cycle badge */}
      <div style={{
        width:          80, flexShrink: 0,
        fontFamily:     "'Outfit', sans-serif",
        fontSize:       12, fontWeight: 700,
        color:          plan.is_active ? 'var(--if-accent)' : 'var(--if-muted)',
        textTransform:  'uppercase', letterSpacing: '.05em',
      }}>
        {CYCLE_LABEL[plan.billing_cycle] || plan.billing_cycle}
      </div>

      {/* Price */}
      <div style={{ flex: 1 }}>
        <span style={{
          fontFamily:    "'Outfit', sans-serif",
          fontSize:      20, fontWeight: 800,
          color:         plan.is_active ? 'var(--if-text)' : 'var(--if-muted)',
          letterSpacing: '-.02em',
        }}>
          {formatCurrency(plan.price)}
        </span>
        {plan.description && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize:   12, color: 'var(--if-muted)', marginTop: 2,
          }}>
            {plan.description}
          </p>
        )}
      </div>

      {/* Status */}
      <Badge variant={plan.is_active ? 'active' : 'expired'}>
        {plan.is_active ? 'Active' : 'Inactive'}
      </Badge>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onToggle(plan)}
          title={plan.is_active ? 'Deactivate' : 'Activate'}
          style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'transparent',
            border: `1px solid ${plan.is_active ? 'var(--if-border2)' : 'rgba(34,197,94,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: plan.is_active ? 'var(--if-muted)' : '#22c55e',
            cursor: 'pointer', transition: 'all .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = plan.is_active ? 'var(--if-red)' : '#22c55e';
            e.currentTarget.style.color       = plan.is_active ? 'var(--if-red)' : '#22c55e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = plan.is_active ? 'var(--if-border2)' : 'rgba(34,197,94,0.3)';
            e.currentTarget.style.color       = plan.is_active ? 'var(--if-muted)' : '#22c55e';
          }}
        >
          {plan.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
        </button>

        <button
          onClick={() => onEdit(plan)}
          title="Edit"
          style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'transparent', border: '1px solid var(--if-border2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--if-text2)', cursor: 'pointer', transition: 'all .15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
        >
          <Edit2 size={13} />
        </button>

        <button
          onClick={() => onDelete(plan)}
          title="Delete"
          style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'transparent', border: '1px solid var(--if-border2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--if-muted)', cursor: 'pointer', transition: 'all .15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-red)'; e.currentTarget.style.color = 'var(--if-red)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-muted)'; }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Plan Modal (create + edit) ───────────────────────────────
function PlanModal({ open, onClose, plan, onSuccess }) {
  const supabase = createClient();
  const isEdit   = !!plan?.id;

  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [form, setForm] = useState({
    billing_cycle: '',
    price:         '',
    description:   '',
    is_active:     true,
  });

  useEffect(() => {
    if (plan) {
      setForm({
        billing_cycle: plan.billing_cycle || '',
        price:         String(plan.price  || ''),
        description:   plan.description   || '',
        is_active:     plan.is_active ?? true,
      });
    } else {
      setForm({ billing_cycle: '', price: '', description: '', is_active: true });
    }
    setErrors({});
  }, [plan, open]);

  function onChange(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  async function handleSubmit() {
    const result = planSchema.safeParse(form);
    const e      = flattenZodErrors(result);
    if (!result.success) { setErrors(e); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile }  = await supabase
        .from('profiles').select('branch_id').eq('id', user.id).single();

      const payload = {
        billing_cycle: form.billing_cycle,
        price:         Number(form.price),
        description:   form.description || null,
        is_active:     form.is_active,
        branch_id:     profile.branch_id,
      };

      if (isEdit) {
        const { error } = await supabase
          .from('membership_plans').update(payload).eq('id', plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('membership_plans').insert(payload);
        if (error) throw error;
      }

      onSuccess();
    } catch (err) {
      console.error('Plan save error:', err?.message);
      alert(err?.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Plan' : 'Add New Plan'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button loading={loading} onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Create Plan'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <Select
          label="Billing Cycle"
          required
          value={form.billing_cycle}
          onChange={(e) => onChange('billing_cycle', e.target.value)}
          error={errors.billing_cycle}
          options={[
            { value: 'day_pass', label: 'Day Pass'  },
            { value: 'weekly',   label: 'Weekly'    },
            { value: 'monthly',  label: 'Monthly'   },
            { value: 'yearly',   label: 'Yearly'    },
          ]}
          placeholder="Select billing cycle"
          disabled={isEdit} // can't change cycle on edit
        />

        <Input
          label="Price"
          required
          type="number"
          value={form.price}
          onChange={(e) => onChange('price', e.target.value)}
          error={errors.price}
          placeholder="e.g. 1500"
        />

        <Input
          label="Description"
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="e.g. Full month unlimited access"
          hint="Optional — shown on member-facing pages"
        />

        {/* Active toggle */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          padding:       '12px 14px',
          background:    'var(--if-bg3)',
          borderRadius:  8,
          border:        '1px solid var(--if-border)',
        }}>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>
              Active
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>
              Inactive plans won't appear during member creation
            </p>
          </div>
          <button
            onClick={() => onChange('is_active', !form.is_active)}
            style={{
              width:        44, height: 24,
              borderRadius: 12,
              background:   form.is_active ? 'var(--if-accent)' : 'var(--if-border2)',
              border:       'none', cursor: 'pointer',
              position:     'relative', transition: 'background .2s',
              flexShrink:   0,
            }}
          >
            <div style={{
              position:   'absolute',
              top:        3, left: form.is_active ? 22 : 3,
              width:      18, height: 18,
              borderRadius: '50%',
              background:  '#fff',
              transition:  'left .2s',
              boxShadow:   '0 1px 3px rgba(0,0,0,.3)',
            }} />
          </button>
        </div>

      </div>
    </Modal>
  );
}

// ── Main SettingsView ─────────────────────────────────────────
export default function SettingsView() {
  const supabase = createClient();

  const [branchLoading, setBranchLoading] = useState(true);
  const [branchSaving,  setBranchSaving]  = useState(false);
  const [branchId,      setBranchId]      = useState(null);
  const [branchErrors,  setBranchErrors]  = useState({});
  const [branchSaved,   setBranchSaved]   = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: '', address: '', phone: '', email: '',
  });

  const [plans,       setPlans]       = useState([]);
  const [plansLoading,setPlansLoading] = useState(true);
  const [planModal,   setPlanModal]   = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => { fetchBranch(); fetchPlans(); }, []);

  async function fetchBranch() {
    setBranchLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile }  = await supabase
      .from('profiles').select('branch_id').eq('id', user.id).single();

    if (!profile?.branch_id) { setBranchLoading(false); return; }
    setBranchId(profile.branch_id);

    const { data } = await supabase
      .from('branches').select('*').eq('id', profile.branch_id).single();

    if (data) {
      setBranchForm({
        name:    data.name    || '',
        address: data.address || '',
        phone:   data.phone   || '',
        email:   data.email   || '',
      });
    }
    setBranchLoading(false);
  }

  async function fetchPlans() {
    setPlansLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile }  = await supabase
      .from('profiles').select('branch_id').eq('id', user.id).single();

    const { data } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('branch_id', profile.branch_id)
      .order('price', { ascending: true });

    setPlans(data || []);
    setPlansLoading(false);
  }

  async function saveBranch() {
    const result = branchSchema.safeParse(branchForm);
    const e      = flattenZodErrors(result);
    if (!result.success) { setBranchErrors(e); return; }

    setBranchSaving(true);
    try {
      const { error } = await supabase
        .from('branches')
        .update({
          name:    branchForm.name.trim(),
          address: branchForm.address || null,
          phone:   branchForm.phone   || null,
          email:   branchForm.email   || null,
        })
        .eq('id', branchId);

      if (error) throw error;
      setBranchSaved(true);
      setTimeout(() => setBranchSaved(false), 3000);
    } catch (err) {
      alert(err?.message || 'Failed to save branch settings');
    } finally {
      setBranchSaving(false);
    }
  }

  async function togglePlan(plan) {
    await supabase
      .from('membership_plans')
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id);
    fetchPlans();
  }

  async function deletePlan(plan) {
    if (!confirm(`Delete "${plan.billing_cycle}" plan? This cannot be undone.`)) return;
    const { error } = await supabase
      .from('membership_plans').delete().eq('id', plan.id);
    if (error) {
      alert('Cannot delete — this plan may have active subscriptions.');
      return;
    }
    fetchPlans();
  }

  if (branchLoading) return <PageSpinner />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Branch Settings ── */}
      <Section
        title="Branch Settings"
        subtitle="Update your gym's basic information"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Gym Name"
            required
            value={branchForm.name}
            onChange={(e) => { setBranchForm((p) => ({ ...p, name: e.target.value })); setBranchErrors((p) => ({ ...p, name: undefined })); }}
            error={branchErrors.name}
            placeholder="IronForge Gym"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input
              label="Phone"
              type="tel"
              value={branchForm.phone}
              onChange={(e) => setBranchForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+91 98765 43210"
            />
            <Input
              label="Email"
              type="email"
              value={branchForm.email}
              onChange={(e) => setBranchForm((p) => ({ ...p, email: e.target.value }))}
              error={branchErrors.email}
              placeholder="info@ironforge.com"
            />
          </div>

          <div>
            <label style={{
              fontFamily:    "'Outfit', sans-serif",
              fontSize:      11, fontWeight: 700,
              letterSpacing: '.15em', textTransform: 'uppercase',
              color:         'var(--if-text2)', display: 'block', marginBottom: 6,
            }}>
              Address
            </label>
            <textarea
              value={branchForm.address}
              onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))}
              rows={2}
              placeholder="Full gym address..."
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            {branchSaved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                <Check size={15} /> Saved
              </div>
            )}
            <Button icon={<Save size={14} />} loading={branchSaving} onClick={saveBranch}>
              Save Settings
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Plan Settings ── */}
      <Section
        title="Membership Plans"
        subtitle="Manage billing cycles and pricing for your gym"
      >
        {plansLoading ? (
          <PageSpinner />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Plan list */}
            {plans.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '32px 0',
                color: 'var(--if-muted)',
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              }}>
                No plans yet. Add your first plan below.
              </div>
            ) : (
              plans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  onEdit={(p) => { setEditingPlan(p); setPlanModal(true); }}
                  onDelete={deletePlan}
                  onToggle={togglePlan}
                />
              ))
            )}

            {/* Add plan button */}
            <button
              onClick={() => { setEditingPlan(null); setPlanModal(true); }}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            8,
                height:         44,
                borderRadius:   10,
                border:         '2px dashed var(--if-border2)',
                background:     'transparent',
                fontFamily:     "'Outfit', sans-serif",
                fontSize:       13, fontWeight: 600,
                color:          'var(--if-muted)',
                cursor:         'pointer',
                transition:     'all .15s',
                marginTop:      4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--if-accent)';
                e.currentTarget.style.color       = 'var(--if-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--if-border2)';
                e.currentTarget.style.color       = 'var(--if-muted)';
              }}
            >
              <Plus size={16} /> Add New Plan
            </button>
          </div>
        )}
      </Section>

      {/* Currency */}
      <CurrencySettings />

      {/* Plan Modal */}
      <PlanModal
        open={planModal}
        onClose={() => { setPlanModal(false); setEditingPlan(null); }}
        plan={editingPlan}
        onSuccess={() => { setPlanModal(false); setEditingPlan(null); fetchPlans(); }}
      />
    </div>
  );
}
