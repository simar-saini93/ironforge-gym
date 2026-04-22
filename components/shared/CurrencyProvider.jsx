'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { setBranchCurrency } from '@/utils/format';

export default function CurrencyProvider({ children }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.from('branches').select('currency').limit(1).single()
      .then(({ data }) => {
        if (data?.currency) setBranchCurrency(data.currency);
      });
  }, []);

  return children;
}
