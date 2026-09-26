import StatsGrid from '@/components/dashboard/StatsGrid';
import QuickLinks from '@/components/dashboard/QuickLinks';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Mock data — baad mein API se aayega
const recentlyAddedRobots = [
  {
    id: 1,
    name: 'Unitree Go2',
    category: 'Quadruped Robot',
    price: '$1,599.00',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400',
  },
  {
    id: 2,
    name: 'uArm Swift Pro',
    category: 'Desktop Robotic Arm',
    price: '$899.00',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
  },
  {
    id: 3,
    name: 'RoboMaster S1',
    category: 'AI Educational Robot',
    price: '$499.00',
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back <span className="inline-block">👋</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Explore, compare, and learn about robots.
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <QuickLinks />
      </div>

      {/* Recently Added Robots */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recently Added Robots
          </h2>
          <Link
            href="/catalog"
            className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 text-sm"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentlyAddedRobots.map((robot) => (
            <Link
              key={robot.id}
              href={`/catalog`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
            >
              <div className="aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={robot.image}
                  alt={robot.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{robot.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{robot.category}</p>
                <p className="text-green-600 font-bold mt-2">{robot.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Empty State */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
        <div className="text-4xl mb-3">🤖</div>
        <h3 className="font-semibold text-gray-700 mb-2">Nothing here yet.</h3>
        <p className="text-gray-500 text-sm">
          Browse the catalog to get started.
        </p>
      </div>
    </div>
  );
}