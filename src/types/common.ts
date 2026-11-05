export const transactionTypes = ['income', 'expense'] as const;

export type TransactionType = (typeof transactionTypes)[number];

export type Category = {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  isDefault: boolean;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type Budget = {
  id: string;
  month: string;
  categoryId: string | null;
  amount: number;
};

export type Setting = {
  key: string;
  value: string;
};

export type WalletData = {
  categories: readonly Category[];
  transactions: readonly Transaction[];
  budgets: readonly Budget[];
  settings: readonly Setting[];
};

export type CreateTransactionInput = {
  type: TransactionType;
  amount: number;
  categoryId: string;
  note?: string | null;
  date: string;
};

export type UpdateTransactionInput = CreateTransactionInput;

export type CreateBudgetInput = {
  month: string;
  categoryId?: string | null;
  amount: number;
};

export type BudgetStatus = 'normal' | 'approaching' | 'almost-exhausted' | 'exceeded';

export type BudgetProgress = Budget & {
  category: Category | null;
  spent: number;
  remaining: number;
  usagePercentage: number;
  status: BudgetStatus;
};
