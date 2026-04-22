import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isValidBizNo, normalizeBizNo } from '@/lib/validate';

export const runtime = 'nodejs';

const shardCache = new Map<string, Record<string, string>>();

async function loadShard(prefix: string): Promise<Record<string, string> | null> {
  const cached = shardCache.get(prefix);
  if (cached) return cached;
  const file = path.join(process.cwd(), 'public', 'large-merchants', `${prefix}.json`);
  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, string>;
    shardCache.set(prefix, parsed);
    return parsed;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') return null;
    throw e;
  }
}

export async function POST(req: Request) {
  let bizNoRaw = '';
  try {
    const body = await req.json();
    bizNoRaw = String(body?.bizNo ?? '');
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const bizNo = normalizeBizNo(bizNoRaw);
  if (!isValidBizNo(bizNo)) {
    return NextResponse.json({ error: 'invalid_biz_no' }, { status: 400 });
  }

  const shard = await loadShard(bizNo.slice(0, 2));
  const name = shard?.[bizNo] ?? null;
  return NextResponse.json({
    bizNo,
    isLargeMerchant: Boolean(name),
    name,
  });
}
