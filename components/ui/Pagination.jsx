'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const btnStyle = (active, disabled) => ({
    width:        32, height: 32,
    borderRadius: 7,
    background:   active ? 'var(--if-accent)' : 'transparent',
    border:       active ? 'none' : '1px solid var(--if-border2)',
    color:        active ? '#000' : disabled ? 'var(--if-muted)' : 'var(--if-text2)',
    fontFamily:   "'Outfit', sans-serif",
    fontSize:     13, fontWeight: 600,
    cursor:       disabled ? 'not-allowed' : 'pointer',
    display:      'flex', alignItems: 'center', justifyContent: 'center',
    transition:   'all .15s',
    opacity:      disabled ? 0.4 : 1,
  });

  // Build page numbers with ellipsis
  function getPages() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {/* Prev */}
      <button
        style={btnStyle(false, page === 1)}
        onClick={() => page > 1 && onPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={15} />
      </button>

      {/* Pages */}
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ color: 'var(--if-muted)', fontFamily: "'Outfit', sans-serif", fontSize: 13, padding: '0 4px' }}>
            …
          </span>
        ) : (
          <button
            key={p}
            style={btnStyle(p === page, false)}
            onClick={() => onPage(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            onMouseEnter={(e) => { if (p !== page) e.currentTarget.style.background = 'var(--if-card2)'; }}
            onMouseLeave={(e) => { if (p !== page) e.currentTarget.style.background = 'transparent'; }}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        style={btnStyle(false, page === totalPages)}
        onClick={() => page < totalPages && onPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}