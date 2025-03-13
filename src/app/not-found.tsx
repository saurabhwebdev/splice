'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import FeedbackModal from '@/components/modals/FeedbackModal';

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  // Track mouse position for the parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Calculate parallax movement based on mouse position
  const calculateMovement = (factor: number = 0.02) => {
    const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
    const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;
    
    const moveX = (mousePosition.x - centerX) * factor;
    const moveY = (mousePosition.y - centerY) * factor;
    
    return { x: moveX, y: moveY };
  };
  
  // Animated shapes for the background
  const shapes = [
    { color: 'from-indigo-500 to-blue-500', size: 'w-64 h-64', initialPosition: { x: -100, y: -100 } },
    { color: 'from-purple-500 to-pink-500', size: 'w-48 h-48', initialPosition: { x: 200, y: -150 } },
    { color: 'from-blue-500 to-teal-500', size: 'w-56 h-56', initialPosition: { x: 150, y: 200 } },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)}
        initialType="bug"
      />
      
      {/* Animated background shapes */}
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full bg-gradient-to-br ${shape.color} opacity-10 blur-3xl ${shape.size}`}
          initial={{ ...shape.initialPosition, opacity: 0 }}
          animate={{ 
            x: shape.initialPosition.x + calculateMovement(0.1).x,
            y: shape.initialPosition.y + calculateMovement(0.1).y,
            opacity: 0.2,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 z-0"></div>
      
      {/* Content container */}
      <div className="relative z-10 max-w-3xl px-6 py-16 text-center">
        {/* 404 Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 tracking-tight leading-none">
            404
          </h1>
        </motion.div>
        
        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Page not found
          </h2>
          <p className="text-xl text-gray-600 max-w-lg mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </motion.div>
        
        {/* Interactive illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12 relative"
        >
          <div className="w-64 h-64 mx-auto relative">
            <motion.div 
              className="absolute inset-0"
              animate={{ 
                x: calculateMovement(0.05).x,
                y: calculateMovement(0.05).y,
              }}
              transition={{ type: "spring", stiffness: 50 }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <path 
                  fill="url(#gradient)" 
                  d="M47.7,-57.2C59.5,-45.8,65.8,-28.6,68.2,-11.1C70.6,6.4,69.1,24.2,60.5,37.8C51.9,51.3,36.2,60.6,19.2,66.2C2.2,71.8,-16.1,73.7,-30.3,66.7C-44.6,59.7,-54.8,43.7,-61.7,26.5C-68.6,9.3,-72.2,-9.2,-66.8,-24.4C-61.3,-39.7,-46.9,-51.7,-31.8,-62C-16.7,-72.2,-0.9,-80.7,13.8,-77.8C28.5,-74.9,35.9,-68.6,47.7,-57.2Z" 
                  transform="translate(100 100)" 
                />
              </svg>
            </motion.div>
            
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              animate={{ 
                x: calculateMovement(-0.03).x,
                y: calculateMovement(-0.03).y,
              }}
              transition={{ type: "spring", stiffness: 50 }}
            >
              <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link 
            href="/"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="relative px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 group"
          >
            <span className="relative z-10 flex items-center justify-center">
              Go Home
              <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
          </Link>
          
          <button 
            onClick={() => setIsFeedbackModalOpen(true)}
            className="px-8 py-3 bg-gray-100 text-gray-800 font-medium rounded-full hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            <span>Report Issue</span>
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
        </motion.div>
      </div>
      
      {/* CSS for grid pattern */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
} 