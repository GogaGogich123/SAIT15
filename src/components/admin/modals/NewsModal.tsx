import React from 'react';
import { motion } from 'framer-motion';
import { Save, X, FileText, Image, Plus, Trash2 } from 'lucide-react';

interface NewsForm {
  title: string;
  content: string;
  author: string;
  is_main: boolean;
  background_image_url: string;
  images: string[];
}

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: NewsForm;
  setForm: (form: NewsForm) => void;
  isEditing: boolean;
}

const NewsModal: React.FC<NewsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  isEditing
}) => {
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
          <FileText className="h-8 w-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">
            {isEditing ? 'Редактировать новость' : 'Создать новость'}
          </h2>
        </div>
        
        <div className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-bold mb-2">
                Заголовок <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                className="input"
                placeholder="Заголовок новости"
              />
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">
                Автор <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({...form, author: e.target.value})}
                className="input"
                placeholder="Имя автора"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-bold mb-2">
              Содержание <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({...form, content: e.target.value})}
              className="input resize-none"
              rows={8}
              placeholder="Текст новости..."
            />
          </div>

          {/* Главная новость */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_main}
                onChange={(e) => setForm({...form, is_main: e.target.checked})}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="text-white font-bold">Главная новость</span>
              <span className="text-yellow-400 text-sm">(будет отображаться на главной странице)</span>
            </label>
          </div>

          {/* Фоновое изображение */}
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

          {/* Галерея изображений */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-white font-bold">Галерея изображений</label>
              <button
                type="button"
                onClick={addImage}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
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
                      className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Предварительный просмотр */}
          {form.title && form.content && (
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className="glass-effect p-6 rounded-2xl">
                <div className="flex items-center space-x-2 mb-4">
                  <h4 className="text-2xl font-bold text-white">{form.title}</h4>
                  {form.is_main && (
                    <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-bold">
                      ГЛАВНАЯ
                    </span>
                  )}
                </div>
                <p className="text-blue-200 mb-4">{form.content}</p>
                <div className="flex items-center space-x-4 text-blue-300 text-sm">
                  <span>Автор: {form.author}</span>
                  <span>Сейчас</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={onSubmit}
            disabled={!form.title || !form.content || !form.author}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>{isEditing ? 'Обновить новость' : 'Создать новость'}</span>
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

export default NewsModal;