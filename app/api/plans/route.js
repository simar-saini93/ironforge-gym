import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('membership_plans')
      .select('id, billing_cycle, price, is_active')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('[api/plans] error:', error);
      return NextResponse.json({ plans: [] }, { status: 200 });
    }

    return NextResponse.json({ plans: data || [] }, { status: 200 });

  } catch (err) {
    console.error('[api/plans] Error:', err);
    return NextResponse.json({ plans: [] }, { status: 200 });
  }
}
