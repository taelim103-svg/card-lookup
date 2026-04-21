export type CardStatus = 'registered' | 'not_registered' | 'rate_limited' | 'error';

export type CardName = '비씨' | '롯데' | '삼성' | '현대' | '국민' | '우리' | '하나' | '신한';

export interface Merchant {
  name: string;
  no: string;
  date?: string;
  cancelled?: boolean;
  cancelDate?: string;
}

export interface CardResult {
  card: CardName;
  status: CardStatus;
  merchants?: Merchant[];
  error?: string;
  elapsedMs: number;
}

export interface LookupResponse {
  bizNo: string;
  results: CardResult[];
  totalMs: number;
}

export type CardChecker = (bizNo: string) => Promise<CardResult>;
