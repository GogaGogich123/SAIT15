import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Star, Crown, Shield, Users, BookOpen, Calendar, Trophy, Heart, Target, Award } from 'lucide-react';
import {
  createCouncilPosition,
  updateCouncilPosition,
  deleteCouncilPosition,
  type CouncilPosition
} from '../../lib/council';

interface CouncilPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: CouncilPosition | null;
  isEditing: boolean;
  onSuccess: () => void;
}

const CouncilPositionModal: React.FC<CouncilPositionModalProps> = ({
  isOpen,
  onClose,
  position,
  isEditing,
  onSuccess
}) => {
  const [form, setForm] = useState({
    name: '',
    display_name: '',
    description: '',
    level: 3,
    color: 'from-blue-500 to-blue-700',
    icon: 'Star',
    sort_order: 0
  });
  const [submitting, setSubmitting] = useState(false);

  const iconOptions = [
    { value: 'Crown', label: 'Корона', icon: Crown },
    { value: 'Shield', label: 'Щит', icon: Shield },
    { value: 'Star', label: 'Звезда', icon: Star },
    { value: 'Users', label: 'Команда', icon: Users },
    { value: 'BookOpen', label: 'Книга', icon: BookOpen },
    { value: 'Calendar', label: 'Календарь', icon: Calendar },
    { value: 'Trophy', label: 'Трофей', icon: Trophy },
    { value: 'Heart', label: 'Сердце', icon: Heart },
    { value: 'Target', label: 'Цель', icon: Target },
    { value: 'Award', label: 'Награда', icon: Award }
  ];

  const colorOptions = [
    { value: 'from-red-600 to-red-800', label: 'Красный' },
    { value: 'from-blue-600 to-blue-800', label: 'Синий' },
    { value: 'from-green-600 to-green-800', label: 'Зеленый' },
    { value: 'from-purple-600 to-purple-800', label: 'Фиолетовый' },
    { value: 'from-yellow-600 to-yellow-800', label: 'Желтый' },
    { value: 'from-orange-600 to-orange-800', label: 'Оранжевый' },
    { value: 'from-cyan-600 to-cyan-800', label: 'Голубой' },
    { value: 'from-pink-600 to-pink-800', label: 'Розовый' }
  ];

  const levelOptions = [
    { value: 0, label: 'Атаман (высший уровень)' },
    { value: 1, label: 'Заместитель атамана' },
    { value: 2, label: 'Командир штаба' },
    { value: 3, label: 'Член штаба' }
  ];

  useEffect(() => {
    if (position && isEditing) {
      setForm({
        name: position.name,
        display_name: position.display_name,
        description: position.description || '',
        level: position.level,
        color: position.color,
        icon: position.icon,
        sort_order: position.sort_order
      });
    } else {
      setForm({
        name: '',
        display_name: '',
        description: '',
        level: 3,
        color: 'from-blue-500 to-blue-700',
        icon: 'Star',
        sort_order: 0
      });
    }
  }, [position, isEditing, isOpen]);

  const handleSubmit = async () => {
    if (!form.name || !form.display_name) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      
      if (isEditing && position) {
        await updateCouncilPosition(position.id, form);
        alert('Должность обновлена');
      } else {
        await createCouncilPosition(form);
        alert('Должность создана');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error with council position:', error);
      alert('Ошибка при работе с должностью');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!position || !confirm('Вы уверены, что хотите удалить эту должность?')) return;

    try {
      setSubmitting(true);
      await deleteCouncilPosition(position.id);
      alert('Должность удалена');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting position:', error);
      alert('Ошибка удаления должности');
    } finally {
      setSubmitting(false);
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
        className="glass-effect rounded-3xl max-w-2xl w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-6">
          <Star className="h-8 w-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">
            {isEditing ? 'Редактировать должность' : 'Создать должность'}
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
                placeholder="staff_deputy"
                disabled={isEditing}
              />
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
                placeholder="Заместитель командира штаба"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-bold mb-2">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="input resize-none"
              rows={3}
              placeholder="Описание должности и обязанностей"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">
                Уровень <span className="text-red-400">*</span>
              </label>
              <select
                value={form.level}
                onChange={(e) => setForm({...form, level: parseInt(e.target.value)})}
                className="input"
              >
                {levelOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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

          {/* Предварительный просмотр */}
          {form.display_name && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-white/20 pt-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className={`glass-effect p-4 rounded-xl bg-gradient-to-r ${form.color}`}>
                <div className="flex items-center space-x-3">
                  {React.createElement(iconOptions.find(i => i.value === form.icon)?.icon || Star, { 
                    className: "h-6 w-6 text-white" 
                  })}
                  <div>
                    <div className="text-lg font-bold text-white">{form.display_name}</div>
                    <div className="text-white/80 text-sm">{form.description}</div>
                    <div className="text-white/60 text-xs">
                      Уровень: {levelOptions.find(l => l.value === form.level)?.label}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.name || !form.display_name}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{isEditing ? 'Обновить' : 'Создать'}</span>
              </>
            )}
          </button>
          
          {isEditing && (
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5" />
              <span>Удалить</span>
            </button>
          )}
          
          <button
            onClick={onClose}
            disabled={submitting}
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

export default CouncilPositionModal;