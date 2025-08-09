import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'hover' | 'gradient';
  gradient?: string;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  gradient,
  className = '',
  onClick,
  animate = true,
}) => {
  const baseClasses = {
    default: 'card',
    hover: 'card-hover',
    gradient: `card-gradient ${gradient || 'from-primary-600 to-primary-800'}`,
  };

  const cardClass = `${baseClasses[variant]} ${className}`;

  const MotionComponent = animate ? motion.div : 'div';
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        whileHover: onClick ? { y: -5 } : undefined,
      }
    : {};

  return (
    <MotionComponent
      className={cardClass}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...motionProps}
    >
      {children}
    </MotionComponent>
  );
};

export default Card;