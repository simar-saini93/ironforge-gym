import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { branches, profiles } from '@/db/schema';
import { eq }            from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const branchUpdateSchema = z.object({
  name:     z.string().min(1).max(100).trim().optional(),
  address:  z.string().max(500).trim().optional().nullable(),
  phone:    z.string().max(20).trim().optional().nullable(),
  email:    z.string().email().trim().optional().nullable(),
  currency: z.string().max(10).trim().optional(),
});

export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    // Get branch via profile
    const profileResult = await drizzleDb
      .select({ branch_id: profiles.branch_id })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const branchId = profileResult[0]?.branch_id;
    if (!branchId) return NextResponse.json({ branch: null }, { status: 404 });

    const result = await drizzleDb
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    return NextResponse.json({ branch: result[0] ?? null }, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (err) {
    console.error('[settings/branch GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(20, userId); }
    catch { return rateLimitResponse(20); }

    const body   = await request.json();
    const parsed = branchUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const profileResult = await drizzleDb
      .select({ branch_id: profiles.branch_id })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const branchId = profileResult[0]?.branch_id;
    if (!branchId) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    await drizzleDb
      .update(branches)
      .set({
        ...(parsed.data.name     !== undefined && { name:     parsed.data.name }),
        ...(parsed.data.address  !== undefined && { address:  parsed.data.address ?? null }),
        ...(parsed.data.phone    !== undefined && { phone:    parsed.data.phone ?? null }),
        ...(parsed.data.email    !== undefined && { email:    parsed.data.email ?? null }),
        ...(parsed.data.currency !== undefined && { currency: parsed.data.currency }),
        updated_at: new Date(),
      })
      .where(eq(branches.id, branchId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[settings/branch PUT]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
