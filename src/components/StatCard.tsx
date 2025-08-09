import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  value, 
  label, 
  color, 
  trend
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="text-center group hover-lift"
    >
      <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br ${color} transition-transform duration-300 shadow-lg group-hover:shadow-2xl hover-glow`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
      <div className="text-3xl font-display font-bold text-white mb-2 text-shadow">
        {value}
      </div>
      <div className="text-primary-100 font-medium">
        {label}
      </div>
      {trend && (
        <div
          className={`flex items-center justify-center text-sm mt-2 ${
            trend.isPositive ? 'text-success-400' : 'text-error-400'
          }`}
        >
          {trend.isPositive ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {trend.isPositive ? '+' : ''}{trend.value}%
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;