import React from 'react';
import { motion } from 'framer-motion';
import { Save, X, Star, Trophy, Medal, Crown, Award, Target, Zap, Shield, Heart, BookOpen, Users, Flame, Sparkles } from 'lucide-react';

interface AchievementForm {
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
}

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: AchievementForm;
  setForm: (form: AchievementForm) => void;
  isEditing: boolean;
}

const AchievementModal: React.FC<AchievementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  isEditing
}) => {
  const iconOptions = [
    { value: 'Star', label: 'Звезда', icon: Star },
    { value: 'Trophy', label: 'Трофей', icon: Trophy },
    { value: 'Medal', label: 'Медаль', icon: Medal },
    { value: 'Crown', label: 'Корона', icon: Crown },
    { value: 'Award', label: 'Награда', icon: Award },
    { value: 'Target', label: 'Цель', icon: Target },
    { value: 'Zap', label: 'Молния', icon: Zap },
    { value: 'Shield', label: 'Щит', icon: Shield },
    { value: 'Heart', label: 'Сердце', icon: Heart },
    { value: 'BookOpen', label: 'Книга', icon: BookOpen },
    { value: 'Users', label: 'Команда', icon: Users },
    { value: 'Flame', label: 'Огонь', icon: Flame },
    { value: 'Sparkles', label: 'Искры', icon: Sparkles }
  ];

  const colorOptions = [
    { value: 'from-blue-500 to-blue-700', label: 'Синий' },
    { value: 'from-green-500 to-green-700', label: 'Зелёный' },
    { value: 'from-red-500 to-red-700', label: 'Красный' },
    { value: 'from-yellow-500 to-yellow-700', label: 'Жёлтый' },
    { value: 'from-purple-500 to-purple-700', label: 'Фиолетовый' },
    { value: 'from-pink-500 to-pink-700', label: 'Розовый' },
    { value: 'from-indigo-500 to-indigo-700', label: 'Индиго' },
    { value: 'from-orange-500 to-orange-700', label: 'Оранжевый' }
  ];

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
        className="glass-effect rounded-3xl max-w-2xl w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-white mb-6">
          {isEditing ? 'Редактировать достижение' : 'Создать достижение'}
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-white font-bold mb-2">Название</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              className="input"
              placeholder="Название достижения"
            />
          </div>
          
          <div>
            <label className="block text-white font-bold mb-2">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="input resize-none"
              rows={3}
              placeholder="Описание достижения"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white font-bold mb-2">Категория</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                className="input"
                placeholder="Категория"
              />
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">Иконка</label>
              <select
                value={form.icon}
                onChange={(e) => setForm({...form, icon: e.target.value})}
                className="input"
              >
                {iconOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">Цвет</label>
              <select
                value={form.color}
                onChange={(e) => setForm({...form, color: e.target.value})}
                className="input"
              >
                {colorOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={onSubmit}
            className="flex-1 btn-primary flex items-center justify-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>{isEditing ? 'Обновить' : 'Создать'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors flex items-center space-x-2"
          >
            <X className="h-5 w-5" />
            <span>Отмена</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AchievementModal;