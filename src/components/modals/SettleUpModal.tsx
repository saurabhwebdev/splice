import { useState, useEffect } from 'react';
import type { Group, Expense } from '@/utils/firebase';

interface Settlement {
  from: string;
  to: string;
  amount: number;
  isSettling?: boolean;
  isSettled?: boolean;
}

interface Balance {
  participant: string;
  amount: number;
}

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onSettle: (settlement: Omit<Expense, 'id' | 'groupId' | 'createdAt'>) => Promise<void>;
}

// Calculate balances for each participant
const calculateBalances = (expenses: Expense[], participants: { firstName: string; lastName: string; }[]): Balance[] => {
  const balanceMap = new Map<string, number>();

  // Initialize balances for all participants
  participants.forEach(participant => {
    const name = `${participant.firstName} ${participant.lastName}`;
    balanceMap.set(name, 0);
  });

  // Calculate balances from expenses
  expenses.forEach(expense => {
    // Add the full amount to the payer's balance (positive means they are owed money)
    const currentPayerBalance = balanceMap.get(expense.paidBy) || 0;
    balanceMap.set(expense.paidBy, currentPayerBalance + expense.amount);

    // Subtract each participant's share
    expense.splits.forEach(split => {
      const currentBalance = balanceMap.get(split.participantName) || 0;
      balanceMap.set(split.participantName, currentBalance - split.amount);
    });
  });

  return Array.from(balanceMap.entries())
    .map(([participant, amount]) => ({
      participant,
      amount: Number(amount.toFixed(2)) // Round to 2 decimal places
    }))
    .sort((a, b) => b.amount - a.amount); // Sort by amount (highest to lowest)
};

// Calculate optimized settlements
const calculateSettlements = (balances: Balance[]): Settlement[] => {
  const result: Settlement[] = [];
  const roundedBalances = balances.map(b => ({
    ...b,
    amount: Number(b.amount.toFixed(2)) // Ensure consistent rounding
  }));

  // Filter out settled balances (close to zero)
  const debtors = roundedBalances.filter(b => b.amount < -0.01)
    .sort((a, b) => a.amount - b.amount); // Most negative first
  const creditors = roundedBalances.filter(b => b.amount > 0.01)
    .sort((a, b) => b.amount - a.amount); // Most positive first

  // Helper function to find the best match for a debtor
  const findBestMatch = (debtor: Balance, remainingCreditors: Balance[]) => {
    // First try to find an exact match
    const exactMatch = remainingCreditors.find(c => Math.abs(c.amount + debtor.amount) < 0.01);
    if (exactMatch) return exactMatch;

    // Then try to find the closest match that would settle the smaller amount
    const closestMatch = remainingCreditors.reduce((best, current) => {
      const currentDiff = Math.abs(current.amount + debtor.amount);
      const bestDiff = Math.abs(best.amount + debtor.amount);
      return currentDiff < bestDiff ? current : best;
    }, remainingCreditors[0]);

    return closestMatch;
  };

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = findBestMatch(debtor, creditors);

    const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
    if (amount > 0.01) {
      result.push({
        from: debtor.participant,
        to: creditor.participant,
        amount: Number(amount.toFixed(2))
      });
    }

    // Update balances
    debtor.amount = Number((debtor.amount + amount).toFixed(2));
    creditor.amount = Number((creditor.amount - amount).toFixed(2));

    // Remove settled participants
    if (Math.abs(debtor.amount) < 0.01) debtors.shift();
    if (Math.abs(creditor.amount) < 0.01) {
      creditors.splice(creditors.indexOf(creditor), 1);
    }
  }

  return result;
};

