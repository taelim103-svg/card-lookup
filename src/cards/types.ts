export type CardStatus = 'registered' | 'not_registered' | 'error';

export type CardName = '비씨' | '롯데' | '삼성' | '현대' | '국민' | '우리' | '하나' | '신한';

export interface CardResult {
  card: CardName;
  status: CardStatus;
  merchantName?: string;
  merchantNo?: string;
  joinDate?: string;
  error?: string;
  elapsedMs: number;
}

export interface LookupResponse {
  bizNo: string;
  results: CardResult[];
  totalMs: number;
}

export type CardChecker = (bizNo: string) => Promise<CardResult>;
