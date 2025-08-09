import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Trophy, Target, FileText, CheckSquare } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'overview', name: 'Обзор', icon: BarChart3 },
    { key: 'cadets', name: 'Кадеты', icon: Users },
    { key: 'achievements', name: 'Достижения', icon: Trophy },
    { key: 'scores', name: 'Баллы', icon: Target },
    { key: 'news', name: 'Новости', icon: FileText },
    { key: 'tasks', name: 'Задания', icon: CheckSquare }
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap justify-center gap-4 mb-12"
    >
      {tabs.map(({ key, name, icon: Icon }) => (
        <motion.button
          key={key}
          variants={staggerItem}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onTabChange(key)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
            activeTab === key
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span>{name}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default AdminTabs;