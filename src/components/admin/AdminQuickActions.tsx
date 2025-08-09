import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Gift, Target, FileText, UserPlus } from 'lucide-react';
import { staggerItem } from '../../utils/animations';

interface AdminQuickActionsProps {
  onCreateAchievement: () => void;
  onAwardAchievement: () => void;
  onAddScore: () => void;
  onCreateNews: () => void;
  onCreateCadet: () => void;
}

const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({
  onCreateAchievement,
  onAwardAchievement,
  onAddScore,
  onCreateNews,
  onCreateCadet
}) => {
  return (
    <motion.div variants={staggerItem} className="card-hover p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Быстрые действия</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          onClick={onCreateCadet}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Добавить кадета</span>
        </button>
        
        <button
          onClick={onCreateAchievement}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Создать достижение</span>
        </button>
        
        <button
          onClick={onAwardAchievement}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2"
        >
          <Gift className="h-5 w-5" />
          <span>Присудить награду</span>
        </button>
        
        <button
          onClick={onAddScore}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2"
        >
          <Target className="h-5 w-5" />
          <span>Начислить баллы</span>
        </button>
        
        <button
          onClick={onCreateNews}
          className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2"
        >
          <FileText className="h-5 w-5" />
          <span>Создать новость</span>
        </button>
      </div>
    </motion.div>
  );
};

export default AdminQuickActions;