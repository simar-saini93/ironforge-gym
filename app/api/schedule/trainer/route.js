import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getTrainer() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: trainer } = await getAdminClient()
      .from('trainers').select('id').eq('profile_id', user.id).single();
    return trainer;
  } catch { return null; }
}

export async function GET() {
  try {
    const trainer = await getTrainer();
    if (!trainer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db    = getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const in30  = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];

    const { data: duty } = await db
      .from('trainer_duty')
      .select('id, date, is_full_day, shift_start, shift_end')
      .eq('trainer_id', trainer.id)
      .gte('date', today)
      .order('date', { ascending: true });

    const today_duty = (duty || []).find((d) => d.date === today) || null;

    return NextResponse.json({
      today_duty,
      upcoming: duty || [],
    }, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });

  } catch (err) {
    console.error('[schedule/trainer]', err?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
