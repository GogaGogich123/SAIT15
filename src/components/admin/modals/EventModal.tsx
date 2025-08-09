import React from 'react';
import { motion } from 'framer-motion';
import { Save, X, Calendar, MapPin, Users, Clock, Image } from 'lucide-react';

interface EventForm {
  title: string;
  description: string;
  content: string;
  event_date: string;
  event_time: string;
  location: string;
  max_participants: number;
  registration_deadline: string;
  background_image_url: string;
  images: string[];
  category: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: EventForm;
  setForm: (form: EventForm) => void;
  isEditing: boolean;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  isEditing
}) => {
  const categoryOptions = [
    { value: 'general', label: 'Общее' },
    { value: 'sport', label: 'Спорт' },
    { value: 'education', label: 'Образование' },
    { value: 'culture', label: 'Культура' },
    { value: 'competition', label: 'Соревнование' }
  ];

  const addImage = () => {
    const url = prompt('Введите URL изображения:');
    if (url) {
      setForm({ ...form, images: [...form.images, url] });
    }
  };

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
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
        className="glass-effect rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-6">
          <Calendar className="h-8 w-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">
            {isEditing ? 'Редактировать событие' : 'Создать событие'}
          </h2>
        </div>
        
        <div className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">
                Название события <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                className="input"
                placeholder="Турнир по шахматам"
              />
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">
                Категория <span className="text-red-400">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                className="input"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white font-bold mb-2">
              Краткое описание <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="input resize-none"
              rows={3}
              placeholder="Краткое описание события для списка"
            />
          </div>

          <div>
            <label className="block text-white font-bold mb-2">
              Подробное описание
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({...form, content: e.target.value})}
              className="input resize-none"
              rows={5}
              placeholder="Подробное описание события, правила, условия участия..."
            />
          </div>

          {/* Дата и время */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">
                Дата события <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({...form, event_date: e.target.value})}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">Время</label>
              <input
                type="time"
                value={form.event_time}
                onChange={(e) => setForm({...form, event_time: e.target.value})}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">Дедлайн регистрации</label>
              <input
                type="date"
                value={form.registration_deadline}
                onChange={(e) => setForm({...form, registration_deadline: e.target.value})}
                className="input"
              />
            </div>
          </div>

          {/* Место и участники */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">Место проведения</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value})}
                className="input"
                placeholder="Актовый зал корпуса"
              />
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">Максимум участников</label>
              <input
                type="number"
                value={form.max_participants}
                onChange={(e) => setForm({...form, max_participants: parseInt(e.target.value) || 0})}
                className="input"
                placeholder="0 = без ограничений"
                min="0"
              />
            </div>
          </div>

          {/* Изображения */}
          <div>
            <label className="block text-white font-bold mb-2">Фоновое изображение</label>
            <input
              type="url"
              value={form.background_image_url}
              onChange={(e) => setForm({...form, background_image_url: e.target.value})}
              className="input"
              placeholder="https://images.pexels.com/..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-white font-bold">Галерея изображений</label>
              <button
                type="button"
                onClick={addImage}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <Image className="h-4 w-4" />
                <span>Добавить изображение</span>
              </button>
            </div>
            
            {form.images.length > 0 && (
              <div className="space-y-2">
                {form.images.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg">
                    <img
                      src={url}
                      alt={`Изображение ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64?text=Error';
                      }}
                    />
                    <span className="flex-1 text-blue-200 text-sm truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-500/20 text-blue-300">
                    {categoryOptions.find(c => c.value === form.category)?.label}
                  </span>
                </div>
                
                <div className="flex items-center space-x-6 text-blue-300 text-sm">
                  {form.event_date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(form.event_date).toLocaleDateString('ru-RU')}</span>
                    </div>
                  )}
                  {form.event_time && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{form.event_time}</span>
                    </div>
                  )}
                  {form.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{form.location}</span>
                    </div>
                  )}
                  {form.max_participants > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>до {form.max_participants} участников</span>
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
            disabled={!form.title || !form.description || !form.event_date}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>{isEditing ? 'Обновить событие' : 'Создать событие'}</span>
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

export default EventModal;