export function normalizeBizNo(input: string): string {
  return input.replace(/[^0-9]/g, '');
}

export function isValidBizNo(input: string): boolean {
  return /^\d{10}$/.test(normalizeBizNo(input));
}
