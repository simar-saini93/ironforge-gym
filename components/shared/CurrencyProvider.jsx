'use client';

import { useEffect } from 'react';
import { setBranchCurrency } from '@/lib/utils/format';

export default function CurrencyProvider({ children }) {
  useEffect(() => {
    fetch('/api/branch')
      .then((r) => r.json())
      .then(({ branch }) => {
        if (branch?.currency) setBranchCurrency(branch.currency);
      })
      .catch((err) => console.error('[CurrencyProvider]', err));
  }, []);

  return children;
}
