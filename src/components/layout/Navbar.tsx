'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import JoinGroupModal from '@/components/modals/JoinGroupModal';
import { getGroupByAccessCode } from '@/utils/firebase';
import Logo from '@/components/icons/Logo';

const phrases = [
  'HISAAB',  // Hindi/Urdu - Account
  'BILAN',   // French - Balance
  'KONTO',   // German - Account
  'TANTI',   // Italian - Many
  'BUNNA',   // Ethiopian - Coffee/Share
  'PAGO',    // Spanish - Payment
  'RAZDEL',  // Russian - Division
  'BOKA',    // Swedish - Book/Account
  'HAFR',    // Arabic - Share
  'DELIT',   // French - Split
  'BAIRN',   // Scottish - Share
  'KIREI',   // Japanese - Fair/Clean
  'SAMA',    // Indonesian - Same/Equal
  'TOKA',    // Finnish - Share
  'VAHA',    // Estonian - Exchange
  'CHIA',    // Italian - Split
  'RAZEM',   // Polish - Together
  'TALA',    // Filipino - Count/Calculate
  'DIVVY',   // English - Share
  'SLICE'    // English - Split
];

const TypewriterText = () => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100); // Faster initial typing speed

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < currentPhrase.length) {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
          setTypingSpeed(100); // Faster typing
        } else {
          // Wait before starting to delete
          setTypingSpeed(1500); // Shorter pause at full word
          setIsDeleting(true);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
          setTypingSpeed(50); // Faster deleting
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
          setTypingSpeed(100);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayText, currentPhraseIndex, isDeleting]);

  return (
    <span className="text-xl font-bold text-gray-900 font-mono tracking-wide">
      {displayText}
      <span className="animate-blink">|</span>
    </span>
  );
};

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isGroupPage = pathname?.startsWith('/groups/') && pathname !== '/groups/new';
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleAddExpense = () => {
    // Dispatch custom event that the group page will listen to
    window.dispatchEvent(new Event('openAddExpense'));
    setIsMobileMenuOpen(false);
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
    <>
      <nav className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-sm z-50 h-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Logo className="w-8 h-8" />
              <TypewriterText />
            </Link>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
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
                onClick={() => router.push('/new-group')}
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Toggle menu"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div className={`
        fixed top-16 right-0 bottom-0 w-64 bg-white z-40 transform transition-transform duration-300 ease-in-out md:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-4 space-y-4">
          {/* Join Group Button */}
          <button
            onClick={() => {
              setIsJoinModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-3 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Join Group
          </button>

          {/* Add Expense Button - Only show on group pages */}
          {isGroupPage && (
            <button
              onClick={handleAddExpense}
              className="w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-3 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Expense
            </button>
          )}
          
          {/* New Group Button */}
          <button
            onClick={() => {
              router.push('/new-group');
              setIsMobileMenuOpen(false);
            }}
            className="w-full px-4 py-3 text-sm font-medium text-gray-900 transition-colors flex items-center gap-3 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Group
          </button>
        </div>
      </div>

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinGroup}
      />
    </>
  );
};

export default Navbar; 