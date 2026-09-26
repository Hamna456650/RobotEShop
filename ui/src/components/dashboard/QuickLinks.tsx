import Link from 'next/link';
import { Search, Sparkles, BookOpen, Users, ArrowRight } from 'lucide-react';

const links = [
  {
    href: '/catalog',
    label: 'Browse Catalog',
    icon: Search,
  },
  {
    href: '/assistant',
    label: 'Ask AI Assistant',
    icon: Sparkles,
  },
  {
    href: '/tutorials',
    label: 'View Tutorials',
    icon: BookOpen,
  },
  {
    href: '/community',
    label: 'Join Community',
    icon: Users,
  },
];

export default function QuickLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-green-200 transition-all group"
          >
            <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Icon size={20} className="text-green-600" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800">
              {link.label}
            </span>
            <ArrowRight
              size={18}
              className="text-green-600 group-hover:translate-x-1 transition-transform"
            />
          </Link>
        );
      })}
    </div>
  );
}