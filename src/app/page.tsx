import { LookupForm } from '@/components/LookupForm';

export default function Home() {
  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">카드사 가맹점 등록 조회</h1>
          <p className="text-gray-600">사업자번호로 8개 카드사 가맹점 등록 여부를 한 번에 확인합니다.</p>
        </header>
        <LookupForm />
      </div>
    </main>
  );
}
