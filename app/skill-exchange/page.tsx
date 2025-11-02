'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Search, MessageCircle, X, Send, Star, Filter, Users, Code2, TrendingUp, Loader2 } from 'lucide-react';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  skills: string[];
  learning: string[];
  rating?: number;
  connections?: number;
  online?: boolean;
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<Record<string, number>>({});

  const skills = [
    'all', 
    'JavaScript', 
    'Python', 
    'React', 
    'Node.js', 
    'TypeScript',
    'Angular',
    'Vue.js',
    'Django',
    'Flask',
    'Ruby on Rails',
    'Java',
    'Spring Boot',
    'C++',
    'C#',
    '.NET',
    'Go',
    'Rust',
    'PHP',
    'Laravel',
    'Swift',
    'Kotlin',
    'Flutter',
    'React Native',
    'UI/UX Design', 
    'Figma',
    'Adobe XD',
    'Data Science',
    'Machine Learning',
    'TensorFlow',
    'PyTorch',
    'SQL',
    'MongoDB',
    'PostgreSQL',
    'Redis',
    'AWS',
    'Azure',
    'Google Cloud',
    'Docker',
    'Kubernetes',
    'DevOps',
    'CI/CD',
    'GraphQL',
    'REST API',
    'Microservices',
    'Blockchain',
    'Solidity',
    'Unity',
    'Unreal Engine',
    'Game Development'
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
        setUsers(data);
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

  // Real-time message polling when chat is open
  useEffect(() => {
    if (chatOpen && selectedUser) {
      const userId = selectedUser.id || selectedUser._id;
      if (!userId) return;

      // Initial fetch
      fetchMessages(userId);

      // Start polling every 2 seconds for real-time updates
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(userId);
      }, 2000);

      // Cleanup on unmount or when chat closes
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

        // Only update if message count changed (prevents unnecessary re-renders)
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

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.skills.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.learning.some((l: string) => l.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSkill = selectedSkill === 'all' || 
      user.skills.includes(selectedSkill) || 
      user.learning.includes(selectedSkill);
    
    return matchesSearch && matchesSkill;
  });

  const openChat = async (user: User) => {
    setSelectedUser(user);
    setChatOpen(true);
    
    const userId = user.id || user._id;
    if (!userId) return;
    
    // Initialize messages array if it doesn't exist
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
      
      // Optimistically update UI
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
        
        // Update with actual message from server
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

          // Update last message count
          lastMessageCountRef.current[userId] = (lastMessageCountRef.current[userId] || 0) + 1;

          // Fetch messages after a short delay to get any new messages
          setTimeout(() => fetchMessages(userId), 500);
        }
      } catch (error: any) {
        console.error('Error sending message:', error);
        // Remove the optimistic message on error
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <p className="text-gray-600">You need to be logged in to view the skill exchange</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading users...</h2>
          <p className="text-gray-600">Please wait while we fetch the community</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Users</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get current user messages safely
  const currentMessages = selectedUser 
    ? (Array.isArray(messages[selectedUser.id || selectedUser._id || '']) ? messages[selectedUser.id || selectedUser._id || ''] : [])
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Code2 className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Skill Exchange</h1>
          </div>
          <p className="text-lg text-gray-600">Connect with developers and exchange your tech expertise</p>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
          <div className="flex flex-col gap-4">
            {/* Large Search Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search by Tech Stack or Name
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="e.g., React, Python, JavaScript, Node.js..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                {filteredUsers.length} {filteredUsers.length === 1 ? 'developer' : 'developers'} found
              </p>
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="text-gray-600 w-5 h-5" />
                <label className="text-sm font-semibold text-gray-700">Filter by Skill:</label>
              </div>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium"
              >
                {skills.map(skill => (
                  <option key={skill} value={skill}>
                    {skill === 'all' ? '🌟 All Skills' : skill}
                  </option>
                ))}
              </select>
              {selectedSkill !== 'all' && (
                <button
                  onClick={() => setSelectedSkill('all')}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedSkill !== 'all') && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSkill !== 'all' && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-2">
                    Skill: {selectedSkill}
                    <button onClick={() => setSelectedSkill('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Developers</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <Users className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Available Skills</p>
                <p className="text-3xl font-bold">{skills.length - 1}</p>
              </div>
              <Code2 className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Online Now</p>
                <p className="text-3xl font-bold">{users.filter(u => u.online).length}</p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user: User) => (
              <div key={user.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatar.startsWith('http') ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
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
                          <span className="font-semibold">{user.rating || '0.0'}</span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{user.connections || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{user.bio}</p>

                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <span className="text-green-600">✓</span> Can teach:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.skills && user.skills.length > 0 ? (
                      <>
                        {user.skills.slice(0, 4).map((skill: string) => (
                          <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-200">
                            {skill}
                          </span>
                        ))}
                        {user.skills.length > 4 && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                            +{user.skills.length - 4} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No skills listed</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <span className="text-orange-600">→</span> Wants to learn:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.learning && user.learning.length > 0 ? (
                      <>
                        {user.learning.slice(0, 3).map((skill: string) => (
                          <span key={skill} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium border border-green-200">
                            {skill}
                          </span>
                        ))}
                        {user.learning.length > 3 && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                            +{user.learning.length - 3} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No learning goals listed</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openChat(user)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  Start Conversation
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No developers found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSkill('all');
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Chat Modal with Real-time Updates */}
      {chatOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {selectedUser.avatar.startsWith('http') ? (
                    <img 
                      src={selectedUser.avatar} 
                      alt={selectedUser.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
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
                    <span className="text-gray-400">• Real-time chat</span>
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {currentMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                currentMessages.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs ${msg.sender === 'me' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-md'} rounded-2xl px-4 py-3`}>
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

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your message..."
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition-colors font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                Real-time updates • Messages refresh every 2 seconds
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}