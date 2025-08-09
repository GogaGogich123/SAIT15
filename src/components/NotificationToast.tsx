import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationToastProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onRemove }) => {
  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      case 'info': return Info;
    }
  };

  const getColors = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'from-green-600 to-green-700 border-green-500';
      case 'error': return 'from-red-600 to-red-700 border-red-500';
      case 'info': return 'from-blue-600 to-blue-700 border-blue-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = getIcon(toast.type);
          const colors = getColors(toast.type);

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              className={`bg-gradient-to-r ${colors} border backdrop-blur-sm rounded-lg p-4 shadow-2xl max-w-sm`}
            >
              <div className="flex items-start space-x-3">
                <Icon className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                <div className="flex-grow">
                  <h4 className="text-white font-semibold">{toast.title}</h4>
                  {toast.message && (
                    <p className="text-white/90 text-sm mt-1">{toast.message}</p>
                  )}
                </div>
                <button
                  onClick={() => onRemove(toast.id)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;