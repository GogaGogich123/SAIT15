import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Lock, Users, Hash, Image, Save } from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

interface CadetFormData {
  name: string;
  email: string;
  password: string;
  platoon: string;
  squad: number;
  avatar_url: string;
}

interface AddEditCadetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cadetData: CadetFormData) => Promise<void>;
  cadetData?: any; // Для будущего редактирования
  isEditing?: boolean;
}

const AddEditCadetModal: React.FC<AddEditCadetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cadetData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<CadetFormData>({
    name: '',
    email: '',
    password: '',
    platoon: '10-1',
    squad: 1,
    avatar_url: ''
  });
  const [errors, setErrors] = useState<Partial<CadetFormData>>({});
  const [apiError, setApiError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const platoons = ['7-1', '7-2', '8-1', '8-2', '9-1', '9-2', '10-1', '10-2', '11-1', '11-2'];
  const squads = [1, 2, 3];

  useEffect(() => {
    if (isEditing && cadetData) {
      setFormData({
        name: cadetData.name || '',
        email: cadetData.email || '',
        password: '', // Пароль не заполняем при редактировании
        platoon: cadetData.platoon || '10-1',
        squad: cadetData.squad || 1,
        avatar_url: cadetData.avatar_url || ''
      });
    } else {
      // Сброс формы для нового кадета
      setFormData({
        name: '',
        email: '',
        password: '',
        platoon: '10-1',
        squad: 1,
        avatar_url: ''
      });
    }
    setErrors({});
    setApiError('');
  }, [isEditing, cadetData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CadetFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!isEditing && !formData.password.trim()) {
      newErrors.password = 'Пароль обязателен';
    } else if (!isEditing && formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }

    if (!formData.platoon) {
      newErrors.platoon = 'Взвод обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving cadet:', error);
      setApiError(error instanceof Error ? error.message : 'Произошла ошибка при сохранении');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CadetFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    // Очищаем API ошибку при изменении любого поля
    if (apiError) {
      setApiError('');
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
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="glass-effect rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-display font-black text-white mb-2 text-shadow">
                {isEditing ? 'Редактировать кадета' : 'Добавить кадета'}
              </h2>
              <p className="text-blue-200 text-lg">
                {isEditing ? 'Изменить данные кадета' : 'Создать нового кадета в системе'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-400 text-3xl font-bold transition-colors hover:scale-110"
            >
              <X className="h-8 w-8" />
            </button>
          </div>

          {/* API Error Display */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-xl">
              <p className="text-red-400 font-semibold text-center">{apiError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Name */}
              <motion.div variants={staggerItem}>
                <label className="block text-white font-bold text-lg mb-3">
                  <User className="inline h-5 w-5 mr-2" />
                  Полное имя
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className={`input text-lg ${errors.name ? 'border-red-500 focus:ring-red-400' : ''}`}
                />
                {errors.name && (
                  <p className="mt-2 text-red-400 text-sm font-semibold">{errors.name}</p>
                )}
              </motion.div>

              {/* Email */}
              <motion.div variants={staggerItem}>
                <label className="block text-white font-bold text-lg mb-3">
                  <Mail className="inline h-5 w-5 mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ivanov.ivan@nkkk.ru"
                  className={`input text-lg ${errors.email ? 'border-red-500 focus:ring-red-400' : ''}`}
                />
                {errors.email && (
                  <p className="mt-2 text-red-400 text-sm font-semibold">{errors.email}</p>
                )}
              </motion.div>

              {/* Password */}
              {!isEditing && (
                <motion.div variants={staggerItem}>
                  <label className="block text-white font-bold text-lg mb-3">
                    <Lock className="inline h-5 w-5 mr-2" />
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Минимум 6 символов"
                    className={`input text-lg ${errors.password ? 'border-red-500 focus:ring-red-400' : ''}`}
                  />
                  {errors.password && (
                    <p className="mt-2 text-red-400 text-sm font-semibold">{errors.password}</p>
                  )}
                </motion.div>
              )}

              {/* Platoon and Squad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={staggerItem}>
                  <label className="block text-white font-bold text-lg mb-3">
                    <Users className="inline h-5 w-5 mr-2" />
                    Взвод
                  </label>
                  <select
                    value={formData.platoon}
                    onChange={(e) => handleInputChange('platoon', e.target.value)}
                    className={`input text-lg ${errors.platoon ? 'border-red-500 focus:ring-red-400' : ''}`}
                  >
                    {platoons.map(platoon => (
                      <option key={platoon} value={platoon}>{platoon} взвод</option>
                    ))}
                  </select>
                  {errors.platoon && (
                    <p className="mt-2 text-red-400 text-sm font-semibold">{errors.platoon}</p>
                  )}
                </motion.div>

                <motion.div variants={staggerItem}>
                  <label className="block text-white font-bold text-lg mb-3">
                    <Hash className="inline h-5 w-5 mr-2" />
                    Отделение
                  </label>
                  <select
                    value={formData.squad}
                    onChange={(e) => handleInputChange('squad', parseInt(e.target.value))}
                    className="input text-lg"
                  >
                    {squads.map(squad => (
                      <option key={squad} value={squad}>{squad} отделение</option>
                    ))}
                  </select>
                </motion.div>
              </div>

              {/* Avatar URL */}
              <motion.div variants={staggerItem}>
                <label className="block text-white font-bold text-lg mb-3">
                  <Image className="inline h-5 w-5 mr-2" />
                  URL аватара (необязательно)
                </label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="input text-lg"
                />
              </motion.div>

              {/* Avatar Preview */}
              {formData.avatar_url && (
                <motion.div variants={staggerItem} className="flex justify-center">
                  <img
                    src={formData.avatar_url}
                    alt="Предпросмотр аватара"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-400 shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </motion.div>
              )}

              {/* Buttons */}
              <motion.div variants={staggerItem} className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-500 hover:scale-105 shadow-lg flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      {isEditing ? 'Сохранить изменения' : 'Создать кадета'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-8 py-4 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition-all duration-500 hover:scale-105 shadow-lg"
                >
                  Отмена
                </button>
              </motion.div>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddEditCadetModal;