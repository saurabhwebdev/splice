import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      if (initialExpense) {
        // Populate form with initial expense data
        setDescription(initialExpense.description);
        setAmount(initialExpense.amount.toString());
        setDate(initialExpense.date);
        setPaidBy(initialExpense.paidBy);
        setSplitType(initialExpense.splitType);
        
        // Convert splits to include excluded status
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
        // Reset form for new expense
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaidBy(group.participants[0]?.firstName + ' ' + group.participants[0]?.lastName);
        setSplitType('equal');
        updateSplits();
      }
    }
  }, [isOpen, initialExpense, group.participants]);

  const updateSplits = (newAmount?: string) => {
    const numAmount = Number(newAmount || amount) || 0;
    const includedParticipants = group.participants.length;
    
    if (splitType === 'equal') {
      setSplits(
        group.participants.map(p => ({
          participantName: `${p.firstName} ${p.lastName}`,
          amount: splits.find(s => s.participantName === `${p.firstName} ${p.lastName}`)?.excluded ? 0 : 
            Number((numAmount / includedParticipants).toFixed(2)),
          excluded: splits.find(s => s.participantName === `${p.firstName} ${p.lastName}`)?.excluded || false
        }))
      );
    }
  };

  useEffect(() => {
    updateSplits();
  }, [splitType, group.participants.length]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    updateSplits(value);
  };

  const handleSplitChange = (index: number, value: string) => {
    if (splitType === 'custom') {
      const newSplits = [...splits];
      newSplits[index].amount = Number(value) || 0;
      setSplits(newSplits);
    }
  };

  const handleExcludeParticipant = (index: number) => {
    const newSplits = [...splits];
    newSplits[index].excluded = !newSplits[index].excluded;
    newSplits[index].amount = 0;
    setSplits(newSplits);

    // Recalculate splits for non-excluded participants if split type is equal
    if (splitType === 'equal') {
      const numAmount = Number(amount) || 0;
      const includedParticipants = newSplits.filter(s => !s.excluded).length;
      if (includedParticipants > 0) {
        const splitAmount = numAmount / includedParticipants;
        newSplits.forEach(split => {
          if (!split.excluded) {
            split.amount = Number(splitAmount.toFixed(2));
          }
        });
        setSplits(newSplits);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const numAmount = Number(amount);
    if (!description || !numAmount || !date || !paidBy) return;

    // Validate custom splits sum up to total
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
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl p-8 w-full max-w-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {initialExpense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-2">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900"
                  placeholder="What was this expense for?"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ({group.currency})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid by
                </label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900"
                  required
                >
                  {group.participants.map((p, i) => (
                    <option key={i} value={`${p.firstName} ${p.lastName}`}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Split Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center px-4 py-2 rounded-lg bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors">
                    <input
                      type="radio"
                      checked={splitType === 'equal'}
                      onChange={() => setSplitType('equal')}
                      className="mr-2 text-gray-900"
                    />
                    <span className="text-gray-900">Split Equally</span>
                  </label>
                  <label className="flex items-center px-4 py-2 rounded-lg bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors">
                    <input
                      type="radio"
                      checked={splitType === 'custom'}
                      onChange={() => setSplitType('custom')}
                      className="mr-2 text-gray-900"
                    />
                    <span className="text-gray-900">Custom Split</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Split Details
                </label>
                <div className="space-y-3">
                  {splits.map((split, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          type="button"
                          onClick={() => handleExcludeParticipant(index)}
                          className={`p-1.5 rounded-lg transition-colors ${
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
                        <span className={`text-gray-900 ${split.excluded ? 'line-through text-gray-400' : ''}`}>
                          {split.participantName}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={split.amount}
                        onChange={(e) => handleSplitChange(index, e.target.value)}
                        className={`w-32 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-900 ${
                          split.excluded ? 'opacity-50' : ''
                        }`}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        disabled={splitType === 'equal' || split.excluded}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
            >
              {isSubmitting ? (initialExpense ? 'Updating...' : 'Adding...') : (initialExpense ? 'Update Expense' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal; 