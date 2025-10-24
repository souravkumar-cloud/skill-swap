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
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
}

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: faHome,
    },
    {
      name: 'Skill Exchange',
      href: '/skill-exchange',
      icon: faArrowRightArrowLeft,
    },
    {
      name: 'Learning Hub',
      href: '/learning-hub',
      icon: faGraduationCap,
    },
    {
      name: 'Community',
      href: '/community',
      icon: faUsers,
    },
    {
      name: 'Resources',
      href: '/resources',
      icon: faBookOpen,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: faUser,
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className={`fixed left-0 top-[70px] h-[calc(100vh-70px)] bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 ease-in-out z-40 shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-blue-50 transition-colors"
      >
        <FontAwesomeIcon
          icon={isCollapsed ? faChevronRight : faChevronLeft}
          className="text-sm"
        />
      </button>

      {/* Sidebar Content */}
      <div className="flex flex-col h-full">
        {/* Menu Items */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive(item.href)
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'hover:bg-blue-700 text-white'
              }`}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={`text-xl transition-transform duration-200 ${
                  !isCollapsed && 'group-hover:scale-110'
                }`}
              />
              {!isCollapsed && (
                <span className="font-medium text-sm whitespace-nowrap">
                  {item.name}
                </span>
              )}
              
              {/* Active Indicator */}
              {isActive(item.href) && !isCollapsed && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        {!isCollapsed && (
          <div className="px-6 py-4 border-t border-blue-500">
            <div className="bg-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Need Help?</h3>
              <p className="text-xs text-blue-200 mb-3">
                Check our documentation or contact support
              </p>
              <button className="w-full bg-white text-blue-600 text-xs font-medium py-2 rounded-md hover:bg-blue-50 transition-colors">
                Get Support
              </button>
            </div>
          </div>
        )}

        {/* Collapsed Bottom Icon */}
        {isCollapsed && (
          <div className="px-3 py-4 border-t border-blue-500">
            <button className="w-full flex justify-center items-center py-3 rounded-lg hover:bg-blue-700 transition-colors">
              <span className="text-2xl">💬</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;