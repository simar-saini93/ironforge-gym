'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { trainerSchema, flattenZodErrors } from '@/lib/schemas/index';
import { memberInviteTemplate } from '@/lib/email/templates';

export default function TrainerForm({ trainerId }) {
  const isEdit   = !!trainerId;
  const router   = useRouter();
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
    fetch(`/api/admin/trainers/${trainerId}`)
      .then((r) => r.json())
      .then(({ trainer }) => {
        if (!trainer) return;
        setProfileId(trainer.profile_id || trainerId);
        setForm({
          first_name:     trainer.profile?.first_name || '',
          last_name:      trainer.profile?.last_name  || '',
          email:          trainer.profile?.email      || '',
          phone:          trainer.profile?.phone      || '',
          specialization: trainer.specialization       || '',
          bio:            trainer.bio                  || '',
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
      if (isEdit) {
        const res = await fetch(`/api/admin/trainers/${trainerId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            first_name:     form.first_name.trim(),
            last_name:      form.last_name.trim(),
            phone:          form.phone || null,
            specialization: form.specialization || null,
            bio:            form.bio || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to update trainer');
        router.push(`/admin/trainers/${trainerId}`);
      } else {
        const res = await fetch('/api/admin/trainers', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            email:          form.email.trim().toLowerCase(),
            first_name:     form.first_name.trim(),
            last_name:      form.last_name.trim(),
            phone:          form.phone || null,
            specialization: form.specialization || null,
            bio:            form.bio || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to create trainer');
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
