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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipedParticipant, setSwipedParticipant] = useState<string | null>(null);

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

  // Handle touch events for swipe actions
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (participantName: string) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    
    if (isLeftSwipe) {
      setSwipedParticipant(participantName);
      setTimeout(() => setSwipedParticipant(null), 3000);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

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
    <div className="space-y-4 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Members ({group.participants.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage members and view balances
          </p>
        </div>
        <button
          onClick={onAddParticipant}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:bg-gray-950 transition-all transform active:scale-95 flex items-center gap-2 shadow-sm"
          aria-label="Add new member"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Member</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Participants List */}
      {group.participants.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {group.participants.map((participant, index) => {
              const fullName = `${participant.firstName} ${participant.lastName}`;
              const balance = balances.find(b => b.participant === fullName)?.amount || 0;
              const isSettled = Math.abs(balance) < 0.01;
              const isSwipedLeft = swipedParticipant === fullName;
              
              return (
                <div
                  key={index}
                  className="relative overflow-hidden"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(fullName)}
                >
                  {/* Swipe Action Background */}
                  <div className={`absolute inset-0 bg-red-500 flex items-center justify-end px-4 transition-transform duration-200 ${
                    isSwipedLeft ? 'translate-x-0' : 'translate-x-full'
                  }`}>
                    <button
                      onClick={() => onDeleteParticipant(index)}
                      className="text-white flex items-center gap-2"
                      aria-label={`Remove ${fullName}`}
                    >
                      <span className="font-medium">Remove</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className={`p-4 bg-white flex items-center justify-between transition-transform duration-200 ${
                    isSwipedLeft ? '-translate-x-24' : 'translate-x-0'
                  }`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 text-white flex items-center justify-center text-base font-medium flex-shrink-0 shadow-sm">
                        {participant.firstName[0]}{participant.lastName[0]}
                      </div>
                      
                      {/* Participant Info */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-base font-medium text-gray-900 truncate">
                          {fullName}
                        </span>
                        <div className={`inline-flex items-center gap-1.5 mt-1 ${
                          isSettled 
                            ? 'text-gray-500'
                            : balance > 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            isSettled 
                              ? 'bg-gray-400'
                              : balance > 0 
                                ? 'bg-green-500' 
                                : 'bg-red-500'
                          }`} />
                          <span className="text-sm">
                            {isSettled
                              ? 'All settled up'
                              : balance > 0 
                                ? `Is owed ${group.currency} ${balance.toFixed(2)}`
                                : `Owes ${group.currency} ${Math.abs(balance).toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center">
                      {/* Info button with tooltip */}
                      {!isSettled && (
                        <div className="relative">
                          <button
                            onClick={() => setActiveSettlement(activeSettlement === fullName ? null : fullName)}
                            className={`p-2 rounded-lg transition-all transform active:scale-95 ${
                              activeSettlement === fullName 
                                ? 'bg-gray-100 text-gray-900' 
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                            aria-label="View balance details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Desktop Delete button */}
                      <button
                        onClick={() => onDeleteParticipant(index)}
                        className="p-2 rounded-lg transition-all transform active:scale-95 text-gray-400 hover:text-red-600 hover:bg-red-50 hidden sm:block"
                        aria-label={`Remove ${fullName}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Members Yet</h3>
          <p className="text-base text-gray-500 mb-6">
            Add members to track expenses together
          </p>
          <button
            onClick={onAddParticipant}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:bg-gray-950 transition-all transform active:scale-95 inline-flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add First Member
          </button>
        </div>
      )}

      {/* Balance Details Modal - Moved outside the participants list */}
      {activeSettlement && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveSettlement(null)}
        >
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" aria-hidden="true" />
            
            <div 
              className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle bg-white rounded-2xl shadow-xl transform transition-all opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              style={{ animation: 'modal-in 0.3s ease-out forwards' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 text-white flex items-center justify-center text-sm font-medium">
                    {group.participants.find(p => 
                      `${p.firstName} ${p.lastName}` === activeSettlement
                    )?.firstName[0]}
                    {group.participants.find(p => 
                      `${p.firstName} ${p.lastName}` === activeSettlement
                    )?.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 leading-none mb-1" id="modal-title">
                      {activeSettlement}
                    </h3>
                    <p className="text-sm text-gray-500">Balance Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSettlement(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                  aria-label="Close details"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-sm text-gray-600 mb-1">Current Balance</div>
                  <div className={`text-2xl font-semibold ${
                    balances.find(b => b.participant === activeSettlement)?.amount! > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {balances.find(b => b.participant === activeSettlement)?.amount! > 0 ? '+' : ''}
                    {group.currency} {balances.find(b => b.participant === activeSettlement)?.amount!.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                    balances.find(b => b.participant === activeSettlement)?.amount! > 0 
                      ? 'bg-green-50 border-green-100' 
                      : 'bg-red-50 border-red-100'
                  }`}>
                    <div className={`p-2 rounded-lg ${
                      balances.find(b => b.participant === activeSettlement)?.amount! > 0 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {balances.find(b => b.participant === activeSettlement)?.amount! > 0 ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                        )}
                      </svg>
                    </div>
                    <p className={`text-sm ${
                      balances.find(b => b.participant === activeSettlement)?.amount! > 0 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {balances.find(b => b.participant === activeSettlement)?.amount! > 0 
                        ? 'This member has paid more than their share'
                        : 'This member needs to pay their share'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6">
                <button
                  onClick={() => setActiveSettlement(null)}
                  className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update the keyframe animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: translate3d(0, 2rem, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ParticipantsCard; 