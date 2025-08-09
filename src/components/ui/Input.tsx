import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const inputClass = `input ${error ? 'input-error' : ''} ${
    Icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''
  } ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 ${
              iconPosition === 'left' ? 'left-3' : 'right-3'
            }`}
          />
        )}
        <input className={inputClass} {...props} />
      </div>
      {error && (
        <p className="mt-1 text-sm text-error-400">{error}</p>
      )}
    </div>
  );
};

export default Input;