import { useCallback } from 'react';

interface ToastFunctions {
  success: (message: string) => void;
  error: (message: string) => void;
}

export const useToast = (): ToastFunctions => {
  const success = useCallback((message: string) => {
    // Simple implementation using browser alert
    // In a production app, this would integrate with a toast library
    alert(`✅ ${message}`);
  }, []);

  const error = useCallback((message: string) => {
    // Simple implementation using browser alert
    // In a production app, this would integrate with a toast library
    alert(`❌ ${message}`);
  }, []);

  return {
    success,
    error
  };
};