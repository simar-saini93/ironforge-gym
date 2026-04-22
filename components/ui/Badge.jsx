const VARIANTS = {
  active:   { bg: 'rgba(34,197,94,0.09)',   color: '#22c55e' },
  expired:  { bg: 'rgba(239,68,68,0.09)',   color: '#ef4444' },
  frozen:   { bg: 'rgba(56,189,248,0.09)',  color: '#38bdf8' },
  pending:  { bg: 'rgba(249,115,22,0.09)',  color: '#f97316' },
  present:  { bg: 'rgba(34,197,94,0.09)',   color: '#22c55e' },
  absent:   { bg: 'rgba(239,68,68,0.09)',   color: '#ef4444' },
  leave:    { bg: 'rgba(249,115,22,0.09)',  color: '#f97316' },
  yellow:   { bg: 'rgba(245,197,24,0.12)',  color: '#F5C518' },
  blue:     { bg: 'rgba(56,189,248,0.09)',  color: '#38bdf8' },
  purple:   { bg: 'rgba(167,139,250,0.09)', color: '#a78bfa' },
  default:  { bg: 'rgba(160,160,160,0.1)',  color: '#a0a0a0' },
};

export default function Badge({ children, variant = 'default', size = 'md' }) {
  const s = VARIANTS[variant] || VARIANTS.default;
  const fontSize = size === 'sm' ? 9 : 10;

  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      fontFamily:    "'Outfit', sans-serif",
      fontSize,
      fontWeight:    700,
      letterSpacing: '.05em',
      textTransform: 'uppercase',
      padding:       size === 'sm' ? '2px 7px' : '3px 9px',
      borderRadius:  20,
      background:    s.bg,
      color:         s.color,
      whiteSpace:    'nowrap',
      flexShrink:    0,
    }}>
      {children}
    </span>
  );
}