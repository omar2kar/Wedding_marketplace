import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  useEffect(() => {
    const handleClick = () => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg max-w-md w-full mx-4 transition-all duration-300 ease-in-out bg-white border";
    
    if (!isVisible) {
      return `${baseStyles} -translate-y-full opacity-0`;
    }

    switch (type) {
      case 'success':
        return `${baseStyles} border-green-200`;
      case 'error':
        return `${baseStyles} border-red-200`;
      case 'warning':
        return `${baseStyles} border-yellow-200`;
      case 'info':
        return `${baseStyles} border-blue-200`;
      default:
        return `${baseStyles} border-gray-200`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={getToastStyles()} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-3">
        <span className={`text-xl ${getIconColor()}`}>{getIcon()}</span>
        <div className="flex-1">
          <p className="font-medium text-gray-800">{message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
