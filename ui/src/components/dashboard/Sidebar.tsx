'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  BookOpen,
  Sparkles,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';

const mainLinks = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/catalog', label: 'Catalog', icon: Package },
  { href: '/tutorials', label: 'Tutorials', icon: BookOpen },
];

const toolLinks = [
  { href: '/assistant', label: 'AI Assistant', icon: Sparkles },
  { href: '/community', label: 'Community', icon: Users },
];

const accountLinks = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/auth/logout', label: 'Logout', icon: LogOut },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  const renderLink = (link: { href: string; label: string; icon: any }) => {
    const Icon = link.icon;
    const active = isActive(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-green-600 text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <Icon size={18} />
        <span>{link.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-gray-900 flex flex-col">
      {/* Sidebar content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* MAIN */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
            Main
          </p>
          <nav className="space-y-1">{mainLinks.map(renderLink)}</nav>
        </div>

        {/* TOOLS */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
            Tools
          </p>
          <nav className="space-y-1">{toolLinks.map(renderLink)}</nav>
        </div>

        {/* ACCOUNT */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
            Account
          </p>
          <nav className="space-y-1">{accountLinks.map(renderLink)}</nav>
        </div>
      </div>

      {/* Bottom brand */}
      <div className="p-4 border-t border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Servo</p>
            <p className="text-gray-500 text-xs">RoboCompare</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}