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
import SignOut from '@/app/(auth)/SignOut/SignOut';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
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

          {/* Right: Profile */}
          <div className="hidden md:flex items-center space-x-5 ">
            <Link href="/offer-skill" className="bg-blue-500 text-white px-4 py-2 rounded-full">
              Offer a Skill
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex text-sm rounded-full focus:outline-none"
              >
                <Image
                  className="h-10 w-10 rounded-full border-2 border-gray-300"
                  src={user?.avatarUrl || '/default-avatar.png'}
                  alt="User Avatar"
                  width={40}
                  height={40}
                />
              </button>

              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white">
                  <div className="py-1  text-gray-700">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{user?.name || 'Guest User'}</p>
                      <p className="text-sm text-gray-500">{user?.email || 'guest@example.com'}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100">
                      <FontAwesomeIcon icon={faUser} className="w-4" /> View Profile
                    </Link>
                    <Link href="/logout" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100">
                      <FontAwesomeIcon icon={faRightFromBracket} className="w-4" /> Log Out
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
