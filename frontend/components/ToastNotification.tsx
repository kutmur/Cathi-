import React, { useEffect } from 'react';
import { createContext, useState, useContext, ReactNode } from 'react';
import { ClientOnly } from './ClientOnly';

export type NotificationType = 'success' | 'error' | 'info';

interface ToastNotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, onClose, duration]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50 animate-fade-in">
      <div className={`${getTypeStyles()} border-l-4 p-4 rounded shadow-lg flex items-start`}>
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm">{message}</p>
        </div>
        <div className="ml-3">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Context for managing toasts across the application
interface ToastContextType {
  showToast: (type: NotificationType, message: string, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{
    type: NotificationType;
    message: string;
    isVisible: boolean;
    duration: number;
  }>({
    type: 'info',
    message: '',
    isVisible: false,
    duration: 5000,
  });

  const showToast = (type: NotificationType, message: string, duration = 5000) => {
    setToast({ type, message, isVisible: true, duration });
  };

  const hideToast = () => {
    setToast((prevToast) => ({ ...prevToast, isVisible: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ClientOnly>
        <ToastNotification
          type={toast.type}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={hideToast}
          duration={toast.duration}
        />
      </ClientOnly>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};