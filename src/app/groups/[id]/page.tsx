'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getGroup, updateGroup, deleteGroup, addExpense, deleteExpense, updateExpense } from '@/utils/firebase';
import { searchUnsplashImages } from '@/utils/unsplash';
import type { Group, Expense } from '@/utils/firebase';
import type { UnsplashImage } from '@/utils/unsplash';
import ExpenseModal from '@/components/modals/ExpenseModal';
import SettleUpModal from '@/components/modals/SettleUpModal';
import InviteModal from '@/components/modals/InviteModal';
import ExpenseCard from '@/components/ExpenseCard';
import ParticipantsCard from '@/components/ParticipantsCard';
import CollapsibleCard from '@/components/CollapsibleCard';
import { Metadata } from 'next';

interface Participant {
  firstName: string;
  lastName: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const GroupPage = ({ params }: PageProps) => {
  const { id } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSettlingUp, setIsSettlingUp] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expensesPerPage] = useState(5);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [newParticipants, setNewParticipants] = useState<{ firstName: string; lastName: string; }[]>([
    { firstName: '', lastName: '' }
  ]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [showCoverOptions, setShowCoverOptions] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'INR', symbol: '₹' },
  ];

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
    'from-rose-600 to-pink-700'
  ];

  // Calculate pagination
  const indexOfLastExpense = currentPage * expensesPerPage;
  const indexOfFirstExpense = indexOfLastExpense - expensesPerPage;
  const currentExpenses = group?.expenses.slice(indexOfFirstExpense, indexOfLastExpense) || [];
  const totalPages = Math.ceil((group?.expenses.length || 0) / expensesPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    const loadGroup = async () => {
      try {
        // Check if user has access to this group
        const accessedGroups = JSON.parse(localStorage.getItem('accessedGroups') || '[]');
        if (!accessedGroups.includes(id)) {
          router.push('/');
          return;
        }

        const groupData = await getGroup(id);
        if (groupData) {
          setGroup(groupData);
          // Set the color index from the group data, defaulting to 0 if not set
          setCurrentColorIndex(groupData.colorIndex || 0);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading group:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [id, router]);

  // Listen for Add Expense event from navbar
  useEffect(() => {
    const handleAddExpense = () => {
      setEditingExpense(null);
      setIsAddingExpense(true);
    };

    window.addEventListener('openAddExpense', handleAddExpense);
    return () => window.removeEventListener('openAddExpense', handleAddExpense);
  }, []);

  const handleImageSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const images = await searchUnsplashImages(searchQuery);
      setSearchResults(images);
    } catch (error) {
      console.error('Failed to search images:', error);
      setSearchError('Failed to load images. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageSelect = async (image: UnsplashImage) => {
    if (!group) return;

    try {
      await updateGroup(group.id, {
        headerImage: image.urls.regular,
        headerImageAttribution: `Photo by ${image.user.name} on Unsplash`,
      });

      setGroup({
        ...group,
        headerImage: image.urls.regular,
        headerImageAttribution: `Photo by ${image.user.name} on Unsplash`,
      });
    } catch (error) {
      console.error('Error updating group image:', error);
      // Handle error
    }

    setIsSearchingImage(false);
  };

  const handleNameChange = async (newName: string) => {
    if (!group) return;

    try {
      await updateGroup(group.id, { name: newName });
      setGroup({ ...group, name: newName });
    } catch (error) {
      console.error('Error updating group name:', error);
      // Handle error
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    if (!group) return;

    try {
      await updateGroup(group.id, { currency: newCurrency });
      setGroup({ ...group, currency: newCurrency });
    } catch (error) {
      console.error('Error updating group currency:', error);
      // Handle error
    }
  };

  const handleSettleUp = () => {
    if (!group) return;
    setIsSettlingUp(true);
  };

  const handleSendInvitation = () => {
    setIsInviting(true);
  };

  const handleDeleteGroup = async () => {
    if (!group || !window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteGroup(group.id);
      router.push('/');
    } catch (error) {
      console.error('Error deleting group:', error);
      // Handle error (show toast/notification)
    }
  };

  const handleAddParticipantField = () => {
    setNewParticipants([...newParticipants, { firstName: '', lastName: '' }]);
  };

  const handleParticipantChange = (index: number, field: 'firstName' | 'lastName', value: string) => {
    const updatedParticipants = [...newParticipants];
    updatedParticipants[index][field] = value;
    setNewParticipants(updatedParticipants);
  };

  const handleAddParticipants = async () => {
    if (!group) return;

    // Filter out empty entries
    const validParticipants = newParticipants.filter(p => p.firstName.trim() && p.lastName.trim());
    
    if (validParticipants.length === 0) return;

    try {
      const updatedParticipants = [...group.participants, ...validParticipants];
      await updateGroup(group.id, { participants: updatedParticipants });
      setGroup({ ...group, participants: updatedParticipants });
      setIsAddingParticipant(false);
      setNewParticipants([{ firstName: '', lastName: '' }]);
    } catch (error) {
      console.error('Error adding participants:', error);
      // Handle error
    }
  };

  const handleRemoveParticipantField = (index: number) => {
    if (newParticipants.length === 1) return;
    const updatedParticipants = newParticipants.filter((_, i) => i !== index);
    setNewParticipants(updatedParticipants);
  };

  const handleDeleteParticipant = async (index: number) => {
    if (!group || !window.confirm('Are you sure you want to remove this participant?')) {
      return;
    }

    try {
      const updatedParticipants = group.participants.filter((_, i) => i !== index);
      await updateGroup(group.id, { participants: updatedParticipants });
      setGroup({ ...group, participants: updatedParticipants });
    } catch (error) {
      console.error('Error removing participant:', error);
      // Handle error
    }
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id' | 'groupId' | 'createdAt'>) => {
    if (!group) return;
    await addExpense(group.id, expense);
    
    // Refresh group data to get updated expenses
    const groupData = await getGroup(group.id);
    if (groupData) {
      setGroup(groupData);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!group || !window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await deleteExpense(group.id, expense);
      
      // Refresh group data to get updated expenses
      const groupData = await getGroup(group.id);
      if (groupData) {
        setGroup(groupData);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      // Handle error
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddingExpense(true);
  };

  const handleUpdateExpense = async (updatedExpense: Omit<Expense, 'id' | 'groupId' | 'createdAt'>) => {
    if (!group || !editingExpense) return;

    try {
      await updateExpense(group.id, editingExpense.id, updatedExpense);
      
      // Refresh group data to get updated expenses
      const groupData = await getGroup(group.id);
      if (groupData) {
        setGroup(groupData);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      // Handle error
    }
  };

  const handleMobileColorChange = async () => {
    if (!group) return;
    
    const newColorIndex = (currentColorIndex + 1) % gradientColors.length;
    setCurrentColorIndex(newColorIndex);

    try {
      await updateGroup(group.id, { colorIndex: newColorIndex });
      setGroup({ ...group, colorIndex: newColorIndex });
    } catch (error) {
      console.error('Error updating color:', error);
      // Revert the color if update fails
      setCurrentColorIndex(group.colorIndex || 0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Group not found</h2>
          <p className="mt-2 text-gray-500">This group might have been deleted or doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Immersive Header - Made responsive with mobile optimization */}
      <div className={`relative h-[45vh] sm:h-[50vh] md:h-[70vh] bg-gradient-to-br ${gradientColors[currentColorIndex]} -mt-16`}>
        {/* Image only loads on tablet and above */}
        {group.headerImage && (
          <div className="hidden absolute inset-0">
            <Image
              src={group.headerImage}
              alt={group.name}
              fill
              className="object-cover"
              priority
              quality={90}
              sizes="100vw"
            />
          </div>
        )}
        {/* Gradient overlay - Enhanced for mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/20" />
        
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mobile-pattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M0 32V0h32" fill="none" stroke="currentColor" strokeOpacity="0.1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mobile-pattern)" />
          </svg>
        </div>
        
        {/* Header Content - Enhanced mobile layout */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {/* Top Section */}
          <div className="w-full pt-6 sm:pt-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-0 sm:flex sm:flex-row justify-between items-start">
              <div className="w-full sm:w-auto">
                {isEditingName ? (
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-white bg-transparent border-b-2 border-white/30 focus:outline-none focus:border-white w-full"
                    autoFocus
                  />
                ) : (
                  <h1 
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-white cursor-pointer hover:opacity-90 transition-opacity tracking-tight"
                    onClick={() => setIsEditingName(true)}
                  >
                    {group.name}
                  </h1>
                )}
              </div>

              {/* Change Cover button - Hidden on mobile, shown on desktop */}
              <button
                onClick={() => setShowCoverOptions(true)}
                className="hidden sm:flex px-4 py-2.5 text-sm font-medium text-white bg-white/10 rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm items-center justify-center gap-2 group"
              >
                <svg 
                  className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Change Cover
              </button>
            </div>
          </div>

          {group.headerImageAttribution && (
            <div className="hidden md:block absolute bottom-20 left-4 md:left-8">
              <p className="text-xs sm:text-sm text-white/70 font-medium tracking-wide">
                {group.headerImageAttribution}
              </p>
            </div>
          )}

          {/* Quick Stats Bar - Enhanced mobile layout */}
          <div className="w-full bg-white/10 backdrop-blur-md border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
              <div className="flex flex-col gap-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 items-center gap-2 sm:gap-8">
                  <div className="flex flex-col items-center sm:items-start gap-0.5">
                    <span className="text-white/70 text-xs sm:text-sm">Total Spent</span>
                    <span className="text-white font-semibold text-sm sm:text-base md:text-lg">
                      {currencies.find(c => c.code === group.currency)?.symbol}{group.totalExpenditure.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center sm:items-start gap-0.5">
                    <span className="text-white/70 text-xs sm:text-sm">Members</span>
                    <span className="text-white font-semibold text-sm sm:text-base md:text-lg">
                      {group.participants.length}
                    </span>
                  </div>
                  <div className="flex flex-col items-center sm:items-start gap-0.5">
                    <span className="text-white/70 text-xs sm:text-sm">Currency</span>
                    <span className="text-white font-semibold text-sm sm:text-base md:text-lg">
                      {group.currency}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2">
                  {/* Change Cover button - Shown only on mobile */}
                  <button
                    onClick={() => {
                      if (window.innerWidth < 640) {
                        handleMobileColorChange();
                      } else {
                        setIsSearchingImage(true);
                      }
                    }}
                    className="sm:hidden col-span-2 px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Change Cover
                  </button>
                  <button
                    onClick={handleSettleUp}
                    className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Settle Up
                  </button>
                  <button
                    onClick={handleSendInvitation}
                    className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Invite
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive grid layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Settings Card - Shown at top on mobile */}
        <div className="md:hidden mb-6">
          <CollapsibleCard 
            title="Quick Settings" 
            defaultExpanded={false}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Currency
                </label>
                <select
                  value={group.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900 text-sm"
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Access Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={group.accessCode}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(group.accessCode)}
                    className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </CollapsibleCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Expenses Card */}
            <CollapsibleCard 
              title="Expenses" 
              subtitle={`${group.expenses.length} total`}
            >
              <div className="flex items-center justify-end mb-6">
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    setIsAddingExpense(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Expense
                </button>
              </div>

              {group.expenses.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {currentExpenses.map((expense) => (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        currency={group.currency}
                        onEdit={handleEditExpense}
                        onDelete={handleDeleteExpense}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-gray-800 pt-4">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-white hover:bg-gray-800'
                        }`}
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              currentPage === number
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            {number}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-white hover:bg-gray-800'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400 font-medium">No expenses yet</p>
                </div>
              )}
            </CollapsibleCard>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6 md:space-y-8">
            {/* Settings Card - Hidden on mobile */}
            <div className="hidden md:block">
              <CollapsibleCard title="Settings">
                <div className="flex items-end justify-end mb-6">
                  <button
                    onClick={handleDeleteGroup}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title="Delete Group"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Currency
                    </label>
                    <select
                      value={group.currency}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900"
                    >
                      {currencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} ({curr.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Access Code
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={group.accessCode}
                        readOnly
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(group.accessCode)}
                        className="p-2.5 text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </CollapsibleCard>
            </div>

            {/* Participants Card */}
            <CollapsibleCard 
              title="Participants" 
              subtitle={`${group.participants.length} members`}
            >
              <ParticipantsCard
                group={group}
                onAddParticipant={() => setIsAddingParticipant(true)}
                onDeleteParticipant={handleDeleteParticipant}
              />
            </CollapsibleCard>
          </div>
        </div>
      </div>

      {/* Cover Options Modal */}
      {showCoverOptions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Change Cover</h2>
              <button
                onClick={() => setShowCoverOptions(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Preview of next color */}
              <div className={`h-24 rounded-xl bg-gradient-to-br ${gradientColors[(currentColorIndex + 1) % gradientColors.length]} mb-2`} />
              
              {/* Color Option */}
              <button
                onClick={() => {
                  handleMobileColorChange();
                  setShowCoverOptions(false);
                }}
                className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Change Color</h3>
                  <p className="text-sm text-gray-500">Click to cycle through beautiful gradients</p>
                </div>
              </button>

              {/* Unsplash Option - Disabled */}
              <button
                disabled
                className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl opacity-75 cursor-not-allowed"
              >
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Unsplash Images</h3>
                    <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Coming Soon</span>
                  </div>
                  <p className="text-sm text-gray-500">Choose from millions of beautiful photos</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {isAddingParticipant && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Add Participants</h2>
              <button
                onClick={() => {
                  setIsAddingParticipant(false);
                  setNewParticipants([{ firstName: '', lastName: '' }]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {newParticipants.map((participant, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={participant.firstName}
                      onChange={(e) => handleParticipantChange(index, 'firstName', e.target.value)}
                      placeholder="First Name"
                      className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900"
                    />
                    <input
                      type="text"
                      value={participant.lastName}
                      onChange={(e) => handleParticipantChange(index, 'lastName', e.target.value)}
                      placeholder="Last Name"
                      className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900"
                    />
                  </div>
                  {newParticipants.length > 1 && (
                    <button
                      onClick={() => handleRemoveParticipantField(index)}
                      className="p-2.5 text-red-500 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleAddParticipantField}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Another
              </button>
              <button
                onClick={handleAddParticipants}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Add Participants
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={isSettlingUp}
        onClose={() => setIsSettlingUp(false)}
        group={group!}
        onSettle={handleAddExpense}
      />

      {/* Add/Edit ExpenseModal */}
      <ExpenseModal
        isOpen={isAddingExpense}
        onClose={() => {
          setIsAddingExpense(false);
          setEditingExpense(null);
        }}
        onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
        group={group}
        initialExpense={editingExpense}
      />

      {/* Add InviteModal */}
      <InviteModal
        isOpen={isInviting}
        onClose={() => setIsInviting(false)}
        groupName={group.name}
        accessCode={group.accessCode}
      />
    </div>
  );
};

export default GroupPage; 