'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faArrowRightArrowLeft,
  faGraduationCap,
  faUsers,
  faBookOpen,
  faUser,
  faBars,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
}

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: faHome },
    { name: 'Skill Exchange', href: '/skill-exchange', icon: faArrowRightArrowLeft },
    { name: 'Learning Hub', href: '/learning-hub', icon: faGraduationCap },
    { name: 'Community', href: '/community', icon: faUsers },
    { name: 'Resources', href: '/resources', icon: faBookOpen },
    { name: 'Profile', href: '/profile', icon: faUser },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Hamburger Button - Fixed at top left, above everything */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className="text-lg" />
      </button>

      {/* Overlay - Only shows when sidebar is open, doesn't block content */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Slides over content */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gray-800 border-r border-gray-700 shadow-2xl z-40 transition-transform duration-300 ease-in-out w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-700 flex items-center justify-between px-6">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        {/* Menu Items - Scrollable */}
        <nav className="py-4 px-3 space-y-1 overflow-y-auto h-[calc(100vh-16rem)]">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-lg w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-white mb-1">Need Help?</h3>
            <p className="text-xs text-gray-400 mb-3">
              Contact our support team
            </p>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Support
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;