// ── Date formatting ──────────────────────────────────────────
export function formatDate(d, opts = {}) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...opts,
  });
}

export function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function daysLeft(endDate) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / 864e5);
}

export function daysLeftLabel(endDate) {
  const d = daysLeft(endDate);
  if (d === null) return '—';
  if (d < 0)  return 'Expired';
  if (d === 0) return 'Expires today';
  return `${d}d left`;
}

// ── Currency ─────────────────────────────────────────────────
// ── Currency helpers ─────────────────────────────────────────
const CURRENCY_SYMBOLS = {
  INR:'₹', USD:'$', EUR:'€', GBP:'£', AED:'د.إ', SAR:'﷼', SGD:'S$',
  MYR:'RM', AUD:'A$', CAD:'C$', NZD:'NZ$', BRL:'R$', ARS:'$', CLP:'$',
  COP:'$', PEN:'S/', MXN:'$', BZD:'BZ$', GTQ:'Q', HNL:'L', CRC:'₡',
  PAB:'B/.', DOP:'RD$', JMD:'J$', TTD:'TT$', BOB:'Bs.', PYG:'₲',
  UYU:'$U', GYD:'$', NIO:'C$', HNL:'L', ZAR:'R', NGN:'₦', KES:'KSh',
  GHS:'GH₵', EGP:'£', JPY:'¥', CNY:'¥', KRW:'₩', THB:'฿', PHP:'₱',
  VND:'₫', IDR:'Rp', TRY:'₺', PKR:'₨', BDT:'৳', CHF:'Fr', SEK:'kr',
  NOK:'kr', DKK:'kr', PLN:'zł', HUF:'Ft', RUB:'₽', UAH:'₴', QAR:'ر.ق',
  KWD:'د.ك', HKD:'HK$', TWD:'NT$', XCD:'EC$', AWG:'ƒ', FJD:'FJ$',
};

let _branchCurrency = null;
export function setBranchCurrency(code) { _branchCurrency = code; }
export function getBranchCurrency() { return _branchCurrency || 'BZD'; }

export function formatCurrency(amount, currencyCode) {
  if (amount == null) return '—';
  const code   = currencyCode || _branchCurrency || 'BZD';
  const symbol = CURRENCY_SYMBOLS[code] || code;
  const num    = Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return `${code} ${num}`;
}

// ── Name ─────────────────────────────────────────────────────
export function fullName(profile) {
  if (!profile) return 'Unknown';
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
}

export function initials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

// ── Subscription status ──────────────────────────────────────
export function subStatusVariant(status) {
  const map = {
    active:  'active',
    expired: 'expired',
    frozen:  'frozen',
    pending: 'pending',
  };
  return map[status] || 'default';
}

// ── Plan label ───────────────────────────────────────────────
export function planLabel(billingCycle) {
  const map = {
    day_pass: 'Day Pass',
    monthly:  'Monthly',
    yearly:   'Yearly',
  };
  return map[billingCycle] || billingCycle || '—';
}

// ── End date calculator ──────────────────────────────────────
export function calcEndDate(startDate, billingCycle) {
  const start = new Date(startDate);
  const end   = new Date(start);
  if      (billingCycle === 'monthly')  end.setMonth(end.getMonth() + 1);
  else if (billingCycle === 'yearly')  end.setFullYear(end.getFullYear() + 1);
  else if (billingCycle === 'weekly')  end.setDate(end.getDate() + 7);
  else                                 end.setDate(end.getDate() + 1); // day_pass
  return end.toISOString().split('T')[0];
}
