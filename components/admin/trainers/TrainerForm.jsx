'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { trainerSchema, flattenZodErrors } from '@/lib/schemas/index';
import { memberInviteTemplate } from '@/lib/email/templates';

export default function TrainerForm({ trainerId }) {
  const isEdit   = !!trainerId;
  const router   = useRouter();
  const supabase = createClient();

  const [loading,   setLoading]   = useState(isEdit);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});
  const [profileId, setProfileId] = useState(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    specialization: '', bio: '', 
  });

  useEffect(() => {
    if (!isEdit) return;
    supabase
      .from('trainers')
      .select('hire_date, specialization, bio, profile:profiles(id, first_name, last_name, email, phone)')
      .eq('id', trainerId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setProfileId(data.profile?.id);
        setForm({
          first_name:     data.profile?.first_name || '',
          last_name:      data.profile?.last_name  || '',
          email:          data.profile?.email      || '',
          phone:          data.profile?.phone      || '',
          specialization: data.specialization       || '',
          bio:            data.bio                  || '',
          
        });
        setLoading(false);
      });
  }, [trainerId]);

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit() {
    const schema = isEdit ? trainerSchema.omit({ email: true }) : trainerSchema;
    const result = schema.safeParse(form);
    const e = flattenZodErrors(result);
    if (!result.success) { setErrors(e); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase.from('profiles').select('branch_id').eq('id', user.id).single();
      const branchId = adminProfile.branch_id;

      if (isEdit) {
        // Update existing
        await Promise.all([
          supabase.from('profiles').update({ first_name: form.first_name.trim(), last_name: form.last_name.trim(), phone: form.phone || null }).eq('id', profileId),
          supabase.from('trainers').update({ specialization: form.specialization || null, bio: form.bio || null, hire_date: form.hire_date || null }).eq('id', trainerId),
        ]);
        router.push(`/admin/trainers/${trainerId}`);
      } else {
        // Create new trainer via API
        const res = await fetch('/api/admin/invite-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, firstName: form.first_name, role: 'trainer' }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to create user');

        const authUserId = json.userId;

        await supabase.from('profiles').insert({
          id: authUserId, branch_id: branchId, role: 'trainer',
          first_name: form.first_name.trim(), last_name: form.last_name.trim(),
          email: form.email.trim().toLowerCase(), phone: form.phone || null,
        });

        await supabase.from('trainers').insert({
          profile_id: authUserId, branch_id: branchId,
          specialization: form.specialization || null,
          bio: form.bio || null,
          
          is_active: true,
        });

        router.push('/admin/trainers');
      }
    } catch (err) {
      console.error('Trainer form error:', err?.message);
      alert(err?.message || 'Failed to save trainer');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button
        onClick={() => router.push(isEdit ? `/admin/trainers/${trainerId}` : '/admin/trainers')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-muted)', marginBottom: 24, padding: 0, transition: 'color .15s' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
      >
        <ArrowLeft size={15} /> {isEdit ? 'Back to Trainer' : 'Back to Trainers'}
      </button>

      <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, padding: '28px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--if-text)', marginBottom: 24 }}>
          {isEdit ? 'Edit Trainer' : 'Add New Trainer'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="First Name" required value={form.first_name} onChange={(e) => onChange('first_name', e.target.value)} error={errors.first_name} />
            <Input label="Last Name"  required value={form.last_name}  onChange={(e) => onChange('last_name',  e.target.value)} error={errors.last_name} />
          </div>

          {!isEdit && (
            <Input label="Email Address" required type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} error={errors.email}
              hint="An invite email will be sent to this address"
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Phone Number" required type="tel" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} error={errors.phone} />
            
          </div>

          <Input label="Specialization" value={form.specialization} onChange={(e) => onChange('specialization', e.target.value)} placeholder="e.g. Strength & Conditioning, Yoga, Boxing" />

          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-text2)', display: 'block', marginBottom: 6 }}>Bio</label>
            <textarea value={form.bio} onChange={(e) => onChange('bio', e.target.value)} rows={3} placeholder="Brief bio about the trainer..."
              style={{ width: '100%', background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '10px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--if-text)', outline: 'none', resize: 'vertical' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--if-accent)'; e.target.style.boxShadow = '0 0 0 3px var(--if-accentbg)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'var(--if-border2)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {!isEdit && (
            <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--if-accentbg2)', borderRadius: 8, border: '1px solid var(--if-accent)' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--if-accent)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)' }}>
                An invite email will be sent to the trainer to set up their password.
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <Button variant="ghost" onClick={() => router.push(isEdit ? `/admin/trainers/${trainerId}` : '/admin/trainers')}>Cancel</Button>
        <Button icon={<Save size={14} />} loading={saving} onClick={handleSubmit}>
          {isEdit ? 'Save Changes' : 'Create Trainer'}
        </Button>
      </div>
    </div>
  );
}
