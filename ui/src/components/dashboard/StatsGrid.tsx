import { Package, LayoutGrid, Store } from 'lucide-react';
import StatCard from './StatCard';

export default function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Total Products" value="2,441" icon={Package} />
      <StatCard title="Categories" value="14" icon={LayoutGrid} />
      <StatCard title="Sellers" value="4" icon={Store} />
    </div>
  );
}