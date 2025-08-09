import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  icon?: LucideIcon;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  icon: Icon,
  className = '',
}) => {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
  };

  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {children}
    </span>
  );
};

export default Badge;