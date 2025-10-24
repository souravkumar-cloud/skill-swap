'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faEnvelope,
  faBell,
  faUser,
  faLightbulb,
  faGear,
  faCircleQuestion,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';

interface UserType {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

interface NavbarProps {
  user?: UserType;
}

const Header: React.FC<NavbarProps> = ({ user }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[70px]">
          {/* Left: Logo */}
          <Link href="/dashboard" className="text-blue-500 text-2xl font-semibold">
            Skill Swap
          </Link>

          {/* Right: Profile & Notifications */}
          <div className="hidden md:flex items-center space-x-5">
            {/* Bell/Notification Icon */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setIsBellOpen(!isBellOpen)}
                className="relative p-2 text-gray-600 hover:text-blue-500 transition-colors focus:outline-none"
              >
                <FontAwesomeIcon icon={faBell} className="text-2xl" />
                {/* Notification badge */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {isBellOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="font-semibold text-gray-900">Notifications</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {/* Sample notifications */}
                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b">
                        <p className="text-sm font-medium text-gray-900">New skill match!</p>
                        <p className="text-xs text-gray-500 mt-1">John wants to learn React from you</p>
                        <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b">
                        <p className="text-sm font-medium text-gray-900">Message received</p>
                        <p className="text-xs text-gray-500 mt-1">Sarah sent you a message</p>
                        <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <p className="text-sm font-medium text-gray-900">Profile viewed</p>
                        <p className="text-xs text-gray-500 mt-1">Mike viewed your profile</p>
                        <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200 text-center">
                      <Link href="/notifications" className="text-sm text-blue-500 hover:text-blue-600">
                        View all notifications
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {user?.avatarUrl ? (
                  <Image
                    className="h-10 w-10 rounded-full border-2 border-gray-300 object-cover"
                    src={user.avatarUrl}
                    alt="User Avatar"
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full border-2 border-gray-300 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </button>

              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1 text-gray-700">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{user?.name || 'Guest User'}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email || 'guest@example.com'}</p>
                    </div>
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FontAwesomeIcon icon={faUser} className="text-base" /> View Profile
                    </Link>
                    <Link 
                      href="/settings" 
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FontAwesomeIcon icon={faGear} className="text-base" /> Settings
                    </Link>
                    <Link 
                      href="/help" 
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FontAwesomeIcon icon={faCircleQuestion} className="text-base" /> Help
                    </Link>
                    <div className="border-t border-gray-200 mt-1">
                      <Link 
                        href="/logout" 
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-red-600 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} className="text-base" /> Log Out
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-blue-500 focus:outline-none"
            >
              <FontAwesomeIcon icon={faBars} className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex items-center space-x-3 px-4 py-3 border-b">
              {user?.avatarUrl ? (
                <Image
                  className="h-12 w-12 rounded-full border-2 border-gray-300"
                  src={user.avatarUrl}
                  alt="User Avatar"
                  width={48}
                  height={48}
                />
              ) : (
                <div className="h-12 w-12 rounded-full border-2 border-gray-300 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{user?.name || 'Guest User'}</p>
                <p className="text-sm text-gray-500">{user?.email || 'guest@example.com'}</p>
              </div>
            </div>
            <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100">
              <FontAwesomeIcon icon={faUser} className="text-base" /> View Profile
            </Link>
            <Link href="/notifications" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100">
              <FontAwesomeIcon icon={faBell} className="text-base" /> Notifications
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100">
              <FontAwesomeIcon icon={faGear} className="text-base" /> Settings
            </Link>
            <Link href="/logout" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-red-600">
              <FontAwesomeIcon icon={faRightFromBracket} className="text-base" /> Log Out
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;