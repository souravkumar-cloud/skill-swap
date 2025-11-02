'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faHandshake,
  faLightbulb,
  faTrophy,
  faArrowTrendUp,
  faSpinner,
  faSync,
} from '@fortawesome/free-solid-svg-icons';

interface DashboardStats {
  skillsShared: number;
  activeConnections: number;
  skillsLearning: number;
  achievements: number;
  trends: {
    weeklySkillsShared: number;
    newConnections: number;
    learningInProgress: number;
    monthlyAchievements: number;
  };
}

interface Match {
  id: string;
  name: string;
  skill: string;
  exchange: string;
  time: string;
  avatar: string;
  status: string;
}

interface LearningProgress {
  skill: string;
  progress: number;
  color: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      // Fetch all data in parallel
      const [statsRes, matchesRes, progressRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/matches'),
        fetch('/api/dashboard/progress')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData.matches);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData.progress);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [session]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsConfig = [
    {
      title: 'Skills Shared',
      value: stats?.skillsShared || 0,
      icon: faHandshake,
      color: 'bg-blue-500',
      trend: `+${stats?.trends.weeklySkillsShared || 0} this week`,
    },
    {
      title: 'Active Connections',
      value: stats?.activeConnections || 0,
      icon: faUsers,
      color: 'bg-green-500',
      trend: `+${stats?.trends.newConnections || 0} new`,
    },
    {
      title: 'Skills Learning',
      value: stats?.skillsLearning || 0,
      icon: faLightbulb,
      color: 'bg-purple-500',
      trend: `${stats?.trends.learningInProgress || 0} in progress`,
    },
    {
      title: 'Achievements',
      value: stats?.achievements || 0,
      icon: faTrophy,
      color: 'bg-orange-500',
      trend: `+${stats?.trends.monthlyAchievements || 0} this month`,
    },
  ];

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your skill exchanges today.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 flex items-center gap-2"
        >
          <FontAwesomeIcon 
            icon={faSync} 
            className={`${refreshing ? 'animate-spin' : ''}`} 
          />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}
              >
                <FontAwesomeIcon icon={stat.icon} className="text-white text-xl" />
              </div>
              <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                <FontAwesomeIcon icon={faArrowTrendUp} className="text-xs" />
                {stat.trend}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-400">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Matches */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">
            Recent Skill Matches
          </h2>
          {matches.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No recent matches yet. Start connecting with others!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div
                  key={match.id || index}
                  className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                    {match.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{match.name}</h3>
                    <p className="text-sm text-gray-400">
                      Wants to learn <span className="font-medium text-blue-400">{match.skill}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Can teach <span className="font-medium text-green-400">{match.exchange}</span>
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
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium">
              + Add New Skill
            </button>
            <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Browse Skills
            </button>
            <button className="w-full border-2 border-gray-600 text-gray-300 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium">
              View Messages
            </button>
          </div>

          {/* Progress Section */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="font-semibold text-white mb-3">Learning Progress</h3>
            {progress.length === 0 ? (
              <p className="text-sm text-gray-400">No learning progress tracked yet.</p>
            ) : (
              <div className="space-y-3">
                {progress.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{item.skill}</span>
                      <span className={`font-medium text-${item.color}-400`}>
                        {item.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`bg-${item.color}-600 h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}