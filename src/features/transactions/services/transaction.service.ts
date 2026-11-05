import { isValidDateString } from '../../../lib/date';
import type { CategoryRepository } from '../../../database/repositories/category.repository';
import type { TransactionRepository } from '../../../database/repositories/transaction.repository';
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from '../../../types/common';

export class TransactionServiceError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'TransactionServiceError';
  }
}

export class TransactionService {
  public constructor(
    private readonly transactions: TransactionRepository,
    private readonly categories: CategoryRepository,
  ) {}

  public async create(input: CreateTransactionInput): Promise<Transaction> {
    await this.validateInput(input);
    return this.transactions.create(input);
  }

  public async update(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    await this.validateInput(input);
    const transaction = await this.transactions.update(id, input);
    if (!transaction) {
      throw new TransactionServiceError('This transaction no longer exists.');
    }
    return transaction;
  }

  public async delete(id: string): Promise<void> {
    const deleted = await this.transactions.delete(id);
    if (!deleted) {
      throw new TransactionServiceError('This transaction was already deleted.');
    }
  }

  private async validateInput(input: CreateTransactionInput): Promise<void> {
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
      throw new TransactionServiceError('Amount must be a positive whole number.');
    }
    if (!isValidDateString(input.date)) {
      throw new TransactionServiceError('Choose a valid transaction date.');
    }

    const category = await this.categories.getById(input.categoryId);
    if (!category) {
      throw new TransactionServiceError('Choose an available category.');
    }
    if (category.type !== input.type) {
      throw new TransactionServiceError(`Choose an ${input.type} category for this transaction.`);
    }
  }
}
