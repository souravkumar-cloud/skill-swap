'use client';
import React, { ReactNode } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

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
      {/* Header */}
      <Header user={user} />

      {/* Main Container */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 ml-64 mt-[70px] p-6 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

/* 
USAGE EXAMPLE:

// In your page files (e.g., app/dashboard/page.tsx):

import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: '/avatars/john.jpg'
  };

  return (
    <DashboardLayout user={user}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Your dashboard content here *\/}
      </div>
    </DashboardLayout>
  );
}
*/