import type { CardResult, CardStatus } from '@/cards/types';
import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<CardStatus | 'loading', { bg: string; border: string; icon: string; label: string }> = {
  registered: { bg: 'bg-green-50', border: 'border-green-300', icon: '✅', label: '등록' },
  not_registered: { bg: 'bg-gray-50', border: 'border-gray-300', icon: '⭕', label: '미등록' },
  error: { bg: 'bg-red-50', border: 'border-red-300', icon: '⚠️', label: '오류' },
  loading: { bg: 'bg-yellow-50', border: 'border-yellow-300', icon: '⏳', label: '조회 중' },
};

function formatDate(s?: string): string {
  if (!s) return '';
  const digits = s.replace(/\D/g, '');
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  return s;
}

function humanError(err?: string): string {
  if (!err) return '';
  const m: Record<string, string> = {
    session_not_ready: '세션 준비 중',
    session_expired: '세션 만료 — 잠시 후 재시도',
    timeout: '응답 지연',
  };
  return m[err] ?? err;
}

export function ResultCard({
  cardName,
  result,
  loading,
}: {
  cardName: string;
  result?: CardResult;
  loading?: boolean;
}) {
  const status: CardStatus | 'loading' = loading ? 'loading' : result?.status ?? 'loading';
  const style = STATUS_STYLES[status];
  return (
    <div className={cn('rounded-lg border p-4', style.bg, style.border)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">{cardName}카드</h3>
        <span className="text-xl" aria-label={style.label}>
          {style.icon}
        </span>
      </div>
      <div className="text-sm">
        {status === 'registered' && result && (
          <>
            <div className="font-medium text-gray-900">{result.merchantName}</div>
            <div className="text-gray-600">가맹점번호: {result.merchantNo}</div>
            <div className="text-gray-600">가입일: {formatDate(result.joinDate)}</div>
          </>
        )}
        {status === 'not_registered' && <div className="text-gray-500">미등록</div>}
        {status === 'loading' && <div className="text-gray-500">조회 중...</div>}
        {status === 'error' && result && <div className="text-red-600">{humanError(result.error)}</div>}
      </div>
    </div>
  );
}
