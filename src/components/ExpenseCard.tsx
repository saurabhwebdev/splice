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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalParticipants = expense.splits.length;
  const excludedParticipants = expense.splitType === 'equal' ? 
    expense.splits.filter(split => split.amount === 0).length : 0;

  const isSettlement = expense.description.toLowerCase().includes('settlement');

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${
      isSettlement 
        ? 'border-green-100 hover:shadow-green-md' 
        : 'border-gray-100 hover:shadow-md'
    }`}>
      <div 
        className="p-4 sm:p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className={`text-base font-medium leading-tight ${
              isSettlement ? 'text-green-700' : 'text-gray-900'
            }`}>
              {expense.description}
            </h3>
            <span className={`text-base font-semibold whitespace-nowrap ${
              isSettlement ? 'text-green-700' : 'text-gray-900'
            }`}>
              {currency} {expense.amount.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 mb-3">
            <span>{formatDate(expense.date)}</span>
            <span>•</span>
            <span>Paid by {expense.paidBy}</span>
            {!isExpanded && excludedParticipants > 0 && (
              <>
                <span>•</span>
                <span>{totalParticipants - excludedParticipants} of {totalParticipants} members</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
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
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(expense);
                }}
                className={`p-2.5 rounded-lg transition-colors ${
                  isSettlement 
                    ? 'text-green-400 hover:text-green-600 hover:bg-green-50' 
                    : 'text-gray-400 hover:text-blue-600 hover:bg-gray-50'
                }`}
                title="Edit Expense"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDelete(true);
                }}
                className={`p-2.5 rounded-lg transition-colors ${
                  isSettlement 
                    ? 'text-green-400 hover:text-red-600 hover:bg-red-50' 
                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                }`}
                title="Delete Expense"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className={`p-2.5 rounded-lg transition-colors ${
                  isSettlement 
                    ? 'text-green-400 hover:text-green-600 hover:bg-green-50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
                title={isExpanded ? "Show less" : "Show more"}
              >
                <svg 
                  className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
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

        {/* Desktop Layout */}
        <div className="hidden sm:block">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className={`text-lg font-medium truncate ${
                  isSettlement ? 'text-green-700' : 'text-gray-900'
                }`}>
                  {expense.description}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span>{formatDate(expense.date)}</span>
                <span>•</span>
                <span>Paid by {expense.paidBy}</span>
                {!isExpanded && excludedParticipants > 0 && (
                  <>
                    <span>•</span>
                    <span>{totalParticipants - excludedParticipants} of {totalParticipants} members</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold whitespace-nowrap ${
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
                  className={`p-2 transition-colors ${
                    isSettlement 
                      ? 'text-green-400 hover:text-green-600' 
                      : 'text-gray-400 hover:text-blue-600'
                  }`}
                  title="Edit Expense"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirmDelete(true);
                  }}
                  className={`p-2 transition-colors ${
                    isSettlement 
                      ? 'text-green-400 hover:text-red-600' 
                      : 'text-gray-400 hover:text-red-600'
                  }`}
                  title="Delete Expense"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className={`p-2 transition-colors ${
                    isSettlement 
                      ? 'text-green-400 hover:text-green-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={isExpanded ? "Show less" : "Show more"}
                >
                  <svg 
                    className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
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
      </div>

      {/* Split Details (Expandable) */}
      <div 
        className={`px-4 sm:px-5 overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-96 pb-4 sm:pb-5 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`pt-2 border-t ${isSettlement ? 'border-green-100' : 'border-gray-100'}`}>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Split Details</h4>
          <div className="space-y-2">
            {expense.splits.map((split, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{split.participantName}</span>
                <span className={`text-sm font-medium ${
                  isSettlement ? 'text-green-700' : 'text-gray-900'
                }`}>
                  {currency} {split.amount.toFixed(2)}
                </span>
              </div>
            ))}
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
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(expense);
                  setShowConfirmDelete(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
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