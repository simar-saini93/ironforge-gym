export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div style={{
      display:        'flex', flexDirection: 'column',
      alignItems:     'center', justifyContent: 'center',
      padding:        '60px 24px', textAlign: 'center',
    }}>
      {Icon && (
        <div style={{
          width: 56, height: 56, borderRadius: 12,
          background: 'var(--if-accentbg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
          color: 'var(--if-accent)',
        }}>
          <Icon size={26} />
        </div>
      )}
      <h3 style={{
        fontFamily:    "'Outfit', sans-serif",
        fontSize:      16, fontWeight: 700,
        color:         'var(--if-text)',
        marginBottom:  6,
      }}>
        {title}
      </h3>
      {message && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   14, fontWeight: 400,
          color:      'var(--if-muted)',
          maxWidth:   340, lineHeight: 1.6,
          marginBottom: action ? 20 : 0,
        }}>
          {message}
        </p>
      )}
      {action}
    </div>
  );
}