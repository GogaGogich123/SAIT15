import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Users, BookOpen, Calendar, Trophy, Heart, Target, Award, Shield, Star, Trash2 } from 'lucide-react';
import {
  createCouncilStaff,
  updateCouncilStaff,
  deleteCouncilStaff,
  type CouncilStaff
} from '../../lib/council';

interface CouncilStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: CouncilStaff | null;
  isEditing: boolean;
  onSuccess: () => void;
}

const CouncilStaffModal: React.FC<CouncilStaffModalProps> = ({
  isOpen,
  onClose,
  staff,
  isEditing,
  onSuccess
}) => {
  const [form, setForm] = useState({
    name: '',
    display_name: '',
    description: '',
    color: 'from-green-500 to-green-700',
    icon: 'Users',
    sort_order: 0
  });
  const [submitting, setSubmitting] = useState(false);

  const iconOptions = [
    { value: 'Users', label: 'Команда', icon: Users },
    { value: 'BookOpen', label: 'Образование', icon: BookOpen },
    { value: 'Calendar', label: 'Мероприятия', icon: Calendar },
    { value: 'Trophy', label: 'Спорт', icon: Trophy },
    { value: 'Heart', label: 'Культура', icon: Heart },
    { value: 'Target', label: 'Дисциплина', icon: Target },
    { value: 'Award', label: 'Достижения', icon: Award },
    { value: 'Shield', label: 'Безопасность', icon: Shield },
    { value: 'Star', label: 'Лидерство', icon: Star }
  ];

  const colorOptions = [
    { value: 'from-blue-600 to-blue-800', label: 'Синий' },
    { value: 'from-green-600 to-green-800', label: 'Зеленый' },
    { value: 'from-red-600 to-red-800', label: 'Красный' },
    { value: 'from-purple-600 to-purple-800', label: 'Фиолетовый' },
    { value: 'from-yellow-600 to-yellow-800', label: 'Желтый' },
    { value: 'from-orange-600 to-orange-800', label: 'Оранжевый' },
    { value: 'from-cyan-600 to-cyan-800', label: 'Голубой' },
    { value: 'from-pink-600 to-pink-800', label: 'Розовый' }
  ];

  useEffect(() => {
    if (staff && isEditing) {
      setForm({
        name: staff.name,
        display_name: staff.display_name,
        description: staff.description || '',
        color: staff.color,
        icon: staff.icon,
        sort_order: staff.sort_order
      });
    } else {
      setForm({
        name: '',
        display_name: '',
        description: '',
        color: 'from-green-500 to-green-700',
        icon: 'Users',
        sort_order: 0
      });
    }
  }, [staff, isEditing, isOpen]);

  const handleSubmit = async () => {
    if (!form.name || !form.display_name) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      
      if (isEditing && staff) {
        await updateCouncilStaff(staff.id, form);
        alert('Штаб обновлен');
      } else {
        await createCouncilStaff(form);
        alert('Штаб создан');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error with council staff:', error);
      alert('Ошибка при работе со штабом');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!staff || !confirm('Вы уверены, что хотите удалить этот штаб?')) return;

    try {
      setSubmitting(true);
      await deleteCouncilStaff(staff.id);
      alert('Штаб удален');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Ошибка удаления штаба');
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
          <Users className="h-8 w-8 text-green-400" />
          <h2 className="text-3xl font-bold text-white">
            {isEditing ? 'Редактировать штаб' : 'Создать штаб'}
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
                placeholder="logistics"
                disabled={isEditing}
              />
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">
                Название штаба <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({...form, display_name: e.target.value})}
                className="input"
                placeholder="Штаб логистики"
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
              placeholder="Описание направления деятельности штаба"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          {/* Предварительный просмотр */}
          {form.display_name && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-white/20 pt-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className={`glass-effect p-6 rounded-xl bg-gradient-to-r ${form.color}`}>
                <div className="flex items-center space-x-4">
                  {React.createElement(iconOptions.find(i => i.value === form.icon)?.icon || Users, { 
                    className: "h-8 w-8 text-white" 
                  })}
                  <div>
                    <div className="text-xl font-bold text-white">{form.display_name}</div>
                    <div className="text-white/80">{form.description}</div>
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

export default CouncilStaffModal;