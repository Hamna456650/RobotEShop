'use client';

import Link from 'next/link';
import { Search, Menu, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { status, displayName, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <Menu size={24} />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="text-xl font-bold text-green-600">Servo</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 ml-4">
          <Link href="/" className="text-gray-700 hover:text-green-600 text-sm font-medium">
            Home
          </Link>
          <Link href="/catalog" className="text-gray-700 hover:text-green-600 text-sm font-medium">
            Catalog
          </Link>
          <Link href="/tutorials" className="text-gray-700 hover:text-green-600 text-sm font-medium">
            Tutorials
          </Link>
          <Link href="/assistant" className="text-gray-700 hover:text-green-600 text-sm font-medium">
            AI Assistant
          </Link>
          <Link href="/community" className="text-gray-700 hover:text-green-600 text-sm font-medium">
            Community
          </Link>
        </nav>
      </div>

      {/* Right: Search + Profile */}
      <div className="flex items-center gap-4">
        <button className="text-gray-600 hover:text-gray-900">
          <Search size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-1.5"
          >
            {status === 'signed-in' && displayName && (
              <span className="text-sm font-medium text-gray-700">
                {displayName}
              </span>
            )}
            <ChevronDown size={16} className="text-gray-500" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Dashboard
              </Link>
              <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Settings
              </Link>
              <hr className="my-1" />
              <button
                onClick={() => void signOut()}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}