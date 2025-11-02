'use client';
import React, { ReactNode } from 'react';
import Header from '@/components/Header';

interface DashboardLayoutProps {
  children: ReactNode;
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, user }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with integrated navigation */}
      <Header user={user} />

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;