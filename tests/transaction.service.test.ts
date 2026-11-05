import type { CategoryRepository } from '../src/database/repositories/category.repository';
import type { TransactionRepository } from '../src/database/repositories/transaction.repository';
import { TransactionService } from '../src/features/transactions/services/transaction.service';

function createRepositories(): {
  transactions: TransactionRepository;
  categories: CategoryRepository;
} {
  return {
    transactions: {
      getAll: jest.fn(),
      list: jest.fn(),
      getById: jest.fn(),
      getByDateRange: jest.fn(),
      getByCategory: jest.fn(),
      search: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    categories: {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('TransactionService', () => {
  it('rejects a category that belongs to the opposite transaction type', async () => {
    const repositories = createRepositories();
    jest.mocked(repositories.categories.getById).mockResolvedValue({
      id: 'salary',
      name: 'Salary',
      icon: '💼',
      type: 'income',
      isDefault: true,
    });
    const service = new TransactionService(repositories.transactions, repositories.categories);

    await expect(service.create({
      type: 'expense',
      amount: 1000,
      categoryId: 'salary',
      date: '2026-11-04T00:00:00.000Z',
      note: null,
    })).rejects.toThrow('expense category');
    expect(repositories.transactions.create).not.toHaveBeenCalled();
  });

  it('blocks non-positive amounts before touching the repository', async () => {
    const repositories = createRepositories();
    const service = new TransactionService(repositories.transactions, repositories.categories);

    await expect(service.create({
      type: 'expense',
      amount: 0,
      categoryId: 'food',
      date: '2026-11-04T00:00:00.000Z',
    })).rejects.toThrow('positive whole number');
    expect(repositories.categories.getById).not.toHaveBeenCalled();
  });
});
