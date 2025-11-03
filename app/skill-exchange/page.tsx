'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Search, MessageCircle, X, Send, Star, Filter, Users, Briefcase, TrendingUp, Loader2, UserPlus, Check, Bell, Clock, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  skills?: string[];
  learning?: string[];
  offeredServices?: string[];
  neededServices?: string[];
  rating?: number;
  completedWorks?: number;
  connections?: number;
  online?: boolean;
  friendStatus?: 'none' | 'pending' | 'accepted' | 'sent';
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

export default function WorkExchangePage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<Record<string, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<Record<string, number>>({});

  const services = [
    'all',
    // Development
    'Web Development',
    'Mobile App Development',
    'Backend Development',
    'Frontend Development',
    'Full Stack Development',
    'API Development',
    'Database Design',
    'WordPress Development',
    'E-commerce Development',
    // Design
    'UI/UX Design',
    'Graphic Design',
    'Logo Design',
    'Brand Identity',
    'Illustration',
    'Video Editing',
    'Animation',
    '3D Modeling',
    // Marketing & Business
    'Digital Marketing',
    'SEO Services',
    'Content Writing',
    'Copywriting',
    'Social Media Management',
    'Email Marketing',
    'Business Consulting',
    'Market Research',
    // Data & Analytics
    'Data Analysis',
    'Data Science',
    'Machine Learning',
    'Excel/Spreadsheet Work',
    'Statistical Analysis',
    // Other Services
    'Translation',
    'Voice Over',
    'Music Production',
    'Photography',
    'Virtual Assistant',
    'Customer Support',
    'Transcription',
    'Resume Writing',
    'Legal Consulting',
    'Accounting',
    'Tutoring',
    'Proofreading'
  ];

  

  useEffect(() => {
    const fetchUsers = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/users/skill-exchange');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        
        // Transform skill-based data to service-based data
        const transformedUsers = data.map((user: any) => ({
          ...user,
          offeredServices: user.skills || [],
          neededServices: user.learning || [],
          completedWorks: user.connections || Math.floor(Math.random() * 50)
        }));
        
        setUsers(transformedUsers);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [session]);

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
  }, [chatOpen, selectedUser, session]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUser]);

  const fetchMessages = async (userId: string) => {
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
  };

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
        alert('Work collaboration request sent successfully!');
      }
    } catch (error: any) {
      console.error('Error sending work request:', error);
      alert('Failed to send work request: ' + error.message);
    } finally {
      setSendingRequest(prev => ({ ...prev, [userId]: false }));
    }
  };

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(user.offeredServices) && user.offeredServices.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (Array.isArray(user.neededServices) && user.neededServices.some((l: string) => l.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesService = selectedService === 'all' || 
      (Array.isArray(user.offeredServices) && user.offeredServices.includes(selectedService)) || 
      (Array.isArray(user.neededServices) && user.neededServices.includes(selectedService));
    
    return matchesSearch && matchesService;
  });

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

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <Briefcase className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <p className="text-gray-600">You need to be logged in to access the work exchange platform</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading service providers...</h2>
          <p className="text-gray-600">Please wait while we fetch the community</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Users</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentMessages = selectedUser 
    ? (Array.isArray(messages[selectedUser.id || selectedUser._id || '']) ? messages[selectedUser.id || selectedUser._id || ''] : [])
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Briefcase className="w-12 h-12 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Work Exchange Platform
            </h1>
          </div>
          <p className="text-lg text-gray-600">Trade your services for services you need - No money required!</p>
          <p className="text-sm text-gray-500 mt-1">💼 Work for Work • 🤝 Collaborate • 🎯 Achieve Together</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-indigo-100">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                <Search className="w-4 h-4" />
                Search by Service or Name
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="e.g., Web Development, Logo Design, Content Writing..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 text-black rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'service provider' : 'service providers'} found
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="text-gray-600 w-5 h-5" />
                <label className="text-sm font-semibold text-gray-700">Filter by Service:</label>
              </div>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-700 font-medium"
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
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {(searchTerm || selectedService !== 'all') && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-2">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedService !== 'all' && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-2">
                    Service: {selectedService}
                    <button onClick={() => setSelectedService('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Service Providers</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <Users className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Available Services</p>
                <p className="text-3xl font-bold">{services.length - 1}</p>
              </div>
              <Briefcase className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Online Now</p>
                <p className="text-3xl font-bold">{users.filter(u => u.online).length}</p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Works Completed</p>
                <p className="text-3xl font-bold">{users.reduce((acc, u) => acc + (u.completedWorks || 0), 0)}</p>
              </div>
              <CheckCircle className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user: User) => (
              <div key={user.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-2 border-gray-100 hover:border-indigo-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatar.startsWith('http') ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-indigo-100"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-indigo-100">
                          {user.avatar}
                        </div>
                      )}
                      {user.online && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-md"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{user.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{user.rating || '4.8'}</span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{user.completedWorks || 0} works</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{user.bio}</p>

                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <span className="text-indigo-600">💼</span> Services Offered:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.offeredServices && Array.isArray(user.offeredServices) && user.offeredServices.length > 0 ? (
                      <>
                        {user.offeredServices.slice(0, 3).map((service: string) => (
                          <span key={service} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium border border-indigo-200">
                            {service}
                          </span>
                        ))}
                        {user.offeredServices.length > 3 && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                            +{user.offeredServices.length - 3} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No services listed</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <span className="text-orange-600">🔍</span> Looking for:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.neededServices && Array.isArray(user.neededServices) && user.neededServices.length > 0 ? (
                      <>
                        {user.neededServices.slice(0, 3).map((service: string) => (
                          <span key={service} className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs rounded-full font-medium border border-orange-200">
                            {service}
                          </span>
                        ))}
                        {user.neededServices.length > 3 && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                            +{user.neededServices.length - 3} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">Not specified</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openChat(user)}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Discuss Work
                  </button>
                  
                  {user.friendStatus === 'accepted' ? (
                    <button
                      disabled
                      className="px-4 py-3 bg-green-100 text-green-700 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                      title="Already collaborating"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  ) : user.friendStatus === 'sent' ? (
                    <button
                      disabled
                      className="px-4 py-3 bg-orange-100 text-orange-700 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-orange-200"
                      title="Work request sent"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                  ) : user.friendStatus === 'pending' ? (
                    <button
                      disabled
                      className="px-4 py-3 bg-yellow-100 text-yellow-700 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-yellow-200"
                      title="This user wants to collaborate with you"
                    >
                      <Bell className="w-5 h-5 animate-pulse" />
                    </button>
                  ) : (
                    <button
                      onClick={() => sendWorkRequest(user.id || user._id || '')}
                      disabled={sendingRequest[user.id || user._id || '']}
                      className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send collaboration request"
                    >
                      {sendingRequest[user.id || user._id || ''] ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserPlus className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No service providers found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedService('all');
              }}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {chatOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {selectedUser.avatar.startsWith('http') ? (
                    <img 
                      src={selectedUser.avatar} 
                      alt={selectedUser.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-indigo-200">
                      {selectedUser.avatar}
                    </div>
                  )}
                  {selectedUser.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    {selectedUser.online ? '🟢 Online' : '⚫ Offline'}
                    <span className="text-gray-400">• Discuss work collaboration</span>
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
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {currentMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold">No messages yet</p>
                  <p className="text-sm">Start discussing your work exchange opportunity!</p>
                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg text-left max-w-md mx-auto">
                    <p className="text-xs text-indigo-900 font-semibold mb-2">💡 Tips for collaboration:</p>
                    <ul className="text-xs text-indigo-700 space-y-1">
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
                    <div className={`max-w-xs ${msg.sender === 'me' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-white text-gray-900 shadow-md border border-gray-200'} rounded-2xl px-4 py-3`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-indigo-100' : 'text-gray-500'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your message about work collaboration..."
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl flex items-center gap-2 transition-colors font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Real-time messaging • Updates every 2 seconds
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}