// Drop-in replacement for PhotoCard inside MemberDetail.jsx
// Uses ImageKit instead of Supabase Storage
import React from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { initials } from '@/lib/utils/format';

function Avatar({ name, url, size = 80 }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: 'var(--if-accentbg2)', border: '2px solid var(--if-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: size * 0.3, fontWeight: 800, color: 'var(--if-accent)', flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

export function PhotoCard({ name, url, memberId, onUpdated }) {
  const inputRef    = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes  = await fetch(`/api/upload?type=member&id=${memberId}`, { method: 'POST', body: formData });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error || 'Upload failed');

      await fetch(`/api/admin/members/${memberId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_pic_url: uploadJson.url }),
      });

      onUpdated();
    } catch (err) {
      alert(err?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    if (!confirm('Remove profile photo?')) return;
    setUploading(true);
    try {
      await fetch(`/api/admin/members/${memberId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_pic_url: null }),
      });
      onUpdated();
    } catch (err) {
      alert(err?.message || 'Failed to remove photo');
    } finally { setUploading(false); }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
      <div style={{ position: 'relative', cursor: 'pointer', borderRadius: 12, overflow: 'hidden' }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <Avatar name={name} url={url} size={80} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: 0, transition: 'opacity .2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
        >
          <Camera size={16} style={{ color: '#fff' }} />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 8, fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: '#fff', textAlign: 'center' }}>
            {uploading ? 'Uploading...' : url ? 'Change' : 'Add Photo'}
          </span>
        </div>
      </div>
      {url && !uploading && (
        <button onClick={(e) => { e.stopPropagation(); handleRemove(); }} title="Remove photo"
          style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--if-red)', border: '2px solid var(--if-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform .15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Trash2 size={10} style={{ color: '#fff' }} />
        </button>
      )}
    </div>
  );
}
