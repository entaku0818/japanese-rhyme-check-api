"use client";

import React, { useState } from 'react';
import { User, Settings } from 'lucide-react';
import { useAuth } from './components/AuthProvider';
import RhymeChecker from './components/RhymeChecker';
import { RhymeHistory } from './components/RhymeHistory';

export default function Home() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="grid grid-rows-[auto_1fr_20px] min-h-screen p-4 pb-20 gap-8 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      {/* Header with Profile */}
      <header className="flex justify-end w-full px-4 sm:px-6">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <span className="hidden sm:block text-sm font-medium">
              {user?.displayName || 'ゲスト'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl border z-50">
              {user ? (
                <>
                  <button
                    onClick={() => {}}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>プロフィール設定</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {}}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  ログイン
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 space-y-8">
        <RhymeChecker />
        <RhymeHistory />
      </main>

      {/* Footer */}
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}