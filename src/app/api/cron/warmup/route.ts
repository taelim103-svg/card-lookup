import { NextResponse } from 'next/server';
import { runWarmup } from '@/warmup';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: Request) {
  // Vercel Cron은 Authorization: Bearer {CRON_SECRET} 헤더를 보냄
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const summary = await runWarmup();
  return NextResponse.json(summary);
}
