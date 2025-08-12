import React from 'react';
import { motion } from 'framer-motion';
import { Save, X, MessageSquare, BookOpen, Trophy, Shield, Lightbulb, Users, Target, Heart, Star } from 'lucide-react';

interface ForumCategoryForm {
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

interface ForumCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: ForumCategoryForm;
  setForm: (form: ForumCategoryForm) => void;
  isEditing: boolean;
}

const ForumCategoryModal: React.FC<ForumCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  isEditing
}) => {
  const iconOptions = [
    { value: 'MessageSquare', label: 'Сообщение', icon: MessageSquare },
    { value: 'BookOpen', label: 'Книга', icon: BookOpen },
    { value: 'Trophy', label: 'Трофей', icon: Trophy },
    { value: 'Shield', label: 'Щит', icon: Shield },
    { value: 'Lightbulb', label: 'Лампочка', icon: Lightbulb },
    { value: 'Users', label: 'Пользователи', icon: Users },
    { value: 'Target', label: 'Цель', icon: Target },
    { value: 'Heart', label: 'Сердце', icon: Heart },
    { value: 'Star', label: 'Звезда', icon: Star }
  ];

  const colorOptions = [
    { value: 'from-blue-500 to-blue-700', label: 'Синий' },
    { value: 'from-green-500 to-green-700', label: 'Зелёный' },
    { value: 'from-red-500 to-red-700', label: 'Красный' },
    { value: 'from-yellow-500 to-yellow-700', label: 'Жёлтый' },
    { value: 'from-purple-500 to-purple-700', label: 'Фиолетовый' },
    { value: 'from-pink-500 to-pink-700', label: 'Розовый' },
    { value: 'from-indigo-500 to-indigo-700', label: 'Индиго' },
    { value: 'from-orange-500 to-orange-700', label: 'Оранжевый' },
    { value: 'from-cyan-500 to-cyan-700', label: 'Голубой' },
    { value: 'from-gray-500 to-gray-700', label: 'Серый' }
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
          {isEditing ? 'Редактировать категорию' : 'Создать категорию'}
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-white font-bold mb-2">
              Название <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="input"
              placeholder="Название категории"
              maxLength={100}
            />
          </div>
          
          <div>
            <label className="block text-white font-bold mb-2">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="input resize-none"
              rows={3}
              placeholder="Описание категории (необязательно)"
              maxLength={500}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            <div>
              <label className="block text-white font-bold mb-2">Порядок</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({...form, sort_order: parseInt(e.target.value) || 0})}
                className="input"
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({...form, is_active: e.target.checked})}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-white font-bold">
              Активная категория
            </label>
          </div>

          {/* Preview */}
          {form.name && (
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className={`p-6 rounded-xl bg-gradient-to-r ${form.color}`}>
                <div className="flex items-center space-x-3">
                  {React.createElement(iconOptions.find(i => i.value === form.icon)?.icon || MessageSquare, {
                    className: "h-6 w-6 text-white"
                  })}
                  <div>
                    <h4 className="text-xl font-bold text-white">{form.name}</h4>
                    {form.description && (
                      <p className="text-white/90">{form.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={onSubmit}
            disabled={!form.name.trim()}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ForumCategoryModal;