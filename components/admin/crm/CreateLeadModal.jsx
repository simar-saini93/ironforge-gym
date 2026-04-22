'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { leadSchema, flattenZodErrors } from '@/lib/schemas/index';

export default function CreateLeadModal({ open, onClose, onSuccess }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', source: '', status: 'new', notes: '' });

  function onChange(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  async function handleSubmit() {
    const result = leadSchema.safeParse(form);
    const e = flattenZodErrors(result);
    if (!result.success) { setErrors(e); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile }  = await supabase.from('profiles').select('branch_id').eq('id', user.id).single();

      const { error } = await supabase.from('leads').insert({
        branch_id: profile.branch_id,
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        email:     form.email || null,
        phone:     form.phone || null,
        source:    form.source,
        status:    form.status,
        notes:     form.notes || null,
        
      });

      if (error) throw error;
      onSuccess();
      setForm({ first_name: '', last_name: '', email: '', phone: '', source: '', status: 'new', notes: '' });
    } catch (err) {
      alert(err?.message || 'Failed to add lead');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Lead" size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button icon={<UserPlus size={14} />} loading={loading} onClick={handleSubmit}>Add Lead</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="First Name" required value={form.first_name} onChange={(e) => onChange('first_name', e.target.value)} error={errors.first_name} />
          <Input label="Last Name" value={form.last_name} onChange={(e) => onChange('last_name', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} error={errors.phone} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} error={errors.email} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Source" required value={form.source} onChange={(e) => onChange('source', e.target.value)} error={errors.source}
            options={[{ value: 'walk_in', label: 'Walk-in' }, { value: 'referral', label: 'Referral' }, { value: 'instagram', label: 'Instagram' }, { value: 'facebook', label: 'Facebook' }, { value: 'google', label: 'Google' }, { value: 'other', label: 'Other' }]}
            placeholder="Select source"
          />
          <Select label="Status" value={form.status} onChange={(e) => onChange('status', e.target.value)}
            options={[{ value: 'new', label: 'New' }, { value: 'contacted', label: 'Contacted' }, { value: 'interested', label: 'Interested' }]}
            placeholder="Select status"
          />
        </div>
        <div>
          <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-text2)', display: 'block', marginBottom: 6 }}>Notes</label>
          <textarea value={form.notes} onChange={(e) => onChange('notes', e.target.value)} rows={2}
            style={{ width: '100%', background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '10px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', outline: 'none', resize: 'vertical' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--if-accent)'; }}
            onBlur={(e)  => { e.target.style.borderColor = 'var(--if-border2)'; }}
          />
        </div>
      </div>
    </Modal>
  );
}
