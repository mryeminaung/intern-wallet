import { formValuesToTransactionInput, transactionFormSchema } from '../src/features/transactions/schemas/transaction.schema';

describe('transaction form validation', () => {
  it('accepts a positive whole MMK amount and normalizes the note', () => {
    const result = transactionFormSchema.safeParse({
      type: 'expense',
      amount: '12000',
      categoryId: 'food',
      date: '2026-11-04T00:00:00.000Z',
      note: '  lunch  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(formValuesToTransactionInput(result.data)).toEqual({
        type: 'expense',
        amount: 12000,
        categoryId: 'food',
        date: '2026-11-04T00:00:00.000Z',
        note: 'lunch',
      });
    }
  });

  it('rejects zero, fractional, missing-category, and invalid-date inputs', () => {
    const result = transactionFormSchema.safeParse({
      type: 'income',
      amount: '0.5',
      categoryId: '',
      date: 'not-a-date',
      note: '',
    });

    expect(result.success).toBe(false);
  });
});
