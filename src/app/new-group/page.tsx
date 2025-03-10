'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGroup } from '@/utils/firebase';
import type { Group } from '@/utils/firebase';

export default function NewGroup() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isCreating, setIsCreating] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'INR', symbol: '₹' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      // Generate a random access code
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const groupData: Omit<Group, 'id'> = {
        name: groupName.trim(),
        currency,
        headerImage: '',
        headerImageAttribution: '',
        totalExpenditure: 0,
        participants: [],
        createdAt: new Date(),
        accessCode,
        expenses: []
      };

      const groupId = await createGroup(groupData);

      // Store the group ID in localStorage
      const accessedGroups = JSON.parse(localStorage.getItem('accessedGroups') || '[]');
      localStorage.setItem('accessedGroups', JSON.stringify([...accessedGroups, groupId]));

      router.push(`/groups/${groupId}`);
    } catch (error) {
      console.error('Error creating group:', error);
      // Handle error (show toast/notification)
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Create a New Group</h1>
          <p className="mt-2 text-sm text-gray-500">
            Start splitting expenses with your friends
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900"
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isCreating || !groupName.trim()}
            className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Creating Group...</span>
              </>
            ) : (
              'Create Group'
            )}
          </button>
        </form>
      </div>
    </main>
  );
} 