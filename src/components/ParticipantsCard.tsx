import { useMemo, useState, useEffect } from 'react';
import type { Group, Expense } from '@/utils/firebase';

interface ParticipantsCardProps {
  group: Group;
  onAddParticipant: () => void;
  onDeleteParticipant: (index: number) => void;
}

interface Balance {
  participant: string;
  amount: number;
}

const ParticipantsCard = ({ group, onAddParticipant, onDeleteParticipant }: ParticipantsCardProps) => {
  const [activeSettlement, setActiveSettlement] = useState<string | null>(null);

  // Calculate balances for each participant
  const balances = useMemo(() => {
    const balanceMap = new Map<string, number>();

    // Initialize balances for all participants
    group.participants.forEach(participant => {
      const name = `${participant.firstName} ${participant.lastName}`;
      balanceMap.set(name, 0);
    });

    // Calculate balances from expenses
    (group.expenses || []).forEach((expense: Expense) => {
      const currentPayerBalance = balanceMap.get(expense.paidBy) || 0;
      balanceMap.set(expense.paidBy, currentPayerBalance + expense.amount);

      expense.splits.forEach(split => {
        const currentBalance = balanceMap.get(split.participantName) || 0;
        balanceMap.set(split.participantName, currentBalance - split.amount);
      });
    });

    return Array.from(balanceMap.entries())
      .map(([participant, amount]) => ({
        participant,
        amount: Number(amount.toFixed(2))
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [group.expenses, group.participants]);

  // Close settlement tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeSettlement && !(event.target as Element).closest('.settlement-tooltip')) {
        setActiveSettlement(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSettlement]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Members ({group.participants.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage group participants and view their balances
          </p>
        </div>
        <button
          onClick={onAddParticipant}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </button>
      </div>

      {/* Participants List */}
      {group.participants.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {group.participants.map((participant, index) => {
            const fullName = `${participant.firstName} ${participant.lastName}`;
            const balance = balances.find(b => b.participant === fullName)?.amount || 0;
            const isSettled = Math.abs(balance) < 0.01;
            
            return (
              <div
                key={index}
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm sm:text-base font-medium flex-shrink-0">
                      {participant.firstName[0]}{participant.lastName[0]}
                    </div>
                    
                    {/* Participant Info */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm sm:text-base font-medium text-gray-900 truncate">
                        {fullName}
                      </span>
                      <span className={`text-xs sm:text-sm mt-0.5 ${
                        isSettled 
                          ? 'text-gray-500'
                          : balance > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                      }`}>
                        {isSettled
                          ? 'All settled up'
                          : balance > 0 
                            ? `Is owed ${group.currency} ${balance.toFixed(2)}`
                            : `Owes ${group.currency} ${Math.abs(balance).toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Info button with tooltip */}
                    {!isSettled && (
                      <div className="relative settlement-tooltip">
                        <button
                          onClick={() => setActiveSettlement(activeSettlement === fullName ? null : fullName)}
                          className={`p-2 sm:p-2.5 rounded-lg transition-colors ${
                            activeSettlement === fullName 
                              ? 'bg-gray-100 text-gray-900' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                          title="View balance details"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        
                        {activeSettlement === fullName && (
                          <div 
                            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSettlement(null);
                            }}
                          >
                            <div 
                              className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900">Balance Details</h4>
                                <button
                                  onClick={() => setActiveSettlement(null)}
                                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                  <div className="text-sm text-gray-500">Current Balance</div>
                                  <div className={`text-xl font-semibold mt-1 ${
                                    balance > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {balance > 0 ? '+' : ''}{group.currency} {balance.toFixed(2)}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {balance > 0 
                                    ? 'This member has paid more than their share'
                                    : 'This member needs to pay their share'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteParticipant(index)}
                      className="p-2 sm:p-2.5 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Remove Member"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Members Yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Add members to start tracking expenses together
          </p>
          <button
            onClick={onAddParticipant}
            className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add First Member
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantsCard; 