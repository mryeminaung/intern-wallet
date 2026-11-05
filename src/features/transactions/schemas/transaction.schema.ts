import { z } from 'zod';
import { isValidDateString } from '../../../lib/date';
import type { CreateTransactionInput, TransactionType } from '../../../types/common';
import { transactionTypes } from '../../../types/common';

export const transactionFormSchema = z.object({
  type: z.enum(transactionTypes),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter an amount.')
    .refine((value) => /^\d+$/.test(value), 'Amount must be a whole number.')
    .refine((value) => Number.isSafeInteger(Number(value)) && Number(value) > 0, 'Amount must be greater than zero.'),
  categoryId: z.string().trim().min(1, 'Choose a category.'),
  date: z.string().refine(isValidDateString, 'Choose a valid date.'),
  note: z.string().max(250, 'Note must be 250 characters or fewer.').optional(),
});

export type TransactionFormValues = z.input<typeof transactionFormSchema>;

export function formValuesToTransactionInput(values: TransactionFormValues): CreateTransactionInput {
  return {
    type: values.type as TransactionType,
    amount: Number(values.amount.replace(/,/g, '')),
    categoryId: values.categoryId,
    date: values.date,
    note: values.note?.trim() || null,
  };
}
