import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Expense, Group } from '@/utils/firebase';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, 'id' | 'groupId' | 'createdAt'>) => Promise<void>;
  group: Group;
  initialExpense: Expense | null;
}

const ExpenseModal = ({ isOpen, onClose, onSubmit, group, initialExpense }: ExpenseModalProps) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [splits, setSplits] = useState<{ participantName: string; amount: number; excluded: boolean; }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize the participants map to prevent unnecessary recalculations
  const participantsMap = useCallback(() => {
    return group.participants.map(p => ({
      participantName: `${p.firstName} ${p.lastName}`,
      amount: 0,
      excluded: false
    }));
  }, [group.participants]);

  const updateSplits = useCallback(() => {
    const numAmount = Number(amount) || 0;
    const includedParticipants = splits.filter(s => !s.excluded).length || group.participants.length;
    
    if (splitType === 'equal' && includedParticipants > 0) {
      const splitAmount = Number((numAmount / includedParticipants).toFixed(2));
      setSplits(prevSplits => 
        group.participants.map(p => {
          const participantName = `${p.firstName} ${p.lastName}`;
          const existingSplit = prevSplits.find(s => s.participantName === participantName);
          return {
            participantName,
            amount: existingSplit?.excluded ? 0 : splitAmount,
            excluded: existingSplit?.excluded || false
          };
        })
      );
    }
  }, [amount, group.participants, splitType]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialExpense) {
        setDescription(initialExpense.description);
        setAmount(initialExpense.amount.toString());
        setDate(initialExpense.date);
        setPaidBy(initialExpense.paidBy);
        setSplitType(initialExpense.splitType);
        
        setSplits(
          group.participants.map(p => {
            const participantName = `${p.firstName} ${p.lastName}`;
            const existingSplit = initialExpense.splits.find(s => s.participantName === participantName);
            return {
              participantName,
              amount: existingSplit?.amount || 0,
              excluded: !existingSplit
            };
          })
        );
      } else {
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaidBy(group.participants[0]?.firstName + ' ' + group.participants[0]?.lastName);
        setSplitType('equal');
        setSplits(participantsMap());
      }
    }
  }, [isOpen, initialExpense, group.participants, participantsMap]);

  // Update splits when amount changes
  useEffect(() => {
    if (amount && splitType === 'equal') {
      updateSplits();
    }
  }, [amount, splitType, updateSplits]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  const handleSplitChange = (index: number, value: string) => {
    if (splitType === 'custom') {
      setSplits(prevSplits => {
        const newSplits = [...prevSplits];
        newSplits[index].amount = Number(value) || 0;
        return newSplits;
      });
    }
  };

  const handleExcludeParticipant = (index: number) => {
    setSplits(prevSplits => {
      const newSplits = [...prevSplits];
      newSplits[index].excluded = !newSplits[index].excluded;
      newSplits[index].amount = 0;

      if (splitType === 'equal') {
        const numAmount = Number(amount) || 0;
        const includedParticipants = newSplits.filter(s => !s.excluded).length;
        if (includedParticipants > 0) {
          const splitAmount = Number((numAmount / includedParticipants).toFixed(2));
          newSplits.forEach(split => {
            if (!split.excluded) {
              split.amount = splitAmount;
            }
          });
        }
      }

      return newSplits;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const numAmount = Number(amount);
    if (!description || !numAmount || !date || !paidBy) return;

    const includedSplits = splits.filter(s => !s.excluded);
    if (splitType === 'custom') {
      const totalSplit = includedSplits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalSplit - numAmount) > 0.01) {
        alert('Split amounts must sum up to the total amount');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        description,
        amount: numAmount,
        currency: group.currency,
        date,
        paidBy,
        splitType,
        splits: includedSplits
      });
      onClose();
    } catch (error) {
      console.error('Error submitting expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300 
            }}
            className="relative bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Mobile handle for dragging */}
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1"></div>
            
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-4 sm:px-6 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {initialExpense ? 'Edit Expense' : 'Add Expense'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {initialExpense ? 'Update the expense details' : 'Add a new expense to the group'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              {/* Content */}
              <div className="px-4 sm:px-6 py-4">
                <div className="space-y-6">
                  {/* Description */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 transition-all"
                      placeholder="What was this expense for?"
                      required
                    />
                  </motion.div>

                  {/* Amount and Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount ({group.currency})
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 transition-all"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 transition-all"
                        required
                      />
                    </motion.div>
                  </div>

                  {/* Paid By */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paid by
                    </label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 transition-all"
                      required
                    >
                      {group.participants.map((p, i) => (
                        <option key={i} value={`${p.firstName} ${p.lastName}`}>
                          {p.firstName} {p.lastName}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  {/* Split Type */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Split Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex-1 flex items-center px-4 py-3 rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300 transition-all">
                        <input
                          type="radio"
                          checked={splitType === 'equal'}
                          onChange={() => setSplitType('equal')}
                          className="mr-2 text-gray-900"
                        />
                        <span className="text-sm font-medium text-gray-900">Split Equally</span>
                      </label>
                      <label className="flex-1 flex items-center px-4 py-3 rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300 transition-all">
                        <input
                          type="radio"
                          checked={splitType === 'custom'}
                          onChange={() => setSplitType('custom')}
                          className="mr-2 text-gray-900"
                        />
                        <span className="text-sm font-medium text-gray-900">Custom Split</span>
                      </label>
                    </div>
                  </motion.div>

                  {/* Split Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gray-50 rounded-xl p-4"
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Split Details
                    </label>
                    <div className="space-y-3">
                      {splits.map((split, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-4 p-3 rounded-xl bg-white border transition-all ${
                            split.excluded ? 'border-gray-200 opacity-75' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleExcludeParticipant(index)}
                              className={`p-2 rounded-lg transition-colors ${
                                split.excluded 
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              title={split.excluded ? 'Include in split' : 'Exclude from split'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {split.excluded ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                )}
                              </svg>
                            </button>
                            <span className={`text-sm font-medium truncate ${split.excluded ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {split.participantName}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={split.amount}
                            onChange={(e) => handleSplitChange(index, e.target.value)}
                            className={`w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 text-sm transition-all ${
                              split.excluded ? 'opacity-50' : ''
                            }`}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            disabled={splitType === 'equal' || split.excluded}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {initialExpense ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {initialExpense ? 'Update Expense' : 'Add Expense'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExpenseModal; 