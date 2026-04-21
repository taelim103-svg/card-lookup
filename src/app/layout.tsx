import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '카드사 가맹점 조회',
  description: '사업자번호로 8개 카드사 가맹점 등록 여부를 조회합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
