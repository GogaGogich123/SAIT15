import React from 'react';
import { motion } from 'framer-motion';
import { Target, Save, X, Award, BookOpen, Users, Star, TrendingUp, Trophy } from 'lucide-react';
import { Cadet } from '../../../lib/supabase';
import { updateCadetScoresAdmin } from '../../../lib/admin';
import { useToast } from '../../../hooks/useToast';

interface ScoreForm {
  cadetId: string;
  category: 'study' | 'discipline' | 'events';
  points: number;
  description: string;
}

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ScoreForm;
  setForm: (form: ScoreForm) => void;
  cadets: Cadet[];
  onSuccess?: () => void;
}

// Helper functions
const getCategoryColor = (category: 'study' | 'discipline' | 'events'): string => {
  switch (category) {
    case 'study':
      return 'from-blue-500 to-blue-700';
    case 'discipline':
      return 'from-red-500 to-red-700';
    case 'events':
      return 'from-green-500 to-green-700';
    default:
      return 'from-gray-500 to-gray-700';
  }
};

const getCategoryIcon = (category: 'study' | 'discipline' | 'events') => {
  switch (category) {
    case 'study':
      return BookOpen;
    case 'discipline':
      return Target;
    case 'events':
      return Users;
    default:
      return Trophy;
  }
};

const getCategoryName = (category: 'study' | 'discipline' | 'events'): string => {
  switch (category) {
    case 'study':
      return 'Учёба';
    case 'discipline':
      return 'Дисциплина';
    case 'events':
      return 'Мероприятия';
    default:
      return 'Неизвестно';
  }
};

const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  cadets,
  onSuccess
}) => {
  const { success, error: showError } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const selectedCadet = cadets.find(c => c.id === form.cadetId);

  const categories = [
    { 
      value: 'study', 
      label: 'Учёба', 
      icon: BookOpen, 
      color: 'from-blue-500 to-blue-700',
      description: 'Баллы за успехи в учебе'
    },
    { 
      value: 'discipline', 
      label: 'Дисциплина', 
      icon: Target, 
      color: 'from-red-500 to-red-700',
      description: 'Баллы за дисциплину и поведение'
    },
    { 
      value: 'events', 
      label: 'Мероприятия', 
      icon: Users, 
      color: 'from-green-500 to-green-700',
      description: 'Баллы за участие в мероприятиях'
    }
  ];

  const handleSubmit = async () => {
    if (!form.cadetId || !form.description.trim()) {
      showError('Заполните все обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      await updateCadetScoresAdmin(form.cadetId, form.category, form.points, form.description.trim());
      success(`Баллы успешно начислены кадету ${selectedCadet?.name}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding score:', error);
      showError('Ошибка начисления баллов');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        className="glass-effect rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500">
            <Award className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white text-shadow">Начислить баллы</h2>
            <p className="text-blue-200">Добавьте баллы кадету за достижения</p>
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Cadet Selection */}
          <div>
            <label className="block text-white font-bold text-lg mb-4">
              Кадет <span className="text-red-400">*</span>
            </label>
            <select
              value={form.cadetId}
              onChange={(e) => setForm({...form, cadetId: e.target.value})}
              className="input text-lg"
            >
              <option value="">Выберите кадета</option>
              {cadets.map(cadet => (
                <option key={cadet.id} value={cadet.id}>
                  {cadet.name} ({cadet.platoon} взвод) - {cadet.total_score} баллов
                </option>
              ))}
            </select>
            
            {/* Selected Cadet Preview */}
            {selectedCadet && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 glass-effect p-4 rounded-xl border border-blue-400/30"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedCadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                    alt={selectedCadet.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                  />
                  <div>
                    <h4 className="text-lg font-bold text-white">{selectedCadet.name}</h4>
                    <p className="text-blue-300">{selectedCadet.platoon} взвод • Рейтинг #{selectedCadet.rank}</p>
                    <p className="text-yellow-400 font-bold">Текущий балл: {selectedCadet.total_score}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Category Selection */}
          <div>
            <label className="block text-white font-bold text-lg mb-4">
              Категория <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.label
                    key={category.value}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`flex items-center space-x-3 p-6 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                      form.category === category.value
                        ? `bg-gradient-to-r ${category.color} border-transparent text-white shadow-lg`
                        : 'bg-white/5 border-white/20 hover:bg-white/10 text-white hover:border-white/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={form.category === category.value}
                      onChange={(e) => setForm({...form, category: e.target.value as any})}
                      className="sr-only"
                    />
                    <Icon className="h-6 w-6" />
                    <div>
                      <div className="font-bold text-lg">{category.label}</div>
                      <div className="text-sm opacity-80">{category.description}</div>
                    </div>
                  </motion.label>
                );
              })}
            </div>
          </div>
          
          {/* Points and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-bold text-lg mb-4">
                Количество баллов <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm({...form, points: parseInt(e.target.value) || 0})}
                  className="input text-lg text-center"
                  placeholder="0"
                  min="-100"
                  max="100"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <button
                  type="button"
                  onClick={() => setForm({...form, points: -5})}
                  className="text-red-400 hover:text-red-300 text-sm font-semibold"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setForm({...form, points: 1})}
                  className="text-green-400 hover:text-green-300 text-sm font-semibold"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setForm({...form, points: 5})}
                  className="text-green-400 hover:text-green-300 text-sm font-semibold"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => setForm({...form, points: 10})}
                  className="text-green-400 hover:text-green-300 text-sm font-semibold"
                >
                  +10
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-white font-bold text-lg mb-4">
                Новый общий балл
              </label>
              <div className="glass-effect p-4 rounded-xl border border-yellow-400/30">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-6 w-6 text-yellow-400" />
                  <span className="text-2xl font-black text-yellow-400">
                    {selectedCadet ? selectedCadet.total_score + form.points : form.points}
                  </span>
                  <span className="text-blue-300">баллов</span>
                </div>
                {form.points !== 0 && (
                  <div className={`text-sm font-bold mt-1 ${form.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {form.points > 0 ? '+' : ''}{form.points} к текущему баллу
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-white font-bold text-lg mb-4">
              Описание <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="input resize-none text-lg"
              rows={4}
              placeholder="За что начисляются/снимаются баллы..."
            />
            <div className="text-right text-blue-300 text-sm mt-2">
              {form.description.length}/500
            </div>
          </div>

          {/* Preview */}
          {form.cadetId && form.description.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-white/20 pt-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className="glass-effect p-6 rounded-xl border border-green-400/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(form.category)}`}>
                      {React.createElement(getCategoryIcon(form.category), { className: "h-5 w-5 text-white" })}
                    </div>
                    <div>
                      <div className="font-bold text-white">{selectedCadet?.name}</div>
                      <div className="text-blue-300">{getCategoryName(form.category)}</div>
                    </div>
                  </div>
                  <div className={`text-2xl font-black ${form.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {form.points >= 0 ? '+' : ''}{form.points}
                  </div>
                </div>
                <p className="text-blue-100">{form.description}</p>
                <p className="text-blue-400 text-sm mt-2">Сейчас</p>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-4 mt-8 pt-6 border-t border-white/20">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={submitting || !form.cadetId || !form.description.trim()}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-green-500/25 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-6 w-6" />
                <span>Начислить баллы</span>
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            disabled={submitting}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition-all duration-300 flex items-center space-x-2"
          >
            <X className="h-5 w-5" />
            <span>Отмена</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ScoreModal;