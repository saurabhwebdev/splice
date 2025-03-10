import { useState } from 'react';

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

const CollapsibleCard = ({ 
  title, 
  subtitle, 
  defaultExpanded = true, 
  children, 
  className = "" 
}: CollapsibleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-white rounded-2xl shadow-[0_0_50px_0_rgba(0,0,0,0.05)] hover:shadow-[0_0_50px_0_rgba(0,0,0,0.08)] transition-all duration-300 ${className}`}>
      {/* Card Header - Always visible */}
      <div 
        className="flex items-center justify-between p-4 md:p-6 cursor-pointer md:cursor-default"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <button 
          className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <svg 
            className={`w-6 h-6 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Card Content - Collapsible on mobile */}
      <div 
        className={`
          overflow-hidden transition-all duration-200 ease-in-out
          ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'}
        `}
      >
        <div className="p-4 md:p-6 pt-0 md:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleCard; 