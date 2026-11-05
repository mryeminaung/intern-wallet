import { CURRENCY_CODE } from './constants';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

export type CurrencyDisplay = 'code' | 'symbol';
let currencyDisplay: CurrencyDisplay = 'code';

export function setCurrencyDisplay(value: string | null): void {
  currencyDisplay = value === 'symbol' ? 'symbol' : 'code';
}

export function formatMMK(amount: number): string {
  return currencyDisplay === 'symbol' ? `${numberFormatter.format(amount)} Ks` : `${CURRENCY_CODE} ${numberFormatter.format(amount)}`;
}
