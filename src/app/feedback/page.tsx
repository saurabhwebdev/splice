'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { motion } from 'framer-motion';

interface FeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  message: string;
  email: string | null;
  createdAt: Timestamp;
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
    
    // Add scroll animation observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    document.querySelectorAll('.feedback-item').forEach((item) => {
      observer.observe(item);
    });
    
    return () => {
      document.querySelectorAll('.feedback-item').forEach((item) => {
        observer.unobserve(item);
      });
    };
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const feedbackQuery = query(
        collection(db, 'feedback'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(feedbackQuery);
      const feedbackData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FeedbackItem[];
      
      setFeedback(feedbackData);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = filter === 'all' 
    ? feedback 
    : feedback.filter(item => item.type === filter);

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug':
        return 'from-red-500 to-red-600 text-white';
      case 'feature':
        return 'from-purple-500 to-purple-600 text-white';
      case 'improvement':
        return 'from-blue-500 to-blue-600 text-white';
      default:
        return 'from-gray-500 to-gray-600 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'feature':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'improvement':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Community Feedback
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover what our users are saying and the features they're requesting
            </p>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -bottom-6 left-0 right-0 h-12 bg-white" style={{ 
          clipPath: 'polygon(0 0, 100% 100%, 100% 100%, 0% 100%)' 
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Controls with Micro-interactions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Filter by category</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All Feedback
            </button>
            <button
              onClick={() => setFilter('bug')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center ${
                filter === 'bug'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              {getTypeIcon('bug')}
              Bugs
            </button>
            <button
              onClick={() => setFilter('feature')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center ${
                filter === 'feature'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              {getTypeIcon('feature')}
              Feature Requests
            </button>
            <button
              onClick={() => setFilter('improvement')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center ${
                filter === 'improvement'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              {getTypeIcon('improvement')}
              Improvements
            </button>
            <button
              onClick={() => setFilter('other')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center ${
                filter === 'other'
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
              }`}
            >
              {getTypeIcon('other')}
              Other
            </button>
          </div>
        </motion.div>

        {/* Feedback List with Scroll Animations */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="relative h-16 w-16">
              <div className="absolute top-0 left-0 h-16 w-16 animate-ping rounded-full bg-indigo-400 opacity-75"></div>
              <div className="relative h-16 w-16 animate-spin rounded-full border-4 border-solid border-gray-200 border-t-indigo-600"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-50 border border-gray-100 rounded-xl p-12 text-center shadow-sm"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">No feedback found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {filter === 'all' 
                ? 'There are no feedback submissions yet. Be the first to share your thoughts!' 
                : `There are no ${filter} feedback submissions yet.`}
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:gap-8">
            {filteredFeedback.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="feedback-item bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transform transition-all duration-300 hover:shadow-md"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${getTypeColor(item.type)} flex items-center shadow-sm`}>
                        {getTypeIcon(item.type)}
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed">{item.message}</p>
                  </div>
                  {item.email && (
                    <div className={`flex items-center text-sm text-gray-500 transition-all duration-300 ${hoveredItem === item.id ? 'opacity-100' : 'opacity-70'}`}>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a 
                        href={`mailto:${item.email}`} 
                        className="hover:text-indigo-600 transition-colors underline-offset-2 hover:underline"
                      >
                        {item.email}
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CSS for grid pattern */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
} 