import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Trophy, Target, FileText, CheckSquare, Calendar, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, onTabChange }) => {
  const { hasPermission, isSuperAdmin } = useAuth();
  
  const tabs = [
    { key: 'overview', name: 'Обзор', icon: BarChart3 },
    { key: 'admins', name: 'Администраторы', icon: Users, permission: 'manage_admins' },
    { key: 'cadets', name: 'Кадеты', icon: Users, permission: 'manage_cadets' },
    { key: 'achievements', name: 'Достижения', icon: Trophy, permission: 'manage_achievements' },
    { key: 'scores', name: 'Управление баллами', icon: Target, permission: 'manage_scores' },
    { key: 'news', name: 'Новости', icon: FileText, permission: 'manage_news' },
    { key: 'tasks', name: 'Задания', icon: CheckSquare, permission: 'manage_tasks' },
    { key: 'events', name: 'События', icon: Calendar, permission: 'manage_events' },
    { key: 'data-management', name: 'Управление данными', icon: Database, permission: 'system_reset' }
  ];

  // Фильтруем вкладки по разрешениям
  const visibleTabs = tabs.filter(tab => {
    if (tab.key === 'overview') return true; // Обзор доступен всем админам
    if (tab.key === 'admins') return isSuperAdmin; // Управление админами только для главных админов
    if (tab.key === 'scores') {
      // Управление баллами доступно если есть хотя бы одно из разрешений
      return hasPermission('manage_scores_study') || 
             hasPermission('manage_scores_discipline') || 
             hasPermission('manage_scores_events');
    }
    return !tab.permission || hasPermission(tab.permission);
  });

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap justify-center gap-4 mb-12"
    >
      {visibleTabs.map(({ key, name, icon: Icon }) => (
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