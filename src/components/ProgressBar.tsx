import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  color = 'from-blue-500 to-purple-500',
  showPercentage = true,
  animated = true
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-medium">{label}</span>
          {showPercentage && (
            <span className="text-blue-300 text-sm">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 1.5 : 0, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between text-xs text-blue-300 mt-1">
        <span>{value}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default ProgressBar;