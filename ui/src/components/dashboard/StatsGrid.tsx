import { Package, LayoutGrid, Store, BookOpen } from 'lucide-react';
import StatCard from './StatCard';

interface StatsGridProps {
  /** Null while loading or when the catalogue server is down: shown as a dash. */
  products: number | null;
  categories: number | null;
  stores: number;
  tutorials: number | null;
}

const show = (value: number | null) =>
  value === null ? '–' : value.toLocaleString('en-US');

export default function StatsGrid({ products, categories, stores, tutorials }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Products" value={show(products)} icon={Package} />
      <StatCard title="Categories" value={show(categories)} icon={LayoutGrid} />
      <StatCard title="Stores" value={show(stores)} icon={Store} />
      <StatCard title="Tutorials" value={show(tutorials)} icon={BookOpen} />
    </div>
  );
}
