'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faHandshake,
  faLightbulb,
  faTrophy,
  faArrowTrendUp,
  faSpinner,
  faSync,
  faPlus,
  faTimes,
  faCode,
  faBriefcase,
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
  const router = useRouter();
  const user = session?.user;

  const [stats, setStats] = useState<DashboardStats>({
    skillsShared: 0,
    activeConnections: 0,
    skillsLearning: 0,
    achievements: 0,
    trends: {
      weeklySkillsShared: 0,
      newConnections: 0,
      learningInProgress: 0,
      monthlyAchievements: 0,
    }
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState<'offer' | 'need'>('offer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setError(null);
    
    try {
      // Fetch stats
      try {
        const statsRes = await fetch('/api/dashboard/stats');
        const contentType = statsRes.headers.get('content-type');
        
        if (statsRes.ok && contentType?.includes('application/json')) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      } catch (err) {
        console.warn('Stats API not ready:', err);
      }

      // Fetch matches
      try {
        const matchesRes = await fetch('/api/dashboard/matchs');
        const contentType = matchesRes.headers.get('content-type');
        
        if (matchesRes.ok && contentType?.includes('application/json')) {
          const matchesData = await matchesRes.json();
          setMatches(matchesData.matches);
        }
      } catch (err) {
        console.warn('Matches API not ready:', err);
      }

      // Fetch progress
      try {
        const progressRes = await fetch('/api/dashboard/progress');
        const contentType = progressRes.headers.get('content-type');
        
        if (progressRes.ok && contentType?.includes('application/json')) {
          const progressData = await progressRes.json();
          setProgress(progressData.progress);
        }
      } catch (err) {
        console.warn('Progress API not ready:', err);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Unable to load dashboard data. APIs may not be configured yet.');
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

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/users/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skill: newSkill.trim(),
          type: skillType,
        }),
      });

      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType?.includes('application/json')) {
        const data = await response.json();
        setNewSkill('');
        setShowAddSkillModal(false);
        fetchDashboardData(true);
        alert('✅ Work service added successfully!');
      } else {
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          alert(data.message || 'Failed to add service');
        } else {
          alert('⚠️ API not configured yet. Please create /api/user/skills route.');
        }
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('⚠️ API endpoint not available. Please set up the backend routes.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBrowseSkills = () => {
    router.push('/browse');
  };

  const handleViewMessages = () => {
    router.push('/messages');
  };

  const handleConnect = async (matchId: string) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId }),
      });

      const contentType = response.headers.get('content-type');

      if (response.ok && contentType?.includes('application/json')) {
        alert('✅ Work request sent!');
        fetchDashboardData(true);
      } else {
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          alert(data.message || 'Failed to send work request');
        } else {
          alert('⚠️ Connection API not configured yet.');
        }
      }
    } catch (error) {
      console.error('Error sending connection:', error);
      alert('⚠️ Connection endpoint not available.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const statsConfig = [
    {
      title: 'Services I Offer',
      value: stats?.skillsShared || 0,
      icon: faBriefcase,
      color: 'bg-blue-500',
      trend: `+${stats?.trends.weeklySkillsShared || 0} this week`,
    },
    {
      title: 'Active Projects',
      value: stats?.activeConnections || 0,
      icon: faCode,
      color: 'bg-green-500',
      trend: `+${stats?.trends.newConnections || 0} new`,
    },
    {
      title: 'Services Needed',
      value: stats?.skillsLearning || 0,
      icon: faLightbulb,
      color: 'bg-purple-500',
      trend: `${stats?.trends.learningInProgress || 0} in progress`,
    },
    {
      title: 'Completed Works',
      value: stats?.achievements || 0,
      icon: faTrophy,
      color: 'bg-orange-500',
      trend: `+${stats?.trends.monthlyAchievements || 0} this month`,
    },
  ];

  return (
    <div className="min-h-screen p-6">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 text-yellow-200">
          <p className="text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Welcome Section */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name || 'Developer'}! 👋
          </h1>
          <p className="text-gray-400">
            Exchange work for work - Build apps, get websites, trade services.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 flex items-center gap-2 disabled:opacity-50"
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
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faHandshake} className="text-blue-500" />
            Potential Work Exchange Matches
          </h2>
          {matches.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FontAwesomeIcon icon={faUsers} className="text-5xl mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">No matches found yet</p>
              <p className="text-sm">Add what you can do and what you need below!</p>
              <p className="text-xs mt-2 text-gray-500">
                Example: "I'll develop your app if you design my website"
              </p>
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
                      Needs: <span className="font-medium text-blue-400">{match.skill}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Can do: <span className="font-medium text-green-400">{match.exchange}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-2">{match.time}</p>
                    <button 
                      onClick={() => handleConnect(match.id)}
                      className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Propose Deal
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
            <button 
              onClick={() => setShowAddSkillModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Service/Need
            </button>
            <button 
              onClick={handleBrowseSkills}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Browse Opportunities
            </button>
            <button 
              onClick={handleViewMessages}
              className="w-full border-2 border-gray-600 text-gray-300 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              View Messages
            </button>
          </div>

          {/* Progress Section */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="font-semibold text-white mb-3">Project Progress</h3>
            {progress.length === 0 ? (
              <p className="text-sm text-gray-400">No active projects yet.</p>
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

      {/* Add Service/Need Modal */}
      {showAddSkillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Add Service or Need</h3>
              <button
                onClick={() => setShowAddSkillModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What are you adding?
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSkillType('offer')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      skillType === 'offer'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    I can do this
                  </button>
                  <button
                    onClick={() => setSkillType('need')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      skillType === 'need'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    I need this
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {skillType === 'offer' ? 'Service I Offer' : 'Service I Need'}
                </label>
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder={skillType === 'offer' ? 'e.g., Develop mobile apps, Design websites' : 'e.g., Build me a website, Create an app'}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !submitting) {
                      handleAddSkill();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {skillType === 'offer' 
                    ? 'What work can you do for others?' 
                    : 'What work do you need done?'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddSkillModal(false)}
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSkill}
                  disabled={!newSkill.trim() || submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}