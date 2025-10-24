'use client';
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faHandshake,
  faLightbulb,
  faTrophy,
  faArrowTrendUp,
} from '@fortawesome/free-solid-svg-icons';

export default function DashboardPage() {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: '/avatars/john.jpg',
  };

  const stats = [
    {
      title: 'Skills Shared',
      value: '12',
      icon: faHandshake,
      color: 'bg-blue-500',
      trend: '+3 this week',
    },
    {
      title: 'Active Connections',
      value: '28',
      icon: faUsers,
      color: 'bg-green-500',
      trend: '+5 new',
    },
    {
      title: 'Skills Learning',
      value: '5',
      icon: faLightbulb,
      color: 'bg-purple-500',
      trend: '2 in progress',
    },
    {
      title: 'Achievements',
      value: '18',
      icon: faTrophy,
      color: 'bg-orange-500',
      trend: '+2 this month',
    },
  ];

  const recentMatches = [
    {
      name: 'Sarah Johnson',
      skill: 'React Development',
      exchange: 'UI/UX Design',
      time: '2 hours ago',
      avatar: '👩‍💻',
    },
    {
      name: 'Mike Chen',
      skill: 'Python Programming',
      exchange: 'Web Development',
      time: '5 hours ago',
      avatar: '👨‍💼',
    },
    {
      name: 'Emily Davis',
      skill: 'Graphic Design',
      exchange: 'Content Writing',
      time: '1 day ago',
      avatar: '👩‍🎨',
    },
  ];

  return (
    <DashboardLayout user={user}>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your skill exchanges today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}
              >
                <FontAwesomeIcon icon={stat.icon} className="text-white text-xl" />
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                <FontAwesomeIcon icon={faArrowTrendUp} className="text-xs" />
                {stat.trend}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Matches */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Skill Matches
          </h2>
          <div className="space-y-4">
            {recentMatches.map((match, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                  {match.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{match.name}</h3>
                  <p className="text-sm text-gray-600">
                    Wants to learn <span className="font-medium text-blue-600">{match.skill}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Can teach <span className="font-medium text-green-600">{match.exchange}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-2">{match.time}</p>
                  <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium">
              + Add New Skill
            </button>
            <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Browse Skills
            </button>
            <button className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              View Messages
            </button>
          </div>

          {/* Progress Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Learning Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">React Mastery</span>
                  <span className="font-medium text-blue-600">75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">UI Design</span>
                  <span className="font-medium text-purple-600">50%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}