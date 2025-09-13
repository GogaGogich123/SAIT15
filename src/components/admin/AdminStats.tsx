import React from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, CheckSquare, TrendingUp } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface AdminStatsProps {
  analytics: {
    totalCadets: number;
    totalAchievements: number;
    totalTasks: number;
    realAverageScore: number;
    avgScores: Array<{
      study: number;
      discipline: number;
      events: number;
    }>;
  };
}

const AdminStats: React.FC<AdminStatsProps> = ({ analytics }) => {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={staggerItem} className="card-gradient from-blue-600 to-blue-800 p-6 rounded-2xl">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-white" />
            <div>
              <div className="text-3xl font-black text-white">{analytics.totalCadets}</div>
              <div className="text-blue-200">Кадетов</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={staggerItem} className="card-gradient from-green-600 to-green-800 p-6 rounded-2xl">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-white" />
            <div>
              <div className="text-3xl font-black text-white">{analytics.totalAchievements}</div>
              <div className="text-green-200">Достижений</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={staggerItem} className="card-gradient from-purple-600 to-purple-800 p-6 rounded-2xl">
          <div className="flex items-center space-x-3">
            <CheckSquare className="h-8 w-8 text-white" />
            <div>
              <div className="text-3xl font-black text-white">{analytics.totalTasks}</div>
              <div className="text-purple-200">Заданий</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={staggerItem} className="card-gradient from-yellow-600 to-yellow-800 p-6 rounded-2xl">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-white" />
            <div>
              <div className="text-3xl font-black text-white">{analytics.realAverageScore}</div>
              <div className="text-yellow-200">Средний балл</div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Дополнительная статистика по категориям */}
      {analytics.avgScores.length > 0 && analytics.avgScores[0] && (
        <motion.div variants={staggerItem} className="mt-8">
          <h3 className="text-2xl font-bold text-white mb-6">Средние баллы по категориям</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-gradient from-blue-600 to-blue-800 p-6 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <span className="text-white font-bold">📚</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{analytics.avgScores[0].study}</div>
                  <div className="text-blue-200">Учёба</div>
                </div>
              </div>
            </div>
            
            <div className="card-gradient from-red-600 to-red-800 p-6 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <span className="text-white font-bold">🎯</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{analytics.avgScores[0].discipline}</div>
                  <div className="text-red-200">Дисциплина</div>
                </div>
              </div>
            </div>
            
            <div className="card-gradient from-green-600 to-green-800 p-6 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <span className="text-white font-bold">🎪</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{analytics.avgScores[0].events}</div>
                  <div className="text-green-200">Мероприятия</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminStats;