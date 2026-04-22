import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 20, color = 'var(--if-accent)' }) {
  return (
    <Loader2
      size={size}
      className="animate-spin"
      style={{ color, flexShrink: 0 }}
      aria-label="Loading"
    />
  );
}

export function PageSpinner() {
  return (
    <div style={{
      flex: 1, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      minHeight: 300,
    }}>
      <Spinner size={28} />
    </div>
  );
}