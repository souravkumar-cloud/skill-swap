'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Loader2 } from 'lucide-react';
import {
  faUsers,
  faHandshake,
  faLightbulb,
  faTrophy,
  faArrowTrendUp,
  faSpinner,
  faPlus,
  faTimes,
  faCode,
  faBriefcase,
  faExchangeAlt,
  faTrash,
  faArrowRight,
  faCheckCircle,
  faStar,
  faFilter,
  faSearch,
  faStarHalfAlt,
  faUser,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

interface DashboardStats {
  skillsShared: number;
  activeConnections: number;
  skillsLearning: number;
  Rating: number;
  achievements: number;
  trends: {
    weeklySkillsShared: number;
    newConnections: number;
    learningInProgress: number;
    monthlyAchievements: number;
    DailyRating: number;
  };
}

interface Match {
  id: string;
  name: string;
  email: string;
  image?: string;
  avatar: string;
  offersSkill: string;
  needsSkill: string;
  allOfferedSkills?: string[];
  allNeededSkills?: string[];
  matchScore: number;
  rating: number;
  completedProjects: number;
  responseTime: string;
  canSwap: boolean;
  swapStatus?: 'pending' | 'accepted' | null;
  hasSwapProposal?: boolean;
}

interface UserSkills {
  skills: string[];
  learning: string[];
}

interface SwapProposal {
  _id: string;
  proposerId: string;
  receiverId: string;
  status: string;
}

export default function WorkExchangeDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user;

  const [userSkills, setUserSkills] = useState<UserSkills>({ skills: [], learning: [] });
  const [matches, setMatches] = useState<Match[]>([]);
  const [existingProposals, setExistingProposals] = useState<SwapProposal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    skillsShared: 0,
    activeConnections: 0,
    skillsLearning: 0,
    Rating: 0,
    achievements: 0,
    trends: {
      weeklySkillsShared: 0,
      newConnections: 0,
      learningInProgress: 0,
      monthlyAchievements: 0,
      DailyRating: 0,
    },
    
  });
  
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'offer' | 'need'>('offer');
  const [newSkill, setNewSkill] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterMatch, setFilterMatch] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setError(null);
    
    try {
      // Fetch user skills
      const skillsRes = await fetch('/api/users/skills');
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setUserSkills(skillsData);
      }

      // Fetch stats
      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Fetch matches (now includes swapStatus for each match)
      const matchesRes = await fetch('/api/matches/find');
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData.matches);
      }

      // Note: Swap status is now included in each match from /api/matches/find
      // The existingProposals state is kept for backward compatibility with getSwapStatus fallback
      setExistingProposals([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Unable to load some data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session, fetchDashboardData]);

  // Auto-refresh every 30 seconds to catch proposal status changes
  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [session, fetchDashboardData]);

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/users/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: newSkill.trim(),
          type: modalType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserSkills({ skills: data.skills, learning: data.learning });
        setNewSkill('');
        setShowAddModal(false);
        fetchDashboardData(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add service');
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSkill = async (skill: string, type: 'offer' | 'need') => {
    try {
      const response = await fetch('/api/users/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, type }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserSkills({ skills: data.skills, learning: data.learning });
        fetchDashboardData(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove service');
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      alert('Failed to remove service. Please try again.');
    }
  };

  const handleProposeSwap = async (match: Match) => {
    try {
      const response = await fetch('/api/matches/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchedUserId: match.id,
          skillOffered: match.needsSkill, // What I'll do for them
          skillRequested: match.offersSkill, // What I want them to do
          message: `Hi! I'd like to swap services with you.`
        }),
      });

      if (response.ok) {
        // Refresh dashboard to update the matches list
        await fetchDashboardData(true);
        // Navigate to active swaps so the user sees the pending/active swap
        window.location.href = '/activeSwap';
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send proposal');
      }
    } catch (error) {
      console.error('Error proposing swap:', error);
      alert('Failed to send proposal. Please try again.');
    }
  };

  // Helper function to check if proposal exists with this user
  const hasExistingProposal = (matchId: string): boolean => {
    return existingProposals.some(
      proposal => 
        proposal.receiverId === matchId || 
        proposal.proposerId === matchId
    );
  };

  // Helper function to get swap status for a match
  const getSwapStatus = (match: Match): 'pending' | 'accepted' | null => {
    // First check if match has swapStatus from API
    if (match.swapStatus) {
      return match.swapStatus;
    }
    // Fallback to checking existingProposals
    const proposal = existingProposals.find(
      p => p.receiverId === match.id || p.proposerId === match.id
    );
    return proposal ? (proposal.status as 'pending' | 'accepted') : null;
  };

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper function to format rating
  const formatRating = (rating: number): string => {
    if (rating === 0) return 'New';
    return rating.toFixed(1);
  };

  // Filter matches - now we show all matches and display status on button
  const availableMatches = matches;

  const filteredMatches = availableMatches
    .filter(match => {
      if (filterMatch === 'high') return match.matchScore >= 90;
      if (filterMatch === 'medium') return match.matchScore >= 80 && match.matchScore < 90;
      return true;
    })
    .filter(match => 
      searchQuery === '' || 
      match.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.offersSkill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.needsSkill.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading dashboard...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  const statsConfig = [
  {
    title: 'Services I Offer',
    value: stats?.skillsShared ?? 0,
    icon: faBriefcase,
    color: 'bg-blue-500',
    trend: `+${stats?.trends?.weeklySkillsShared ?? 0} this week`,
  },
  {
    title: 'Active Swaps',
    value: stats?.activeConnections ?? 0,
    icon: faExchangeAlt,
    color: 'bg-green-500',
    trend: `+${stats?.trends?.newConnections ?? 0} new`,
  },
  {
    title: 'Services I Need',
    value: stats?.skillsLearning ?? 0,
    icon: faLightbulb,
    color: 'bg-purple-500',
    trend: `${stats?.trends?.learningInProgress ?? 0} in progress`,
  },
  {
    title: 'Completed Swaps',
    value: stats?.achievements ?? 0,
    icon: faTrophy,
    color: 'bg-orange-500',
    trend: `+${stats?.trends?.monthlyAchievements ?? 0} this month`,
  },
  {
    title: 'Avg Rating',
    value: (stats?.Rating ?? 0).toFixed(1),
    icon: faStarHalfAlt,
    color: 'bg-yellow-500',
    trend: `+${(stats?.trends?.DailyRating ?? 0).toFixed(1)} this month`,
  },
];


  return (
    <div className="min-h-screen  p-6">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 text-yellow-200">
          <p className="text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name || 'Developer'}! 👋
          </h1>
          <p className="text-gray-400">
            Exchange work for work - No money involved, just pure skill swapping
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statsConfig.map((stat, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-700 hover:border-gray-600"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center shadow-lg`}
              >
                <FontAwesomeIcon icon={stat.icon} className="text-white text-xl" />
              </div>
              <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                <FontAwesomeIcon icon={faArrowTrendUp} className="text-xs" />
                {stat.trend}
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-400">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* My Skills Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Services I Offer */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faBriefcase} className="text-blue-500" />
              Services I Offer
            </h2>
            <button
              onClick={() => {
                setModalType('offer');
                setShowAddModal(true);
              }}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} /> Add
            </button>
          </div>
          {userSkills.skills.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No services added yet</p>
          ) : (
            <div className="space-y-2">
              {userSkills.skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faCode} className="text-white text-sm" />
                    </div>
                    <span className="text-white font-medium">{skill}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(skill, 'offer')}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Services I Need */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faLightbulb} className="text-purple-500" />
              Services I Need
            </h2>
            <button
              onClick={() => {
                setModalType('need');
                setShowAddModal(true);
              }}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} /> Add
            </button>
          </div>
          {userSkills.learning.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No needs added yet</p>
          ) : (
            <div className="space-y-2">
              {userSkills.learning.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faLightbulb} className="text-white text-sm" />
                    </div>
                    <span className="text-white font-medium">{skill}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(skill, 'need')}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Potential Swap Matches */}
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faHandshake} className="text-green-500" />
            Potential Swap Matches
            <span className="text-sm font-normal text-gray-400">({filteredMatches.length} found)</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterMatch}
              onChange={(e) => setFilterMatch(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Matches</option>
              <option value="high">High Match (90%+)</option>
              <option value="medium">Medium Match (80-90%)</option>
            </select>
          </div>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FontAwesomeIcon icon={faUsers} className="text-5xl mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No matches found</p>
            <p className="text-sm">
              {availableMatches.length === 0 && matches.length > 0
                ? 'All potential matches already have active proposals!'
                : 'Add your skills and needs to find swap partners!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className="bg-gray-700/50 rounded-lg p-5 hover:bg-gray-700 transition-all border border-gray-600 hover:border-gray-500"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* User Avatar/Image */}
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                    {match.image ? (
                      <Image
                        src={match.image}
                        alt={match.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white">{getInitials(match.name)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-white text-lg">{match.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        match.matchScore >= 90 ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                      }`}>
                        {match.matchScore}% Match
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
                        {formatRating(match.rating)}
                      </span>
                      <span>{match.completedProjects} swaps</span>
                      <span>⚡ {match.responseTime}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">They can do:</p>
                    <p className="text-green-400 font-semibold flex items-center gap-2">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                      {match.offersSkill}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faExchangeAlt} className="text-gray-500 text-xl" />
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">They need:</p>
                    <p className="text-blue-400 font-semibold flex items-center gap-2">
                      <FontAwesomeIcon icon={faLightbulb} className="text-blue-500" />
                      {match.needsSkill}
                    </p>
                  </div>
                </div>

                {(() => {
                  const swapStatus = getSwapStatus(match);
                  
                  if (swapStatus === 'pending') {
                    return (
                      <button
                        disabled
                        className="w-full bg-yellow-900/50 text-yellow-400 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-not-allowed border border-yellow-700 shadow-lg"
                        title="Swap proposal is pending"
                      >
                        <FontAwesomeIcon icon={faClock} />
                        Pending
                      </button>
                    );
                  } else if (swapStatus === 'accepted') {
                    return (
                      <button
                        disabled
                        className="w-full bg-green-900/50 text-green-400 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-not-allowed border border-green-700 shadow-lg"
                        title="Swap proposal accepted"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Accepted
                      </button>
                    );
                  } else {
                    return (
                      <button
                        onClick={() => handleProposeSwap(match)}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg"
                      >
                        <FontAwesomeIcon icon={faHandshake} />
                        Propose Swap
                        <FontAwesomeIcon icon={faArrowRight} />
                      </button>
                    );
                  }
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Skill/Need Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {modalType === 'offer' ? 'Add Service You Offer' : 'Add Service You Need'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {modalType === 'offer' ? 'What can you do?' : 'What do you need?'}
                </label>
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder={modalType === 'offer' ? 'e.g., React Development, Logo Design' : 'e.g., Mobile App, SEO Optimization'}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !submitting) handleAddSkill();
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {modalType === 'offer' 
                    ? '💡 Be specific about your skills to find better matches' 
                    : '💡 Describe exactly what work you need done'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSkill}
                  disabled={!newSkill.trim() || submitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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