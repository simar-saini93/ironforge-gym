import { CheckCircle2 } from 'lucide-react';

export const PASSWORD_RULES = [
  { id: 'length',    label: 'At least 8 characters', test: (p) => p.length >= 8   },
  { id: 'uppercase', label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter',  test: (p) => /[a-z]/.test(p) },
  { id: 'number',    label: 'One number',            test: (p) => /[0-9]/.test(p) },
];

export function validatePassword(password) {
  return PASSWORD_RULES.every((r) => r.test(password));
}

export default function PasswordRules({ password }) {
  if (!password.length) return null;
  return (
    <ul className="mt-3 space-y-1.5" role="list" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.id} className="flex items-center gap-2">
            <CheckCircle2
              size={12}
              style={{ color: ok ? 'var(--if-green)' : 'var(--if-muted)', flexShrink: 0, transition: 'color 0.2s' }}
              aria-hidden="true"
            />
            <span
              className="font-barlow font-light"
              style={{ fontSize: 12, color: ok ? 'var(--if-green)' : 'var(--if-muted)', transition: 'color 0.2s' }}
            >
              {rule.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
