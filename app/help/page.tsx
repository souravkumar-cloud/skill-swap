'use client';

import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion, faBook, faEnvelope, faComments } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function HelpPage() {
  const { data: session } = useSession();

  const faqItems = [
    {
      question: 'How do I propose a skill swap?',
      answer: 'Navigate to the Skill Exchange page, find a user with compatible skills, and click "Propose Swap". You can then select which skills you want to offer and which you want to learn.',
    },
    {
      question: 'How do I accept or reject a swap proposal?',
      answer: 'Go to your Active Swap page or check your notifications. You can accept or reject proposals from there. Accepted swaps will appear in your Active Swap list.',
    },
    {
      question: 'How do I complete a swap?',
      answer: 'Once both parties have completed teaching and learning, go to the Active Swap page and click "Mark as Done". You\'ll be asked to rate your experience before the swap is marked as complete.',
    },
    {
      question: 'How do I send messages to other users?',
      answer: 'You can send messages through the Chat page. Click on a conversation to start chatting, or find a user on the Skill Exchange or Friends page and click the chat button.',
    },
    {
      question: 'How do I add friends?',
      answer: 'Visit the Skill Exchange or Friends page, find a user you want to connect with, and click "Send Friend Request". Once they accept, you\'ll be connected.',
    },
    {
      question: 'How are ratings calculated?',
      answer: 'After completing a swap, both users rate each other. Your overall rating is the average of all ratings you\'ve received from completed swaps.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faCircleQuestion} className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Help & Support</h1>
              <p className="text-gray-400">Get help with using Skill Swap</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Link 
                href="/chat" 
                className="bg-gray-700/50 hover:bg-gray-700 rounded-lg p-6 border border-gray-600 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FontAwesomeIcon icon={faComments} className="text-2xl text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Live Chat</h3>
                </div>
                <p className="text-gray-400 text-sm">Chat with other users for support</p>
              </Link>

              <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                <div className="flex items-center gap-3 mb-2">
                  <FontAwesomeIcon icon={faEnvelope} className="text-2xl text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Contact Support</h3>
                </div>
                <p className="text-gray-400 text-sm">Email us at support@skillswap.com</p>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center gap-3 mb-6">
                <FontAwesomeIcon icon={faBook} className="text-xl text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Frequently Asked Questions</h2>
              </div>
              
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-lg font-semibold text-white mb-2">{item.question}</h3>
                    <p className="text-gray-400 text-sm">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Getting Started */}
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <h2 className="text-xl font-semibold text-white mb-4">Getting Started</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Complete Your Profile</h4>
                    <p className="text-gray-400 text-sm">Add your skills and what you want to learn on your profile page.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Find Skill Matches</h4>
                    <p className="text-gray-400 text-sm">Browse the Skill Exchange page to find users with compatible skills.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Propose a Swap</h4>
                    <p className="text-gray-400 text-sm">Click "Propose Swap" and select the skills you want to exchange.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Start Learning & Teaching</h4>
                    <p className="text-gray-400 text-sm">Once accepted, communicate with your partner and start your skill exchange!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Resources */}
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <h2 className="text-xl font-semibold text-white mb-4">Additional Resources</h2>
              <div className="space-y-2">
                <Link href="/dashboard" className="block text-blue-400 hover:text-blue-300 transition-colors">
                  → Go to Dashboard
                </Link>
                <Link href="/skill-exchange" className="block text-blue-400 hover:text-blue-300 transition-colors">
                  → Browse Skill Exchange
                </Link>
                <Link href="/profile" className="block text-blue-400 hover:text-blue-300 transition-colors">
                  → Edit Your Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

