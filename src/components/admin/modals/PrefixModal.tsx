import React from 'react';
import { motion } from 'framer-motion';
import { Save, X, Crown } from 'lucide-react';

interface PrefixForm {
  name: string;
  display_name: string;
  description: string;
  color: string;
  sort_order: number;
}

interface PrefixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: PrefixForm;
  setForm: (form: PrefixForm) => void;
  isEditing: boolean;
}

const PrefixModal: React.FC<PrefixModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  isEditing
}) => {
  const colorOptions = [
    { value: 'from-red-600 to-red-800', label: 'Красный (Атаман)' },
    { value: 'from-blue-600 to-blue-800', label: 'Синий (ЗКВ)' },
    { value: 'from-green-600 to-green-800', label: 'Зеленый (Старшина)' },
    { value: 'from-purple-600 to-purple-800', label: 'Фиолетовый (Десятник)' },
    { value: 'from-yellow-600 to-yellow-800', label: 'Желтый (Урядник)' },
    { value: 'from-orange-600 to-orange-800', label: 'Оранжевый' },
    { value: 'from-cyan-600 to-cyan-800', label: 'Голубой' },
    { value: 'from-pink-600 to-pink-800', label: 'Розовый' }
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
        <div className="flex items-center space-x-3 mb-6">
          <Crown className="h-8 w-8 text-yellow-400" />
          <h2 className="text-3xl font-bold text-white">
            {isEditing ? 'Редактировать префикс' : 'Создать префикс'}
          </h2>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">
                Системное имя <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="input"
                placeholder="ataman"
                disabled={isEditing}
              />
              <p className="text-blue-300 text-sm mt-1">
                Используется в системе (только латинские буквы, без пробелов)
              </p>
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">
                Отображаемое имя <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({...form, display_name: e.target.value})}
                className="input"
                placeholder="Атаман"
              />
              <p className="text-blue-300 text-sm mt-1">
                Как будет отображаться перед именем кадета
              </p>
            </div>
          </div>

          <div>
            <label className="block text-white font-bold mb-2">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="input resize-none"
              rows={3}
              placeholder="Описание префикса и его значения"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">
                Цвет <span className="text-red-400">*</span>
              </label>
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
              <label className="block text-white font-bold mb-2">
                Порядок сортировки
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({...form, sort_order: parseInt(e.target.value) || 0})}
                className="input"
                min="0"
                placeholder="0"
              />
              <p className="text-blue-300 text-sm mt-1">
                Меньшее число = выше в списке
              </p>
            </div>
          </div>

          {/* Предварительный просмотр */}
          {form.display_name && (
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className={`glass-effect p-4 rounded-xl bg-gradient-to-r ${form.color}`}>
                <div className="flex items-center space-x-3">
                  <Crown className="h-6 w-6 text-white" />
                  <div>
                    <div className="text-xl font-bold text-white">
                      {form.display_name} Иванов Иван Иванович
                    </div>
                    <div className="text-white/80">{form.description}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={onSubmit}
            disabled={!form.name || !form.display_name}
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

export default PrefixModal;