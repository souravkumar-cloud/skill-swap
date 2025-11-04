'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Loader2} from 'lucide-react';
import {
  faSearch,
  faFilter,
  faTimes,
  faUsers,
  faBriefcase,
  faChartLine,
  faSpinner,
  faMessage,
  faPaperPlane,
  faStar,
  faCheckCircle,
  faUserPlus,
  faClock,
  faBell,
  faCheck,
  faHandshake,
  faLightbulb,
  faExchangeAlt
} from '@fortawesome/free-solid-svg-icons';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  image?: string;
  avatar: string;
  bio?: string;
  skills?: string[];
  learning?: string[];
  rating?: number;
  completedProjects?: number;
  connections?: number;
  online?: boolean;
  friendStatus?: 'none' | 'pending' | 'accepted' | 'sent';
  hasSwapProposal?: boolean;
}

interface Message {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
}

interface ApiMessage {
  _id: string;
  senderId: {
    email: string;
    name: string;
  };
  receiverId: {
    email: string;
    name: string;
  };
  message: string;
  createdAt: string;
}

export default function SkillExchangePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  
  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Friend Request
  const [sendingRequest, setSendingRequest] = useState<Record<string, boolean>>({});
  
  // Swap Proposal
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetUser, setSwapTargetUser] = useState<User | null>(null);
  const [currentUserSkills, setCurrentUserSkills] = useState<string[]>([]);
  const [selectedSkillOffered, setSelectedSkillOffered] = useState('');
  const [selectedSkillRequested, setSelectedSkillRequested] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposingSwap, setProposingSwap] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<Record<string, number>>({});

  // Available Services List
  const services = [
    'all',
    'Web Development',
    'Mobile App Development',
    'Backend Development',
    'Frontend Development',
    'Full Stack Development',
    'API Development',
    'Database Design',
    'WordPress Development',
    'E-commerce Development',
    'UI/UX Design',
    'Graphic Design',
    'Logo Design',
    'Brand Identity',
    'Illustration',
    'Video Editing',
    'Animation',
    '3D Modeling',
    'Digital Marketing',
    'SEO Services',
    'Content Writing',
    'Copywriting',
    'Social Media Management',
    'Email Marketing',
    'Business Consulting',
    'Market Research',
    'Data Analysis',
    'Data Science',
    'Machine Learning',
    'Translation',
    'Voice Over',
    'Music Production',
    'Photography',
    'Virtual Assistant',
    'Customer Support'
  ];

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch('/api/users/skill-exchange');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();

      // Use server-provided data as source of truth
      const normalized = data.map((user: any) => ({
        id: user.id || user._id,
        _id: user._id || user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        avatar: user.avatar || user.image || user.name?.charAt(0).toUpperCase() || '?',
        bio: user.bio,
        skills: Array.isArray(user.skills) ? user.skills : [],
        learning: Array.isArray(user.learning) ? user.learning : [],
        rating: typeof user.rating === 'number' ? user.rating : 0,
        completedProjects: typeof user.completedProjects === 'number' ? user.completedProjects : 0,
        connections: typeof user.connections === 'number' ? user.connections : 0,
        online: Boolean(user.online),
        friendStatus: user.friendStatus || 'none',
        hasSwapProposal: Boolean(user.hasSwapProposal)
      }));

      setUsers(normalized);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchUsers();
      // Fetch current user's skills for swap proposals
      fetch('/api/users/skills')
        .then(res => res.json())
        .then(data => {
          setCurrentUserSkills(data.skills || []);
        })
        .catch(err => console.error('Error fetching user skills:', err));
    } else {
      setLoading(false);
    }
  }, [session, fetchUsers]);

  // Realtime: poll users list periodically
  useEffect(() => {
    if (!session?.user) return;
    const intervalId = setInterval(() => {
      fetchUsers();
    }, 10000); // 10s
    return () => clearInterval(intervalId);
  }, [session, fetchUsers]);

  // Heartbeat: update lastSeen for online presence
  useEffect(() => {
    if (!session?.user) return;
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/users/ping', { method: 'POST' });
      } catch (e) {
        // ignore
      }
    };
    sendHeartbeat();
    const hb = setInterval(sendHeartbeat, 30000); // 30s
    return () => clearInterval(hb);
  }, [session]);

  // Memoized fetchMessages function
  const fetchMessages = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/messages/${userId}`);
      if (response.ok) {
        const data = await response.json();
        
        const transformedMessages: Message[] = data.messages?.map((msg: ApiMessage) => ({
          id: msg._id,
          sender: msg.senderId.email === session?.user?.email ? 'me' as const : 'them' as const,
          text: msg.message,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })) || [];

        const currentCount = transformedMessages.length;
        const lastCount = lastMessageCountRef.current[userId] || 0;

        if (currentCount !== lastCount) {
          setMessages(prev => ({ ...prev, [userId]: transformedMessages }));
          lastMessageCountRef.current[userId] = currentCount;
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [session]);

  // Chat polling
  useEffect(() => {
    if (chatOpen && selectedUser) {
      const userId = selectedUser.id || selectedUser._id;
      if (!userId) return;

      fetchMessages(userId);

      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(userId);
      }, 2000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [chatOpen, selectedUser, fetchMessages]);

  // Auto scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUser]);

  const sendWorkRequest = async (userId: string) => {
    if (sendingRequest[userId]) return;

    setSendingRequest(prev => ({ ...prev, [userId]: true }));

    try {
      const response = await fetch('/api/friends/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send work request');
      }

      const data = await response.json();
      
      if (data.success) {
        setUsers(prev => prev.map(u => 
          (u.id === userId || u._id === userId) 
            ? { ...u, friendStatus: 'sent' as const }
            : u
        ));
        alert('✅ Work collaboration request sent successfully!');
      }
    } catch (error: any) {
      console.error('Error sending work request:', error);
      alert('❌ ' + error.message);
    } finally {
      setSendingRequest(prev => ({ ...prev, [userId]: false }));
    }
  };

  const openSwapModal = (user: User) => {
    setSwapTargetUser(user);
    setSelectedSkillOffered('');
    setSelectedSkillRequested('');
    setProposalMessage('');
    setSwapModalOpen(true);
  };

  const handleProposeSwap = async () => {
    if (!swapTargetUser || !selectedSkillOffered || !selectedSkillRequested) {
      alert('Please select both skills for the swap');
      return;
    }

    setProposingSwap(true);

    try {
      const response = await fetch('/api/matches/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchedUserId: swapTargetUser.id || swapTargetUser._id,
          skillOffered: selectedSkillOffered,
          skillRequested: selectedSkillRequested,
          message: proposalMessage || `Hi! I'd like to swap services with you.`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send swap proposal');
      }

      const data = await response.json();
      
      if (data.message) {
        alert('✅ Swap proposal sent successfully!');
        setSwapModalOpen(false);
        setSwapTargetUser(null);
        setSelectedSkillOffered('');
        setSelectedSkillRequested('');
        setProposalMessage('');
        // Refresh users list to update button status
        await fetchUsers();
      }
    } catch (error: any) {
      console.error('Error proposing swap:', error);
      alert('❌ ' + error.message);
    } finally {
      setProposingSwap(false);
    }
  };

  const openChat = async (user: User) => {
    setSelectedUser(user);
    setChatOpen(true);
    
    const userId = user.id || user._id;
    if (!userId) return;
    
    if (!messages[userId]) {
      await fetchMessages(userId);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() && selectedUser && !sendingMessage) {
      const messageText = newMessage.trim();
      const tempId = Date.now();
      const userId = selectedUser.id || selectedUser._id;
      
      if (!userId) {
        alert('Error: User ID not found');
        return;
      }
      
      const newMsg: Message = {
        id: tempId.toString(),
        sender: 'me',
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => ({
        ...prev,
        [userId]: [...(Array.isArray(prev[userId]) ? prev[userId] : []), newMsg]
      }));
      
      setNewMessage('');
      setSendingMessage(true);
      
      try {
        const receiverId = selectedUser._id || selectedUser.id;
        
        if (!receiverId) {
          throw new Error('Receiver ID not found');
        }
        
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: receiverId,
            message: messageText
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();
        
        if (data.success && data.message) {
          setMessages(prev => {
            const userMessages = Array.isArray(prev[userId]) ? prev[userId] : [];
            const withoutTemp = userMessages.filter(m => m.id !== tempId.toString());
            return {
              ...prev,
              [userId]: [...withoutTemp, {
                id: data.message._id,
                sender: 'me' as const,
                text: data.message.message,
                time: new Date(data.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]
            };
          });

          lastMessageCountRef.current[userId] = (lastMessageCountRef.current[userId] || 0) + 1;
          setTimeout(() => fetchMessages(userId), 500);
        }
      } catch (error: any) {
        console.error('Error sending message:', error);
        setMessages(prev => ({
          ...prev,
          [userId]: (Array.isArray(prev[userId]) ? prev[userId] : []).filter(m => m.id !== tempId.toString())
        }));
        alert('Failed to send message: ' + error.message);
      } finally {
        setSendingMessage(false);
      }
    }
  };

  // Filter users
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(user.skills) && user.skills.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (Array.isArray(user.learning) && user.learning.some((l: string) => l.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesService = selectedService === 'all' || 
      (Array.isArray(user.skills) && user.skills.includes(selectedService)) || 
      (Array.isArray(user.learning) && user.learning.includes(selectedService));
    
    return matchesSearch && matchesService;
  });

  // Loading State
    if (loading) {
      return (
        <div className="min-h-screen  flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Loading friends...</h2>
            <p className="text-gray-400">Please wait</p>
          </div>
        </div>
      );
    }

  // Not Signed In
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="text-center bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 max-w-md">
          <FontAwesomeIcon icon={faBriefcase} className="text-6xl text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in</h2>
          <p className="text-gray-400 mb-6">You need to be logged in to access the work exchange platform</p>
          <button
            onClick={() => router.push('/signin')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const currentMessages = selectedUser 
    ? (Array.isArray(messages[selectedUser.id || selectedUser._id || '']) ? messages[selectedUser.id || selectedUser._id || ''] : [])
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
              <p className="text-sm">⚠️ {error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-3">
            <FontAwesomeIcon icon={faBriefcase} className="text-5xl text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-800">
              Work Exchange Platform
            </h1>
          </div>
          <p className="text-lg text-gray-300 mb-2">Trade your services for services you need - No money required!</p>
          <p className="text-sm text-gray-400">💼 Work for Work • 🤝 Collaborate • 🎯 Achieve Together</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-700">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faSearch} />
                Search by Service or Name
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g., Web Development, Logo Design, Content Writing..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-lg bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'provider' : 'providers'} found
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                <label className="text-sm font-semibold text-gray-300">Filter by Service:</label>
              </div>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                {services.map(service => (
                  <option key={service} value={service}>
                    {service === 'all' ? '🌟 All Services' : service}
                  </option>
                ))}
              </select>
              {selectedService !== 'all' && (
                <button
                  onClick={() => setSelectedService('all')}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user: User) => (
              <div key={user.id} className="bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border border-gray-700 hover:border-gray-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.image ? (
                        <img 
                          src={user.image} 
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-blue-500"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-2 ring-blue-500">
                          {user.avatar}
                        </div>
                      )}
                      {user.online && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-3 border-gray-800"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{user.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                          <span className="font-semibold">{user.rating?.toFixed(1) || '4.8'}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                          <span>{user.completedProjects || 0} works</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{user.bio}</p>

                {/* Services Offered */}
                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
                    <FontAwesomeIcon icon={faBriefcase} className="text-blue-500" />
                    Services Offered:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.skills && Array.isArray(user.skills) && user.skills.length > 0 ? (
                      <>
                        {user.skills.slice(0, 3).map((skill: string) => (
                          <span key={skill} className="px-2.5 py-1 bg-blue-900/50 text-blue-300 text-xs rounded-full font-medium border border-blue-700">
                            {skill}
                          </span>
                        ))}
                        {user.skills.length > 3 && (
                          <span className="px-2.5 py-1 bg-gray-700 text-gray-300 text-xs rounded-full font-medium">
                            +{user.skills.length - 3} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">No services listed</span>
                    )}
                  </div>
                </div>

                {/* Services Needed */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
                    <FontAwesomeIcon icon={faLightbulb} className="text-orange-500" />
                    Looking for:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.learning && Array.isArray(user.learning) && user.learning.length > 0 ? (
                      <>
                        {user.learning.slice(0, 3).map((skill: string) => (
                          <span key={skill} className="px-2.5 py-1 bg-orange-900/50 text-orange-300 text-xs rounded-full font-medium border border-orange-700">
                            {skill}
                          </span>
                        ))}
                        {user.learning.length > 3 && (
                          <span className="px-2.5 py-1 bg-gray-700 text-gray-300 text-xs rounded-full font-medium">
                            +{user.learning.length - 3} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">Not specified</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openChat(user)}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <FontAwesomeIcon icon={faMessage} />
                      Chat
                    </button>
                    
                    {user.friendStatus === 'accepted' ? (
                      <button
                        disabled
                        className="px-4 py-3 bg-green-900/50 text-green-400 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-green-700"
                        title="Already collaborating"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    ) : user.friendStatus === 'sent' ? (
                      <button
                        disabled
                        className="px-4 py-3 bg-orange-900/50 text-orange-400 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-orange-700"
                        title="Work request sent"
                      >
                        <FontAwesomeIcon icon={faClock} />
                      </button>
                    ) : user.friendStatus === 'pending' ? (
                      <button
                        disabled
                        className="px-4 py-3 bg-yellow-900/50 text-yellow-400 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-yellow-700"
                        title="This user wants to collaborate with you"
                      >
                        <FontAwesomeIcon icon={faBell} className="animate-pulse" />
                      </button>
                    ) : (
                      <button
                        onClick={() => sendWorkRequest(user.id || user._id || '')}
                        disabled={sendingRequest[user.id || user._id || '']}
                        className="px-4 py-3 bg-gradient-to-r bg-blue-600 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send collaboration request"
                      >
                        {sendingRequest[user.id || user._id || ''] ? (
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        ) : (
                          <FontAwesomeIcon icon={faUserPlus} />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {user.hasSwapProposal ? (
                    <button
                      disabled
                      className="w-full py-3 bg-yellow-900/50 text-yellow-400 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-yellow-700 shadow-md"
                      title="Swap proposal already pending"
                    >
                      <FontAwesomeIcon icon={faClock} />
                      Pending Swap
                    </button>
                  ) : (
                    <button
                      onClick={() => openSwapModal(user)}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <FontAwesomeIcon icon={faHandshake} />
                      Propose Swap
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <FontAwesomeIcon icon={faUsers} className="text-6xl text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No service providers found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedService('all');
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {chatOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col border border-gray-700">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {selectedUser.image ? (
                    <img 
                      src={selectedUser.image} 
                      alt={selectedUser.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-blue-500">
                      {selectedUser.avatar}
                    </div>
                  )}
                  {selectedUser.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    {selectedUser.online ? '🟢 Online' : '⚫ Offline'}
                    <span className="text-gray-500">• Discuss work collaboration</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setChatOpen(false);
                  if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                  }
                }}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
              {currentMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                  <FontAwesomeIcon icon={faMessage} className="text-5xl mb-3 opacity-30" />
                  <p className="font-semibold text-lg text-gray-300">No messages yet</p>
                  <p className="text-sm">Start discussing your work exchange opportunity!</p>
                  <div className="mt-6 p-4 bg-gray-800 rounded-lg text-left max-w-md mx-auto border border-gray-700">
                    <p className="text-xs text-blue-400 font-semibold mb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faLightbulb} />
                      Tips for collaboration:
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Clearly describe what work you need</li>
                      <li>• Explain what service you can offer in return</li>
                      <li>• Discuss timelines and expectations</li>
                      <li>• Be respectful and professional</li>
                    </ul>
                  </div>
                </div>
              ) : (
                currentMessages.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs ${msg.sender === 'me' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-800 text-white shadow-lg border border-gray-700'} rounded-2xl px-4 py-3`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your message about work collaboration..."
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Real-time messaging • Updates every 2 seconds
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Swap Proposal Modal */}
      {swapModalOpen && swapTargetUser && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faHandshake} className="text-green-500" />
                Propose Swap
              </h2>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Swapping with:</p>
                <p className="text-white font-semibold">{swapTargetUser.name}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  I will offer (my skill):
                </label>
                <select
                  value={selectedSkillOffered}
                  onChange={(e) => setSelectedSkillOffered(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a skill you can offer</option>
                  {currentUserSkills.map((skill) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
                {currentUserSkills.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">Add skills in your profile first</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  I need (their skill):
                </label>
                <select
                  value={selectedSkillRequested}
                  onChange={(e) => setSelectedSkillRequested(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a skill they can offer</option>
                  {swapTargetUser.skills && swapTargetUser.skills.length > 0 ? (
                    swapTargetUser.skills.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))
                  ) : (
                    <option value="" disabled>This user hasn't listed any skills</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Message (optional):
                </label>
                <textarea
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSwapModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProposeSwap}
                  disabled={!selectedSkillOffered || !selectedSkillRequested || proposingSwap}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {proposingSwap ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faHandshake} />
                      Send Proposal
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}