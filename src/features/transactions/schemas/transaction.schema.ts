import { z } from 'zod';
import { isValidDateString } from '@/lib/date';
import { normalizeBankName } from '@/lib/money-source';
import type { CreateTransactionInput, Transaction, TransactionType } from '@/types/common';
import { transactionTypes } from '@/types/common';

export const transactionFormSchema = z.object({
  type: z.enum(transactionTypes),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter an amount.')
    .refine((value) => /^\d+$/.test(value), 'Amount must be a whole number.')
    .refine((value) => Number.isSafeInteger(Number(value)) && Number(value) > 0, 'Amount must be greater than zero.'),
  categoryId: z.string().trim().min(1, 'Choose a category.'),
  sourceType: z.enum(['cash', 'bank']).optional(),
  bankName: z.string().trim().max(40, 'Bank name must be 40 characters or fewer.'),
  date: z.string().refine(isValidDateString, 'Choose a valid date.'),
  note: z.string().max(250, 'Note must be 250 characters or fewer.').optional(),
}).superRefine((values, context) => {
  if (!values.sourceType) context.addIssue({ code: 'custom', path: ['sourceType'], message: 'Choose Cash or Bank.' });
  if (values.sourceType === 'bank' && !values.bankName.trim()) {
    context.addIssue({ code: 'custom', path: ['bankName'], message: 'Choose or enter a bank.' });
  }
});

export type TransactionFormValues = z.input<typeof transactionFormSchema>;

export function formValuesToTransactionInput(values: TransactionFormValues): CreateTransactionInput {
  return {
    type: values.type as TransactionType,
    amount: Number(values.amount.replace(/,/g, '')),
    categoryId: values.categoryId,
    sourceType: values.sourceType,
    bankName: values.sourceType === 'bank' ? normalizeBankName(values.bankName) : null,
    date: values.date,
    note: values.note?.trim() || null,
  };
}

export function transactionToRepeatFormValues(transaction: Transaction, referenceDate: Date = new Date()): TransactionFormValues {
  return {
    type: transaction.type,
    amount: String(transaction.amount),
    categoryId: transaction.categoryId,
    sourceType: transaction.sourceType ?? undefined,
    bankName: transaction.bankName ?? '',
    date: referenceDate.toISOString(),
    note: transaction.note ?? '',
  };
}
