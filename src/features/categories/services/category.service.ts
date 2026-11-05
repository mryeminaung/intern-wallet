import { z } from 'zod';
import type { CategoryRepository } from '../../../database/repositories/category.repository';
import type { Category } from '../../../types/common';

const categoryInput = z.object({
  name: z.string().trim().min(1, 'Enter a category name.').max(40),
  icon: z.string().trim().min(1, 'Enter an icon.').max(8),
  type: z.enum(['income', 'expense']),
});

export class CategoryService {
  public constructor(private readonly categories: CategoryRepository) {}

  public list(): Promise<readonly Category[]> {
    return this.categories.list();
  }

  public async save(input: z.input<typeof categoryInput>, id?: string): Promise<Category> {
    const value = categoryInput.parse(input);
    const existing = id ? await this.categories.getById(id) : null;
    if (id && (!existing || existing.isDefault)) throw new Error('This category cannot be edited.');
    if (existing && existing.type !== value.type) throw new Error('Category type cannot be changed.');
    const all = await this.categories.list(value.type);
    if (all.some((category) => category.id !== id && category.name.toLocaleLowerCase() === value.name.toLocaleLowerCase())) {
      throw new Error('A category with this name already exists.');
    }
    const saved = id
      ? await this.categories.update(id, value.name, value.icon)
      : await this.categories.create(value.name, value.icon, value.type);
    if (!saved) throw new Error('Category could not be saved.');
    return saved;
  }

  public async delete(id: string): Promise<void> {
    const category = await this.categories.getById(id);
    if (!category || category.isDefault) throw new Error('This category cannot be deleted.');
    if (!await this.categories.delete(id)) throw new Error('This category is used by transactions or budgets.');
  }
}
