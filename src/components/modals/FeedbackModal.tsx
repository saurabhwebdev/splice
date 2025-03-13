import { useState, useEffect } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: FeedbackType;
}

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

const FeedbackModal = ({ isOpen, onClose, initialType = 'improvement' }: FeedbackModalProps) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialType);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'share'>('form');
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFeedbackType(initialType);
      setMessage('');
      setEmail('');
      setShowSuccess(false);
      setActiveTab('form');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmitToFirebase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        type: feedbackType,
        message: message.trim(),
        email: email.trim() || null,
        createdAt: new Date(),
      });

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailFeedback = () => {
    const subject = encodeURIComponent('Splice Feedback');
    const body = encodeURIComponent(`Type: ${feedbackType}\n\n${message}`);
    window.open(`mailto:feedback@splice.com?subject=${subject}&body=${body}`, '_blank');
  };

  const handleWhatsAppFeedback = () => {
    const text = encodeURIComponent(`*Splice Feedback*\nType: ${feedbackType}\n\n${message}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case 'bug':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'feature':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'improvement':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
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
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors z-10"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Share Your Feedback</h2>
              <p className="text-sm text-gray-600">
                Help us improve by sharing your thoughts or reporting issues
              </p>
            </div>

            {/* Tabs */}
            <div className="px-6 mb-4">
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setActiveTab('form')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'form'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Submit
                </button>
                <button
                  onClick={() => setActiveTab('share')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'share'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Share
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 overflow-y-auto flex-1">
              {activeTab === 'form' ? (
                <form onSubmit={handleSubmitToFirebase} className="space-y-5">
                  {/* Feedback Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['improvement', 'feature', 'bug', 'other'] as FeedbackType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFeedbackType(type)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all ${
                            feedbackType === type
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {getTypeIcon(type)}
                          <span className="text-sm font-medium capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message
                    </label>
                    <textarea
                      id="feedback-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 resize-none"
                      placeholder="Tell us what's on your mind..."
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Email (optional)
                    </label>
                    <input
                      id="feedback-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="We'll contact you if we need more information"
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-4 py-2">
                  <p className="text-sm text-gray-600 mb-4">
                    Share your feedback through other channels:
                  </p>
                  
                  <button
                    onClick={handleEmailFeedback}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Send via Email</span>
                  </button>
                  
                  <button
                    onClick={handleWhatsAppFeedback}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span className="font-medium">Share via WhatsApp</span>
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-6 border-t border-gray-100">
              {activeTab === 'form' && (
                <button
                  type="button"
                  onClick={handleSubmitToFirebase}
                  disabled={isSubmitting || !message.trim() || showSuccess}
                  className="w-full px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-500 hover:to-indigo-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : showSuccess ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Submitted!</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Feedback</span>
                      <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal; 