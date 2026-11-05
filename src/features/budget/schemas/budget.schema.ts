import { z } from 'zod';

export const budgetFormSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Choose a valid month.'),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter a budget amount.')
    .refine((value) => /^\d+$/.test(value), 'Budget must be a whole number.')
    .refine((value) => Number.isSafeInteger(Number(value)) && Number(value) > 0, 'Budget must be greater than zero.'),
  categoryId: z.string().optional(),
});

export type BudgetFormValues = z.input<typeof budgetFormSchema>;

export function formValuesToBudgetInput(values: BudgetFormValues): { month: string; amount: number; categoryId: string | null } {
  return {
    month: values.month,
    amount: Number(values.amount.replace(/,/g, '')),
    categoryId: values.categoryId || null,
  };
}
