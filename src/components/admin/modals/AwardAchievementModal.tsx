import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Save, X, Trophy, Star, Medal, Crown, Award, Target, Zap, Shield, Heart, BookOpen, Users, Flame, Sparkles } from 'lucide-react';
import { Cadet, Achievement } from '../../../lib/supabase';

interface AwardAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cadetId: string, achievementId: string) => void;
  cadets: Cadet[];
  achievements: Achievement[];
  loading?: boolean;
}

const AwardAchievementModal: React.FC<AwardAchievementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cadets,
  achievements,
  loading = false
}) => {
  const [selectedCadetId, setSelectedCadetId] = useState('');
  const [selectedAchievementId, setSelectedAchievementId] = useState('');

  const selectedCadet = cadets.find(c => c.id === selectedCadetId);
  const selectedAchievement = achievements.find(a => a.id === selectedAchievementId);

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Star, Trophy, Medal, Crown, Award, Target, Zap, Shield, Heart, BookOpen, Users, Flame, Sparkles
    };
    return icons[iconName] || Star;
  };

  const handleSubmit = () => {
    if (selectedCadetId && selectedAchievementId) {
      onSubmit(selectedCadetId, selectedAchievementId);
      setSelectedCadetId('');
      setSelectedAchievementId('');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-effect rounded-3xl max-w-3xl w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-6">
          <Gift className="h-8 w-8 text-yellow-400" />
          <h2 className="text-3xl font-bold text-white">Присудить достижение</h2>
        </div>
        
        <div className="space-y-6">
          {/* Выбор кадета */}
          <div>
            <label className="block text-white font-bold mb-2">
              Кадет <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedCadetId}
              onChange={(e) => setSelectedCadetId(e.target.value)}
              className="input"
            >
              <option value="">Выберите кадета</option>
              {cadets.map(cadet => (
                <option key={cadet.id} value={cadet.id}>
                  {cadet.name} ({cadet.platoon} взвод) - {cadet.total_score} баллов
                </option>
              ))}
            </select>
            
            {/* Предварительный просмотр выбранного кадета */}
            {selectedCadet && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 glass-effect p-4 rounded-xl border border-blue-400/30"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-grow">
                    {/* Префиксы */}
                    {selectedCadet.display_name && selectedCadet.display_name !== selectedCadet.name && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-gradient-to-r from-red-600 to-red-800 text-white text-xs font-bold shadow-md border border-white/20">
                          <Crown className="h-3 w-3" />
                          <span>Атаман</span>
                        </div>
                      </div>
                    )}
                    
                    <h3 className="text-2xl font-bold text-white">{selectedCadet.name}</h3>
                    <p className="text-blue-300">{selectedCadet.platoon} взвод, {selectedCadet.squad} отделение</p>
                    <p className="text-yellow-400 font-bold">Рейтинг: #{selectedCadet.rank}</p>
                  </div>
                  <img
                    src={selectedCadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                    alt={selectedCadet.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Выбор достижения */}
          <div>
            <label className="block text-white font-bold mb-2">
              Достижение <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
              {achievements.map((achievement) => {
                const IconComponent = getIconComponent(achievement.icon);
                return (
                  <motion.label
                    key={achievement.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`flex items-start space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                      selectedAchievementId === achievement.id
                        ? `bg-gradient-to-r ${achievement.color} border-transparent text-white shadow-lg`
                        : 'bg-white/5 border-white/20 hover:bg-white/10 text-white hover:border-white/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="achievement"
                      value={achievement.id}
                      checked={selectedAchievementId === achievement.id}
                      onChange={(e) => setSelectedAchievementId(e.target.value)}
                      className="sr-only"
                    />
                    <IconComponent className="h-6 w-6 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-bold text-lg">{achievement.title}</div>
                      <div className="text-sm opacity-80">{achievement.description}</div>
                      <div className="text-xs opacity-60 mt-1">Категория: {achievement.category}</div>
                    </div>
                  </motion.label>
                );
              })}
            </div>
          </div>

          {/* Предварительный просмотр */}
          {selectedCadet && selectedAchievement && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-white/20 pt-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className={`glass-effect p-6 rounded-xl bg-gradient-to-r ${selectedAchievement.color}`}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    {React.createElement(getIconComponent(selectedAchievement.icon), { className: "h-8 w-8 text-white" })}
                    <div>
                      <h4 className="text-xl font-bold text-white">{selectedAchievement.title}</h4>
                      <p className="text-white/90">{selectedAchievement.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white font-semibold">
                    Будет присуждено кадету: <span className="font-bold">{selectedCadet.name}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedCadetId || !selectedAchievementId}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Gift className="h-5 w-5" />
                <span>Присудить достижение</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
            <span>Отмена</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AwardAchievementModal;