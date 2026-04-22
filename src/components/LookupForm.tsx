'use client';
import { useState } from 'react';
import { ResultCard } from './ResultCard';
import type { CardName, CardResult, LookupResponse } from '@/cards/types';

const CARD_ORDER: CardName[] = ['비씨', '롯데', '삼성', '현대', '국민', '우리', '하나', '신한'];

type LargeMerchant = { isLargeMerchant: boolean; name: string | null };

export function LookupForm() {
  const [bizNo, setBizNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CardResult[] | null>(null);
  const [totalMs, setTotalMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [largeMerchant, setLargeMerchant] = useState<LargeMerchant | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = bizNo.replace(/\D/g, '');
    if (normalized.length !== 10) {
      setError('사업자번호는 10자리 숫자여야 합니다.');
      return;
    }
    setError(null);
    setLoading(true);
    setResults(null);
    setTotalMs(null);
    setLargeMerchant(null);
    try {
      const [lookupRes, largeRes] = await Promise.all([
        fetch('/api/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bizNo: normalized }),
        }),
        fetch('/api/large-merchant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bizNo: normalized }),
        }),
      ]);

      if (!lookupRes.ok) {
        const body = await lookupRes.json().catch(() => ({}));
        throw new Error(body?.message ?? `HTTP ${lookupRes.status}`);
      }
      const json: LookupResponse = await lookupRes.json();
      setResults(json.results);
      setTotalMs(json.totalMs);

      if (largeRes.ok) {
        const lm = (await largeRes.json()) as LargeMerchant;
        setLargeMerchant(lm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '조회 실패');
    } finally {
      setLoading(false);
    }
  }

  const resultsByCard = new Map<string, CardResult>();
  for (const r of results ?? []) resultsByCard.set(r.card, r);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={onSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          inputMode="numeric"
          value={bizNo}
          onChange={(e) => setBizNo(e.target.value)}
          placeholder="사업자번호 10자리"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="사업자번호"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '조회 중...' : '조회'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">{error}</div>
      )}

      {largeMerchant?.isLargeMerchant && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-lg border border-amber-300 bg-amber-50">
          <span className="text-2xl" aria-hidden>🏢</span>
          <div>
            <div className="font-semibold text-amber-900">여신협 대형가맹점</div>
            <div className="text-sm text-amber-800">
              등록 상호: <span className="font-medium">{largeMerchant.name}</span>
            </div>
          </div>
        </div>
      )}

      {(loading || results) && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CARD_ORDER.map((c) => (
              <ResultCard key={c} cardName={c} result={resultsByCard.get(c)} loading={loading && !resultsByCard.get(c)} />
            ))}
          </div>
          {totalMs !== null && (
            <div className="mt-4 text-sm text-gray-500 text-right">조회 완료 — {(totalMs / 1000).toFixed(1)}초</div>
          )}
        </>
      )}
    </div>
  );
}
