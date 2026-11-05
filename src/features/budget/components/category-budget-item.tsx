import type { BudgetProgress } from '../../../types/common';
import { BudgetCard } from './budget-card';

type CategoryBudgetItemProps = {
  budget: BudgetProgress;
  onEdit: () => void;
  onDelete: () => void;
};

export function CategoryBudgetItem(props: CategoryBudgetItemProps): React.JSX.Element {
  return <BudgetCard {...props} />;
}
