'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faBell,
  faUser,
  faGear,
  faCircleQuestion,
  faRightFromBracket,
  faHome,
  faArrowRightArrowLeft,
  faGraduationCap,
  faUsers,
  faBookOpen,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

interface UserType {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

interface NavbarProps {
  user?: UserType;
}

interface MenuItem {
  name: string;
  href: string;
  icon: any;
}

interface FriendRequest {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

const Header: React.FC<NavbarProps> = ({ user }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentRequests, setRecentRequests] = useState<FriendRequest[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: faHome },
    { name: 'Skill Exchange', href: '/skill-exchange', icon: faArrowRightArrowLeft },
    { name: 'friends', href: '/friends', icon: faGraduationCap },
    { name: 'wallet', href: '/wallet', icon: faBookOpen },
    { name: 'Profile', href: '/profile', icon: faUser },
  ];

  const isActive = (href: string) => pathname === href;

  // Fetch notification count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/friends/requests');
        if (response.ok) {
          const data = await response.json();
          const pendingRequests = data.requests?.filter((req: FriendRequest) => req.status === 'pending') || [];
          setNotificationCount(pendingRequests.length);
          setRecentRequests(pendingRequests.slice(0, 3)); // Show only 3 most recent
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (user) {
      fetchNotifications();
      // Refresh every 30 seconds (optional)
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[70px]">
          {/* Left: Logo */}
          <Link href="/dashboard" className="text-blue-500 text-2xl font-semibold flex-shrink-0">
            Skill Swap
          </Link>

          {/* Center: Navigation Menu (Desktop) */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center px-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="text-sm" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Right: Profile & Notifications */}
          <div className="hidden md:flex items-center space-x-5 flex-shrink-0">
            {/* Bell/Notification Icon */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setIsBellOpen(!isBellOpen)}
                className="relative p-2 text-gray-600 hover:text-blue-500 transition-colors focus:outline-none"
              >
                <FontAwesomeIcon icon={faBell} className="text-2xl" />
                {/* Notification badge with count */}
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>

              {isBellOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <p className="font-semibold text-gray-900">Notifications</p>
                      {notificationCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {notificationCount}
                        </span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notificationCount === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <FontAwesomeIcon icon={faBell} className="text-3xl text-gray-300 mb-2" />
                          <p className="text-sm">No new notifications</p>
                        </div>
                      ) : (
                        recentRequests.map((request) => (
                          <Link
                            key={request._id}
                            href="/notifications"
                            onClick={() => setIsBellOpen(false)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b block"
                          >
                            <div className="flex items-center gap-3">
                              {request.senderId.avatar?.startsWith('http') ? (
                                <img 
                                  src={request.senderId.avatar} 
                                  alt={request.senderId.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                  {request.senderId.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Friend Request</p>
                                <p className="text-xs text-gray-500 mt-1">{request.senderId.name} wants to connect</p>
                                <p className="text-xs text-gray-400 mt-1">{getTimeAgo(request.createdAt)}</p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200 text-center">
                      <Link 
                        href="/notifications" 
                        onClick={() => setIsBellOpen(false)}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                      >
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
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile Notification Bell */}
            <Link href="/notifications" className="relative p-2 text-gray-600">
              <FontAwesomeIcon icon={faBell} className="text-xl" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-blue-500 focus:outline-none p-2"
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            {/* User Info */}
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

            {/* Navigation Items */}
            <div className="py-2">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="text-base w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Profile Actions */}
            <div className="border-t border-gray-200 pt-2">
              <Link 
                href="/notifications" 
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faBell} className="text-base" /> 
                  <span>Notifications</span>
                </div>
                {notificationCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </Link>
              <Link 
                href="/settings" 
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FontAwesomeIcon icon={faGear} className="text-base" /> Settings
              </Link>
              <Link 
                href="/logout" 
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-red-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="text-base" /> Log Out
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;