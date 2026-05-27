import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import ImageKit         from 'imagekit';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const imagekit = new ImageKit({
  publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const FOLDER_MAP = {
  member:  process.env.IMAGEKIT_FOLDER_MEMBERS  || '/gym/members',
  trainer: process.env.IMAGEKIT_FOLDER_TRAINERS || '/gym/trainers',
};

const querySchema = z.object({
  type: z.enum(['member', 'trainer']).default('member'),
  id:   z.string().min(1),
});

export async function POST(request) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(20, userId); }
    catch { return rateLimitResponse(20); }

    // ── Parse query params ────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      type: searchParams.get('type') || 'member',
      id:   searchParams.get('id'),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    const { type, id } = parsed.data;
    const folder       = FOLDER_MAP[type];

    // ── Read file from form data ──────────────────────────────
    const formData = await request.formData();
    const file     = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type + size
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 });
    }

    // ── Convert to base64 for ImageKit ───────────────────────
    const buffer    = await file.arrayBuffer();
    const base64    = Buffer.from(buffer).toString('base64');
    const fileName  = `${id}-profile.${file.type.split('/')[1]}`;

    // ── Upload to ImageKit ────────────────────────────────────
    const result = await imagekit.upload({
      file:              base64,
      fileName,
      folder,
      useUniqueFileName: false, // overwrite same file on re-upload
      tags:              [type, id],
    });

    return NextResponse.json({
      url:      result.url,
      fileId:   result.fileId,
      filePath: result.filePath,
    });

  } catch (err) {
    console.error('[api/upload] error:', err?.message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
