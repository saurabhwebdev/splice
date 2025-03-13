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

// Typewriter component for the brand name
const TypewriterText = () => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentPhrase = phrases[currentPhraseIndex];
      
      if (!isDeleting) {
        // Typing
        setCurrentText(currentPhrase.substring(0, currentText.length + 1));
        setTypingSpeed(150);
        
        if (currentText === currentPhrase) {
          // Pause at the end of typing
          setTypingSpeed(2000);
          setIsDeleting(true);
        }
      } else {
        // Deleting
        setCurrentText(currentPhrase.substring(0, currentText.length - 1));
        setTypingSpeed(100);
        
        if (currentText === '') {
          setIsDeleting(false);
          setCurrentPhraseIndex((currentPhraseIndex + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, currentPhraseIndex, isDeleting, typingSpeed]);

  return (
    <span className="font-mono text-sm font-medium tracking-wider text-indigo-500">
      {currentText}<span className="animate-blink">|</span>
    </span>
  );
};

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isGroupPage = pathname?.startsWith('/groups/') && pathname !== '/groups/new';
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  // Add scroll effect to navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <nav 
        className={`fixed top-0 inset-x-0 z-50 h-16 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/90 backdrop-blur-md shadow-sm' 
            : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Logo className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 leading-none">Hisaab</span>
                <TypewriterText />
              </div>
            </Link>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Navigation Links */}
              <div className="mr-4 flex items-center space-x-1">
                <Link 
                  href="/" 
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === '/' 
                      ? 'text-indigo-600 bg-indigo-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Home
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Join Group Button */}
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-full hover:border-gray-300 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join
                </button>

                {/* Add Expense Button - Only show on group pages */}
                {isGroupPage && (
                  <button
                    onClick={handleAddExpense}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center gap-2"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Group
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100 relative"
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6">
                <span className={`absolute left-0 block w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen 
                    ? 'rotate-45 translate-y-2.5' 
                    : 'translate-y-1 animate-nudge'
                }`} />
                <span className={`absolute left-0 block w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen 
                    ? 'opacity-0' 
                    : 'translate-y-3'
                }`} />
                <span className={`absolute left-0 block w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen 
                    ? '-rotate-45 translate-y-2.5' 
                    : 'translate-y-5 animate-nudge delay-100'
                }`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div className={`
        fixed top-16 right-0 bottom-0 w-72 bg-white z-40 transform transition-all duration-300 ease-in-out md:hidden shadow-xl
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-5 space-y-5">
          {/* Navigation Links */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h3>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                pathname === '/' 
                  ? 'text-indigo-600 bg-indigo-50 scale-[1.02]' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:scale-[0.98]'
              }`}
            >
              Home
            </Link>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</h3>
            
            {/* Join Group Button */}
            <button
              onClick={() => {
                setIsJoinModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 flex items-center gap-3 rounded-lg hover:bg-gray-50 border border-gray-200 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Join Existing Group
            </button>

            {/* Add Expense Button - Only show on group pages */}
            {isGroupPage && (
              <button
                onClick={handleAddExpense}
                className="w-full px-4 py-3 text-sm font-medium text-indigo-600 transition-all duration-200 flex items-center gap-3 rounded-lg hover:bg-indigo-50 border border-indigo-200 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add New Expense
              </button>
            )}
            
            {/* New Group Button */}
            <button
              onClick={() => {
                router.push('/new-group');
                setIsMobileMenuOpen(false);
              }}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 flex items-center gap-3 rounded-lg shadow-sm active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create New Group
            </button>
          </div>

          {/* Footer */}
          <div className="pt-5 mt-5 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Logo className="w-5 h-5" />
                <span className="text-sm font-medium text-gray-700">Hisaab</span>
              </div>
              <span className="text-xs text-gray-500">Split expenses easily</span>
            </div>
          </div>
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