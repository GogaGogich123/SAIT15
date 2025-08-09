import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Save, X } from 'lucide-react';

interface CadetForm {
  name: string;
  email: string;
  phone: string;
  platoon: string;
  squad: number;
  password: string;
  avatar_url: string;
}

interface CadetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: CadetForm;
  setForm: (form: CadetForm) => void;
  isEditing: boolean;
  loading: boolean;
}

const CadetModal: React.FC<CadetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  isEditing,
  loading
}) => {
  const platoonOptions = ['7-1', '7-2', '8-1', '8-2', '9-1', '9-2', '10-1', '10-2', '11-1', '11-2'];
  const squadOptions = [1, 2, 3];

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
        className="glass-effect rounded-3xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-6">
          <UserPlus className="h-8 w-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">
            {isEditing ? 'Редактировать кадета' : 'Добавить нового кадета'}
          </h2>
        </div>
        
        <div className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">
                Полное имя <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="input"
                placeholder="Иванов Иван Иванович"
              />
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="input"
                placeholder="ivanov.ivan@nkkk.ru"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">Телефон</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                className="input"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">URL аватара</label>
              <input
                type="url"
                value={form.avatar_url}
                onChange={(e) => setForm({...form, avatar_url: e.target.value})}
                className="input"
                placeholder="https://images.pexels.com/photos/..."
              />
            </div>
          </div>

          {/* Информация о взводе */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">
                Взвод <span className="text-red-400">*</span>
              </label>
              <select
                value={form.platoon}
                onChange={(e) => setForm({...form, platoon: e.target.value})}
                className="input"
              >
                <option value="">Выберите взвод</option>
                {platoonOptions.map(platoon => (
                  <option key={platoon} value={platoon}>{platoon} взвод</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">
                Отделение <span className="text-red-400">*</span>
              </label>
              <select
                value={form.squad}
                onChange={(e) => setForm({...form, squad: parseInt(e.target.value)})}
                className="input"
              >
                <option value={0}>Выберите отделение</option>
                {squadOptions.map(squad => (
                  <option key={squad} value={squad}>{squad} отделение</option>
                ))}
              </select>
            </div>
          </div>

          {/* Данные для входа */}
          {!isEditing && (
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-xl font-bold text-white mb-4">Данные для входа в систему</h3>
              <div>
                <label className="block text-white font-bold mb-2">
                  Пароль <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="input"
                  placeholder="Минимум 6 символов"
                />
                <p className="text-blue-300 text-sm mt-2">
                  Кадет сможет войти в систему, используя указанный email и этот пароль
                </p>
              </div>
            </div>
          )}

          {/* Предварительный просмотр */}
          {form.name && form.email && (
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className="glass-effect p-6 rounded-2xl">
                <div className="flex items-center space-x-4">
                  {form.avatar_url ? (
                    <img
                      src={form.avatar_url}
                      alt={form.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-400"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      {form.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-white">{form.name}</h4>
                    <p className="text-blue-300">{form.email}</p>
                    {form.platoon && form.squad && (
                      <p className="text-blue-200">{form.platoon} взвод, {form.squad} отделение</p>
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
            disabled={loading || !form.name || !form.email || !form.platoon || !form.squad || (!isEditing && !form.password)}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{isEditing ? 'Обновить кадета' : 'Создать кадета'}</span>
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

export default CadetModal;