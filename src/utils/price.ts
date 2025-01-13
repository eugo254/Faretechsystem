export function formatCurrency(amount: number): string {
  return `Ksh. ${amount.toLocaleString()}`;
}

export function calculateFare(
  fromId: string,
  toId: string,
  isPeak: boolean,
  settings: any
): number {
  const route = settings.find(
    (s: any) => s.from.id === fromId && s.to.id === toId
  );
  return route ? (isPeak ? route.peakPrice : route.offPeakPrice) : 0;
}