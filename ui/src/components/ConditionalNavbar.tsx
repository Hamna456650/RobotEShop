'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Dashboard ke saare pages pe Navbar hide karo
  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return <Navbar />;
}