import { formValuesToTransactionInput, transactionFormSchema, transactionToRepeatFormValues } from '../src/features/transactions/schemas/transaction.schema';

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

  it('prefills repeated transactions with today while preserving editable details', () => {
    const today = new Date(2026, 10, 6, 9, 30);
    expect(transactionToRepeatFormValues({
      id: 'transaction-1',
      type: 'expense',
      amount: 4500,
      categoryId: 'food',
      note: 'Lunch',
      date: '2026-11-01T03:00:00.000Z',
      createdAt: '2026-11-01T03:00:00.000Z',
      updatedAt: '2026-11-01T03:00:00.000Z',
    }, today)).toEqual({ type: 'expense', amount: '4500', categoryId: 'food', note: 'Lunch', date: today.toISOString() });
  });
});
