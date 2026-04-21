import { NextResponse } from 'next/server';
import type { CardChecker, CardName, CardResult, LookupResponse } from '@/cards/types';
import { isValidBizNo, normalizeBizNo } from '@/lib/validate';

import { check as bc } from '@/cards/bc';
import { check as lotte } from '@/cards/lotte';
import { check as samsung } from '@/cards/samsung';
import { check as hyundai } from '@/cards/hyundai';
import { check as kb } from '@/cards/kb';
import { check as woori } from '@/cards/woori';
import { check as hana } from '@/cards/hana';
import { check as shinhan } from '@/cards/shinhan';

const CHECKERS: Array<CardChecker> = [bc, lotte, samsung, hyundai, kb, woori, hana, shinhan];
const CARD_NAMES: CardName[] = ['비씨', '롯데', '삼성', '현대', '국민', '우리', '하나', '신한'];

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const start = Date.now();
  let bizNoRaw: string;
  try {
    const body = await req.json();
    bizNoRaw = String(body?.bizNo ?? '');
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const bizNo = normalizeBizNo(bizNoRaw);
  if (!isValidBizNo(bizNo)) {
    return NextResponse.json(
      { error: 'invalid_biz_no', message: '사업자번호는 10자리 숫자여야 합니다.' },
      { status: 400 }
    );
  }

  const settled = await Promise.allSettled(CHECKERS.map((c) => c(bizNo)));
  const results: CardResult[] = settled.map((s, i) => {
    if (s.status === 'fulfilled') return s.value;
    return {
      card: CARD_NAMES[i],
      status: 'error',
      error: String(s.reason),
      elapsedMs: 0,
    };
  });

  const response: LookupResponse = {
    bizNo,
    results,
    totalMs: Date.now() - start,
  };
  return NextResponse.json(response);
}
