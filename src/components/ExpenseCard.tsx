import { useState } from 'react';
import type { Expense } from '@/utils/firebase';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  currency: string;
}

const ExpenseCard = ({ expense, onEdit, onDelete, currency }: ExpenseCardProps) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If it's today, just show the time
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If it's yesterday, show "Yesterday"
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise show the short date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const totalParticipants = expense.splits.length;
  const excludedParticipants = expense.splitType === 'equal' ? 
    expense.splits.filter(split => split.amount === 0).length : 0;

  const isSettlement = expense.description.toLowerCase().includes('settlement');
  
  // Get first name only for paid by
  const paidByFirstName = expense.paidBy.split(' ')[0];

  return (
    <div 
      className={`bg-white border-l-4 rounded-lg shadow-sm transition-all duration-200 ${
        isSettlement 
          ? 'border-l-green-500 hover:shadow hover:bg-green-50/30' 
          : 'border-l-blue-500 hover:shadow hover:bg-blue-50/30'
      }`}
    >
      <div 
        className="py-3 px-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Left: Icon + Description */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isSettlement ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {isSettlement ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2" />
                </svg>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className={`text-base font-medium truncate ${
                isSettlement ? 'text-green-700' : 'text-gray-900'
              }`}>
                {expense.description}
              </h3>
              <div className="flex flex-wrap items-center text-xs text-gray-500 mt-0.5">
                <span className="truncate max-w-[100px]">{paidByFirstName}</span>
                <span className="mx-1">•</span>
                <span className="whitespace-nowrap">{formatDate(expense.date)}</span>
                {!isExpanded && excludedParticipants > 0 && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="whitespace-nowrap">{totalParticipants - excludedParticipants}/{totalParticipants}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Right: Amount + Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
            <span className={`text-base font-medium whitespace-nowrap ${
              isSettlement ? 'text-green-700' : 'text-gray-900'
            }`}>
              {currency} {expense.amount.toFixed(2)}
            </span>
            
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(expense);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit Expense"
                aria-label="Edit Expense"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDelete(true);
                }}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete Expense"
                aria-label="Delete Expense"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title={isExpanded ? "Show less" : "Show more"}
                aria-label={isExpanded ? "Show less" : "Show more"}
              >
                <svg 
                  className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Split Details (Expandable) */}
      <div 
        className={`px-4 overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-96 pb-3 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`pt-2 border-t ${isSettlement ? 'border-green-100' : 'border-gray-100'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {expense.splits.map((split, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600 truncate">{split.participantName}</span>
                <span className={`text-sm font-medium ${
                  isSettlement ? 'text-green-700' : 'text-gray-900'
                }`}>
                  {currency} {split.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <span className={`inline-flex px-2 py-1 text-xs rounded-md ${
              isSettlement
                ? 'text-green-700 bg-green-50'
                : expense.splitType === 'equal'
                ? 'text-gray-600 bg-gray-100'
                : 'text-blue-600 bg-blue-50'
            }`}>
              {isSettlement 
                ? 'Settlement' 
                : expense.splitType === 'equal' 
                ? 'Split equally' 
                : 'Custom split'}
            </span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete {isSettlement ? 'Settlement' : 'Expense'}</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {isSettlement ? 'settlement' : 'expense'}? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(expense);
                  setShowConfirmDelete(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCard;