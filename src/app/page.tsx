'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllGroups } from '@/utils/firebase';
import type { Group } from '@/utils/firebase';
import Image from 'next/image';

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Get accessed group IDs from localStorage
        const accessedGroupIds = JSON.parse(localStorage.getItem('accessedGroups') || '[]');
        
        if (accessedGroupIds.length === 0) {
          setLoading(false);
          return;
        }

        // Only fetch groups that have been accessed
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Left Section - Welcome */}
        <div className="w-full lg:w-1/2 min-h-[60vh] lg:min-h-screen bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/hero-pattern.jpg"
              alt="Background pattern"
              fill
              className="object-cover opacity-20"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="relative h-full flex flex-col justify-center px-8 lg:px-16 py-24 lg:py-0">
            <div className="max-w-xl">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-white mb-6">
                Split expenses with friends
                <span className="block mt-2 text-indigo-400">effortlessly</span>
              </h1>
              <p className="text-lg text-gray-300 leading-relaxed mb-12">
                Create groups, track shared expenses, and settle up with your friends. No more awkward money conversations.
              </p>
              <button
                onClick={() => router.push('/new-group')}
                className="group relative px-8 py-4 text-base font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900"
              >
                Create New Group
                <span className="absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform duration-200">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Groups */}
        <div className="w-full lg:w-1/2 min-h-[40vh] lg:min-h-screen bg-white relative">
          <div className="h-full overflow-auto px-8 lg:px-16 py-16">
            {groups.length > 0 ? (
              <>
                <div className="sticky top-0 bg-white/80 backdrop-blur-sm py-6 z-10">
                  <h2 className="text-2xl font-semibold text-gray-900">Your Groups</h2>
                  <p className="text-gray-500 mt-1">Pick up where you left off</p>
                </div>
                
                <div className="space-y-6 mt-8">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => router.push(`/groups/${group.id}`)}
                      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className="relative h-40">
                        <Image
                          src={group.headerImage || '/default-group-header.jpg'}
                          alt={group.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-xl font-semibold text-white group-hover:translate-x-1 transition-transform duration-200">
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="text-sm text-white/80">
                                {group.participants.length} members
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm text-white/80">
                                {group.currency} {group.totalExpenditure.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="bg-gray-50 rounded-full p-6 mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Groups Yet</h3>
                <p className="text-gray-500 mb-8 max-w-sm">
                  Create your first group or join an existing one using an access code
                </p>
                <button
                  onClick={() => router.push('/new-group')}
                  className="px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Create Your First Group
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
