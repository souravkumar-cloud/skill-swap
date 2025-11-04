'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle, X, Send, Loader2, ArrowLeft, Users, Phone, Video, MoreVertical } from 'lucide-react';

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

interface Friend {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  online?: boolean;
}

export default function ChatRoomPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendId = searchParams.get('friendId');
  
  const [friend, setFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  // Fetch friend details
  useEffect(() => {
    const fetchFriendDetails = async () => {
      if (!friendId) return;

      try {
        const response = await fetch(`/api/users/${friendId}`);
        if (response.ok) {
          const data = await response.json();
          setFriend(data.user);
        }
      } catch (error) {
        console.error('Error fetching friend details:', error);
      }
    };

    fetchFriendDetails();
  }, [friendId]);

  // Fetch messages - memoized to prevent infinite loops
  const fetchMessages = useCallback(async () => {
    if (!friendId) return;

    try {
      const response = await fetch(`/api/messages/${friendId}`);
      if (response.ok) {
        const data = await response.json();
        
        const transformedMessages: Message[] = data.messages?.map((msg: ApiMessage) => ({
          id: msg._id,
          sender: msg.senderId.email === session?.user?.email ? 'me' as const : 'them' as const,
          text: msg.message,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })) || [];

        const currentCount = transformedMessages.length;
        const lastCount = lastMessageCountRef.current;

        if (currentCount !== lastCount) {
          setMessages(transformedMessages);
          lastMessageCountRef.current = currentCount;
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [friendId, session]);

  // Initial fetch and polling
  useEffect(() => {
    if (!session || !friendId) {
      setLoading(false);
      return;
    }

    fetchMessages();

    // Poll for new messages every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [session, friendId, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() && friend && !sendingMessage) {
      const messageText = newMessage.trim();
      const tempId = Date.now();
      
      const newMsg: Message = {
        id: tempId.toString(),
        sender: 'me',
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setSendingMessage(true);
      
      try {
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: friend._id,
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
            const withoutTemp = prev.filter(m => m.id !== tempId.toString());
            return [...withoutTemp, {
              id: data.message._id,
              sender: 'me' as const,
              text: data.message.message,
              time: new Date(data.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }];
          });

          lastMessageCountRef.current = lastMessageCountRef.current + 1;
          setTimeout(() => fetchMessages(), 500);
        }
      } catch (error: any) {
        console.error('Error sending message:', error);
        setMessages(prev => prev.filter(m => m.id !== tempId.toString()));
        alert('Failed to send message: ' + error.message);
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <p className="text-gray-600">You need to be logged in to access the chat</p>
        </div>
      </div>
    );
  }

  if (!friendId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No chat selected</h2>
          <p className="text-gray-600 mb-6">Please select a friend to start chatting</p>
          <button
            onClick={() => router.push('/friends')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Friends
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading chat...</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto h-screen flex flex-col">
        {/* Chat Header */}
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/friends')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Back to friends"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    {friend?.avatar && friend.avatar.startsWith('http') ? (
                      <img 
                        src={friend.avatar} 
                        alt={friend.name}
                        className="w-12 h-12 rounded-full object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {friend?.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {friend?.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{friend?.name}</h2>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      {friend?.online ? (
                        <>
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Online
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          Offline
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button className="p-3 hover:bg-gray-100 rounded-full transition-colors" title="Voice call">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-3 hover:bg-gray-100 rounded-full transition-colors" title="Video call">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-3 hover:bg-gray-100 rounded-full transition-colors" title="More options">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Friend Bio */}
            {friend?.bio && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 italic">"{friend.bio}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-gray-50 to-blue-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
              <p>Start the conversation with {friend?.name}!</p>
            </div>
          ) : (
            <>
              {messages.map((msg: Message, index: number) => {
                return (
                  <React.Fragment key={msg.id}>
                    
                    <div className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md ${msg.sender === 'me' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-md'} rounded-2xl px-4 py-3`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${friend?.name}...`}
              disabled={sendingMessage}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition-colors font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {sendingMessage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-xs text-gray-500">Real-time updates • Messages refresh every 2 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}