const SettleUpModal = ({ isOpen, onClose, group, onSettle }: SettleUpModalProps) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  // Calculate initial settlements
  useEffect(() => {
    if (isOpen) {
      const balances = calculateBalances(group.expenses, group.participants);
      const initialSettlements = calculateSettlements(balances);
      setSettlements(initialSettlements.map(s => ({ ...s, isSettling: false, isSettled: false })));
    }
  }, [isOpen, group.expenses, group.participants]);

  const handleSettleUp = async (settlement: Settlement, index: number) => {
    try {
      // Update settlement status to settling
      setSettlements(prev => prev.map((s, i) => 
        i === index ? { ...s, isSettling: true } : s
      ));

      // Create the settling expense
      const settlingExpense: Omit<Expense, 'id' | 'groupId' | 'createdAt'> = {
        description: 'Settlement payment',
        amount: settlement.amount,
        paidBy: settlement.from,
        splitType: 'custom',
        splits: [
          { participantName: settlement.to, amount: settlement.amount }
        ],
        currency: group.currency,
        date: new Date().toISOString()
      };

      await onSettle(settlingExpense);

      // Update settlement status to settled
      setSettlements(prev => prev.map((s, i) => 
        i === index ? { ...s, isSettling: false, isSettled: true } : s
      ));

      // Check if all settlements are complete
      const remainingSettlements = settlements.filter((s, i) => i !== index && !s.isSettled);
      if (remainingSettlements.length === 0) {
        setTimeout(() => {
          onClose();
        }, 1500); // Give time to see the success state
      }
    } catch (error) {
      // Reset settling state on error
      setSettlements(prev => prev.map((s, i) => 
        i === index ? { ...s, isSettling: false } : s
      ));
      console.error('Error settling up:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4 md:p-8">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-gray-100">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Settle Up</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            disabled={settlements.some(s => s.isSettling)}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {settlements.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs sm:text-sm text-blue-700">
                <span className="font-medium block mb-1">About Settling Up</span>
                &quot;Settling up&quot; means you&apos;re confirming that all debts are cleared between members.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {settlements.map((settlement, index) => {
                // Get first names only for smaller screens
                const fromFirstName = settlement.from.split(' ')[0];
                const toFirstName = settlement.to.split(' ')[0];
                
                return (
                  <div
                    key={index}
                    className={`p-3 sm:p-4 rounded-lg transition-colors ${
                      settlement.isSettled 
                        ? 'bg-green-50 border border-green-100' 
                        : settlement.isSettling 
                          ? 'bg-gray-50 animate-pulse border border-gray-100' 
                          : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Mobile view (stacked) */}
                        <div className="flex items-center justify-between sm:hidden">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-medium text-red-600">
                              {fromFirstName[0]}
                            </div>
                            <span className="font-medium text-red-600 text-xs truncate max-w-[80px]">{fromFirstName}</span>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-600">
                              {toFirstName[0]}
                            </div>
                            <span className="font-medium text-green-600 text-xs truncate max-w-[80px]">{toFirstName}</span>
                          </div>
                        </div>
                        
                        {/* Desktop view (horizontal) */}
                        <div className="hidden sm:flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-xs font-medium text-red-600">
                              {settlement.from.split(' ').map(name => name[0]).join('')}
                            </div>
                            <span className="font-medium text-red-600 truncate max-w-[120px]">{settlement.from}</span>
                          </div>
                          <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <div className="flex items-center gap-1.5">
                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-600">
                              {settlement.to.split(' ').map(name => name[0]).join('')}
                            </div>
                            <span className="font-medium text-green-600 truncate max-w-[120px]">{settlement.to}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 sm:mt-1 flex items-center">
                          <div className="px-2 py-1 bg-white rounded-md border border-gray-200 inline-block">
                            <span className="text-base sm:text-lg font-semibold text-gray-900">
                              {group.currency} {settlement.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {settlement.isSettled ? (
                          <div className="px-3 py-1.5 text-xs sm:text-sm font-medium text-green-600 bg-green-100 rounded-lg flex items-center gap-1.5 border border-green-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Settled
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSettleUp(settlement, index)}
                            disabled={settlement.isSettling || settlements.some(s => s.isSettling)}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5
                              ${settlement.isSettling
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'text-white bg-gray-900 hover:bg-gray-800'
                              }`}
                          >
                            {settlement.isSettling ? (
                              <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="sm:hidden">Processing</span>
                                <span className="hidden sm:inline">Processing...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Settle Up
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg 
                className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Settled Up!</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Everyone&apos;s balances are cleared. No payments needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettleUpModal; 