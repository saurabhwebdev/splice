'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllGroups, getGroupByAccessCode } from '@/utils/firebase';
import type { Group } from '@/utils/firebase';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import JoinGroupModal from '@/components/modals/JoinGroupModal';

const gradientColors = [
  'from-indigo-600 to-blue-700',
  'from-purple-600 to-pink-700',
  'from-green-600 to-teal-700',
  'from-red-600 to-orange-700',
  'from-blue-600 to-cyan-700',
  'from-yellow-600 to-red-700',
  'from-pink-600 to-purple-700',
  'from-teal-600 to-green-700',
  'from-orange-600 to-yellow-700',
  'from-cyan-600 to-blue-700',
  'from-violet-600 to-indigo-700',
  'from-rose-600 to-pink-700',
  'from-emerald-600 to-teal-700',
  'from-fuchsia-600 to-pink-700',
  'from-amber-600 to-orange-700',
  'from-lime-600 to-green-700',
  'from-sky-600 to-blue-700',
  'from-purple-600 to-violet-700',
  'from-rose-600 to-red-700',
  'from-teal-600 to-cyan-700',
  'from-orange-600 to-amber-700',
  'from-indigo-600 to-violet-700'
];

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  // Track mouse position for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const accessedGroupIds = JSON.parse(localStorage.getItem('accessedGroups') || '[]');
        
        if (accessedGroupIds.length === 0) {
          setLoading(false);
          return;
        }

        const fetchedGroups = await getAllGroups();
        const filteredGroups = fetchedGroups.filter(group => 
          accessedGroupIds.includes(group.id)
        );
        
        setGroups(filteredGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleJoinGroup = async (accessCode: string) => {
    try {
      const group = await getGroupByAccessCode(accessCode);
      if (!group) {
        throw new Error('Group not found. Please check the access code and try again.');
      }

      try {
        const accessedGroups = JSON.parse(localStorage.getItem('accessedGroups') || '[]');
        if (!accessedGroups.includes(group.id)) {
          localStorage.setItem('accessedGroups', JSON.stringify([...accessedGroups, group.id]));
        }
      } catch (storageError) {
        console.error('Error updating localStorage:', storageError);
      }

      router.push(`/groups/${group.id}`);
    } catch (error: any) {
      console.error('Error joining group:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-16 h-16 animate-ping rounded-full bg-indigo-400 opacity-75"></div>
          <div className="relative w-16 h-16 animate-spin rounded-full border-4 border-solid border-gray-200 border-t-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div 
            className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-indigo-500/30 to-blue-500/30 blur-3xl"
            style={{
              left: `${mousePosition.x * 10}%`,
              top: `${mousePosition.y * 10}%`,
              transform: 'translate(-50%, -50%)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          <div 
            className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl"
            style={{
              right: `${(1 - mousePosition.x) * 10}%`,
              bottom: `${(1 - mousePosition.y) * 10}%`,
              transform: 'translate(50%, 50%)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        {/* Content */}
        <div className="relative flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                Split expenses with friends
                <span className="block mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  effortlessly
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Create groups, track shared expenses, and settle up with your friends. No more awkward money conversations.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/new-group')}
                  className="relative px-8 py-4 text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Group
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsJoinModalOpen(true)}
                  className="px-8 py-4 text-base font-medium text-indigo-600 bg-white rounded-2xl shadow-lg hover:shadow-xl border-2 border-indigo-100 hover:border-indigo-200 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join Existing Group
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Recent Groups Section */}
          {groups.length > 0 && (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/50 backdrop-blur-lg rounded-3xl border border-gray-100 shadow-lg p-6 sm:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Recent Groups</h2>
                  <span className="text-sm text-gray-500">{groups.length} groups</span>
                </div>

                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {groups.map((group) => (
                    <motion.div
                      key={group.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/groups/${group.id}`)}
                      className="group relative bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className="relative h-32">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-500 opacity-90" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
                        <div className="absolute inset-0 p-4 flex flex-col justify-between">
                          <h3 className="text-lg font-semibold text-white group-hover:translate-x-1 transition-transform duration-200">
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <span className="text-sm text-white/90">
                                {group.participants.length}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-sm text-white/90">
                                {group.currency} {group.totalExpenditure.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Join Group Modal */}
      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinGroup}
      />

      {/* CSS for grid pattern */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </main>
  );
}
