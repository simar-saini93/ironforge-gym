'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { memberStep1Schema, flattenZodErrors } from '@/lib/schemas/member';
import { fullName } from '@/utils/format';

export default function EditMemberForm({ memberId }) {
  const router   = useRouter();
  const supabase = createClient();

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});
  const [profileId, setProfileId] = useState(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '',
    dob: '', gender: '', address: '',
    emergency_name: '', emergency_phone: '',
  });

  useEffect(() => {
    supabase
      .from('members')
      .select('date_of_birth, gender, address, emergency_name, emergency_phone, profile:profiles(id, first_name, last_name, email, phone)')
      .eq('id', memberId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setProfileId(data.profile?.id);
        setForm({
          first_name:      data.profile?.first_name || '',
          last_name:       data.profile?.last_name  || '',
          phone:           data.profile?.phone      || '',
          dob:             data.date_of_birth        || '',
          gender:          data.gender               || '',
          address:         data.address              || '',
          emergency_name:  data.emergency_name       || '',
          emergency_phone: data.emergency_phone      || '',
        });
        setLoading(false);
      });
  }, [memberId]);

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSave() {
    // Validate with modified schema (email not editable)
    const result = memberStep1Schema.omit({ email: true }).safeParse(form);
    const e = flattenZodErrors(result);
    if (!result.success) { setErrors(e); return; }

    setSaving(true);
    try {
      await Promise.all([
        supabase.from('profiles').update({
          first_name: form.first_name.trim(),
          last_name:  form.last_name.trim(),
          phone:      form.phone.trim() || null,
        }).eq('id', profileId),

        supabase.from('members').update({
          date_of_birth:   form.dob             || null,
          gender:          form.gender           || null,
          address:         form.address          || null,
          emergency_name:  form.emergency_name   || null,
          emergency_phone: form.emergency_phone  || null,
        }).eq('id', memberId),
      ]);

      router.push(`/admin/members/${memberId}`);
    } catch (err) {
      console.error('Edit member error:', err?.message);
      alert(err?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>

      {/* Back */}
      <button
        onClick={() => router.push(`/admin/members/${memberId}`)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-muted)', marginBottom: 24, padding: 0, transition: 'color .15s' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
      >
        <ArrowLeft size={15} /> Back to Member
      </button>

      <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, padding: '28px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--if-text)', marginBottom: 24 }}>
          Edit Member Details
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="First Name" required value={form.first_name} onChange={(e) => onChange('first_name', e.target.value)} error={errors.first_name} />
            <Input label="Last Name"  required value={form.last_name}  onChange={(e) => onChange('last_name',  e.target.value)} error={errors.last_name} />
          </div>

          <Input label="Phone Number" required type="tel" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} error={errors.phone} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Date of Birth" type="date" value={form.dob} onChange={(e) => onChange('dob', e.target.value)} />
            <Select label="Gender" value={form.gender} onChange={(e) => onChange('gender', e.target.value)}
              options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
              placeholder="Select gender"
            />
          </div>

          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-text2)', display: 'block', marginBottom: 6 }}>Address</label>
            <textarea value={form.address} onChange={(e) => onChange('address', e.target.value)} rows={2}
              style={{ width: '100%', background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '10px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--if-text)', outline: 'none', resize: 'vertical' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--if-accent)'; e.target.style.boxShadow = '0 0 0 3px var(--if-accentbg)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'var(--if-border2)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ background: 'var(--if-bg3)', borderRadius: 10, padding: 16, border: '1px solid var(--if-border)' }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--if-muted)', marginBottom: 12 }}>Emergency Contact</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Contact Name"  value={form.emergency_name}  onChange={(e) => onChange('emergency_name',  e.target.value)} />
              <Input label="Contact Phone" value={form.emergency_phone} onChange={(e) => onChange('emergency_phone', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <Button variant="ghost" onClick={() => router.push(`/admin/members/${memberId}`)}>Cancel</Button>
        <Button icon={<Save size={14} />} loading={saving} onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
