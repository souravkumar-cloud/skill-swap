'use client';

import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faBell, faLock, faPalette, faLanguage } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 rounded-xl shadow-lg p-8 max-w-md border border-gray-700">
          <FontAwesomeIcon icon={faGear} className="text-6xl text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in</h2>
          <p className="text-gray-400">You need to be logged in to access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faGear} className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400">Manage your account preferences</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Notification Settings */}
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <FontAwesomeIcon icon={faBell} className="text-xl text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Notifications</h2>
              </div>
              <p className="text-gray-400 mb-4">Configure how you receive notifications</p>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Email notifications</span>
                  <input type="checkbox" className="w-5 h-5 rounded cursor-pointer" defaultChecked />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Push notifications</span>
                  <input type="checkbox" className="w-5 h-5 rounded cursor-pointer" defaultChecked />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Swap proposals</span>
                  <input type="checkbox" className="w-5 h-5 rounded cursor-pointer" defaultChecked />
                </label>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <FontAwesomeIcon icon={faLock} className="text-xl text-green-400" />
                <h2 className="text-xl font-semibold text-white">Privacy & Security</h2>
              </div>
              <p className="text-gray-400 mb-4">Manage your privacy and security settings</p>
              <div className="space-y-3">
                <Link 
                  href="/profile" 
                  className="block w-full text-left px-4 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors"
                >
                  Change Password
                </Link>
                <button className="block w-full text-left px-4 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors">
                  Two-Factor Authentication
                </button>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <FontAwesomeIcon icon={faPalette} className="text-xl text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Appearance</h2>
              </div>
              <p className="text-gray-400 mb-4">Customize the look and feel</p>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Dark mode</span>
                  <input type="checkbox" className="w-5 h-5 rounded cursor-pointer" defaultChecked />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Compact view</span>
                  <input type="checkbox" className="w-5 h-5 rounded cursor-pointer" />
                </label>
              </div>
            </div>

            {/* Language */}
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <FontAwesomeIcon icon={faLanguage} className="text-xl text-yellow-400" />
                <h2 className="text-xl font-semibold text-white">Language</h2>
              </div>
              <p className="text-gray-400 mb-4">Select your preferred language</p>
              <select className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-600">
              <p className="text-sm text-gray-400 text-center">
                More settings coming soon! For now, you can manage your profile at{' '}
                <Link href="/profile" className="text-blue-400 hover:text-blue-300 underline">
                  your profile page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

