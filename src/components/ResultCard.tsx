import type { CardResult, CardStatus, Merchant } from '@/cards/types';
import { cn } from '@/lib/cn';

type DisplayStatus = CardStatus | 'loading';

const STATUS_STYLES: Record<DisplayStatus, { bg: string; border: string; icon: string; label: string }> = {
  registered: { bg: 'bg-green-50', border: 'border-green-300', icon: '✅', label: '등록' },
  not_registered: { bg: 'bg-gray-50', border: 'border-gray-300', icon: '❌', label: '미등록' },
  rate_limited: { bg: 'bg-orange-50', border: 'border-orange-300', icon: '🚫', label: '조회 제한' },
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

function MerchantRow({ m }: { m: Merchant }) {
  return (
    <div
      className={cn(
        'py-1.5 first:pt-0 last:pb-0 border-b last:border-0 border-gray-200',
        m.cancelled && 'opacity-60'
      )}
    >
      <div className={cn('font-medium text-gray-900', m.cancelled && 'line-through')}>{m.name}</div>
      <div className="text-xs text-gray-600">가맹점번호: {m.no}</div>
      <div className="text-xs text-gray-600">
        가입: {formatDate(m.date)}
        {m.cancelled && (
          <span className="ml-2 inline-block px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-semibold">
            해지{m.cancelDate ? ` ${formatDate(m.cancelDate)}` : ''}
          </span>
        )}
      </div>
    </div>
  );
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
  const status: DisplayStatus = loading ? 'loading' : result?.status ?? 'loading';
  const style = STATUS_STYLES[status];
  const merchants = result?.merchants ?? [];

  return (
    <div className={cn('rounded-lg border p-4', style.bg, style.border)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">{cardName}카드</h3>
        <span className="text-xl" aria-label={style.label}>
          {style.icon}
        </span>
      </div>
      <div className="text-sm">
        {status === 'registered' && merchants.length > 0 && (
          <div className="divide-y divide-gray-200">
            {merchants.map((m, i) => (
              <MerchantRow key={`${m.no}-${i}`} m={m} />
            ))}
          </div>
        )}
        {status === 'not_registered' && <div className="text-gray-500">미등록</div>}
        {status === 'rate_limited' && (
          <div className="text-orange-700">조회 횟수 초과로 확인 불가</div>
        )}
        {status === 'loading' && <div className="text-gray-500">조회 중...</div>}
        {status === 'error' && result && <div className="text-red-600">{humanError(result.error)}</div>}
      </div>
    </div>
  );
}
