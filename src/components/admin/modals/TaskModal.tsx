import React from 'react';
import { motion } from 'framer-motion';
import { Save, X, CheckSquare, Calendar, Users, AlertTriangle, Star } from 'lucide-react';

interface TaskForm {
  title: string;
  description: string;
  category: 'study' | 'discipline' | 'events';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  deadline: string;
  max_participants: number;
  abandon_penalty: number;
  status: 'active' | 'inactive';
  is_active: boolean;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: TaskForm;
  setForm: (form: TaskForm) => void;
  isEditing: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  isEditing
}) => {
  const categoryOptions = [
    { value: 'study', label: 'Учёба', color: 'from-blue-500 to-blue-700' },
    { value: 'discipline', label: 'Дисциплина', color: 'from-red-500 to-red-700' },
    { value: 'events', label: 'Мероприятия', color: 'from-green-500 to-green-700' }
  ];

  const difficultyOptions = [
    { value: 'easy', label: 'Легко', color: 'text-green-400 bg-green-400/20' },
    { value: 'medium', label: 'Средне', color: 'text-yellow-400 bg-yellow-400/20' },
    { value: 'hard', label: 'Сложно', color: 'text-red-400 bg-red-400/20' }
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
        className="glass-effect rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-6">
          <CheckSquare className="h-8 w-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">
            {isEditing ? 'Редактировать задание' : 'Создать задание'}
          </h2>
        </div>
        
        <div className="space-y-6">
          {/* Основная информация */}
          <div>
            <label className="block text-white font-bold mb-2">
              Название задания <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              className="input"
              placeholder="Написать эссе о истории казачества"
            />
          </div>

          <div>
            <label className="block text-white font-bold mb-2">
              Описание задания <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="input resize-none"
              rows={4}
              placeholder="Подробное описание задания, требования к выполнению..."
            />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-white font-bold mb-4">
              Категория <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categoryOptions.map((category) => (
                <motion.label
                  key={category.value}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`flex items-center justify-center p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
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
                  <span className="font-bold text-lg">{category.label}</span>
                </motion.label>
              ))}
            </div>
          </div>

          {/* Сложность и баллы */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-white font-bold mb-4">
                Сложность <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {difficultyOptions.map((difficulty) => (
                  <label
                    key={difficulty.value}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                      form.difficulty === difficulty.value
                        ? difficulty.color
                        : 'bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={difficulty.value}
                      checked={form.difficulty === difficulty.value}
                      onChange={(e) => setForm({...form, difficulty: e.target.value as any})}
                      className="sr-only"
                    />
                    <span className="font-semibold">{difficulty.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-bold mb-2">
                Баллы за выполнение <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm({...form, points: parseInt(e.target.value) || 0})}
                  className="input text-center"
                  min="1"
                  max="100"
                />
                <Star className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-400" />
              </div>
              <div className="flex justify-between mt-2">
                <button
                  type="button"
                  onClick={() => setForm({...form, points: 5})}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                >
                  5
                </button>
                <button
                  type="button"
                  onClick={() => setForm({...form, points: 10})}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                >
                  10
                </button>
                <button
                  type="button"
                  onClick={() => setForm({...form, points: 20})}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                >
                  20
                </button>
                <button
                  type="button"
                  onClick={() => setForm({...form, points: 50})}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                >
                  50
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white font-bold mb-2">
                Штраф за отказ
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.abandon_penalty}
                  onChange={(e) => setForm({...form, abandon_penalty: parseInt(e.target.value) || 0})}
                  className="input text-center"
                  min="0"
                  max="50"
                />
                <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-400" />
              </div>
              <p className="text-blue-300 text-sm mt-2">
                Баллы, которые будут сняты при отказе
              </p>
            </div>
          </div>

          {/* Дедлайн и участники */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">
                Дедлайн <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({...form, deadline: e.target.value})}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-white font-bold mb-2">
                Максимум участников
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.max_participants}
                  onChange={(e) => setForm({...form, max_participants: parseInt(e.target.value) || 0})}
                  className="input text-center"
                  min="0"
                  placeholder="0 = без ограничений"
                />
                <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
              </div>
              <p className="text-blue-300 text-sm mt-2">
                0 означает без ограничений
              </p>
            </div>
          </div>

          {/* Предварительный просмотр */}
          {form.title && form.description && (
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className="glass-effect p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-2">{form.title}</h4>
                    <p className="text-blue-200">{form.description}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="h-5 w-5" />
                      <span className="font-bold text-lg">{form.points}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      form.difficulty === 'easy' ? 'text-green-400 bg-green-400/20' :
                      form.difficulty === 'medium' ? 'text-yellow-400 bg-yellow-400/20' :
                      'text-red-400 bg-red-400/20'
                    }`}>
                      {form.difficulty === 'easy' ? 'Легко' : 
                       form.difficulty === 'medium' ? 'Средне' : 'Сложно'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-blue-300 text-sm">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>До {form.deadline && new Date(form.deadline).toLocaleDateString('ru-RU')}</span>
                  </div>
                  {form.max_participants > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>Макс. {form.max_participants} участников</span>
                    </div>
                  )}
                  {form.abandon_penalty > 0 && (
                    <div className="flex items-center space-x-1 text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Штраф: {form.abandon_penalty}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={onSubmit}
            disabled={!form.title || !form.description || !form.deadline}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>{isEditing ? 'Обновить задание' : 'Создать задание'}</span>
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

export default TaskModal;