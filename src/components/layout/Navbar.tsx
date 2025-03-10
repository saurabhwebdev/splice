'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import JoinGroupModal from '@/components/modals/JoinGroupModal';
import { getGroupByAccessCode } from '@/utils/firebase';
import Logo from '@/components/icons/Logo';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isGroupPage = pathname?.startsWith('/groups/') && pathname !== '/groups/new';
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleAddExpense = () => {
    // Dispatch custom event that the group page will listen to
    window.dispatchEvent(new Event('openAddExpense'));
  };

  const handleJoinGroup = async (accessCode: string) => {
    try {
      const group = await getGroupByAccessCode(accessCode);
      if (!group) {
        throw new Error('Group not found. Please check the access code and try again.');
      }

      // Store the group ID in localStorage
      try {
        const accessedGroups = JSON.parse(localStorage.getItem('accessedGroups') || '[]');
        if (!accessedGroups.includes(group.id)) {
          localStorage.setItem('accessedGroups', JSON.stringify([...accessedGroups, group.id]));
        }
      } catch (storageError) {
        console.error('Error updating localStorage:', storageError);
        // Continue even if localStorage fails - it's not critical
      }

      router.push(`/groups/${group.id}`);
    } catch (error: any) {
      console.error('Error joining group:', error);
      throw error;
    }
  };

  return (
    <nav className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-sm z-50 h-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-900">Splice</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Join Group Button */}
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Join Group
            </button>

            {/* Add Expense Button - Only show on group pages */}
            {isGroupPage && (
              <button
                onClick={handleAddExpense}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Expense
              </button>
            )}
            
            {/* New Group Button */}
            <button
              onClick={() => router.push('/groups/new')}
              className={`px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                isGroupPage 
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-white bg-gray-900 rounded-full hover:bg-gray-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Group
            </button>
          </div>
        </div>
      </div>

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinGroup}
      />
    </nav>
  );
};

export default Navbar; 