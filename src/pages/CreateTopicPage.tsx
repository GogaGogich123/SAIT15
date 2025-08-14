import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getForumCategories, 
  createTopic,
  type ForumCategory
} from '../lib/forum';
import { fadeInUp } from '../utils/animations';

const CreateTopicPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getForumCategories();
        setCategories(categoriesData);
        
        // Устанавливаем категорию из URL параметров
        const categoryFromUrl = searchParams.get('category');
        if (categoryFromUrl && categoriesData.find(c => c.id === categoryFromUrl)) {
          setSelectedCategory(categoryFromUrl);
        } else if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Ошибка загрузки категорий');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.cadetId || !selectedCategory || !title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      const newTopic = await createTopic(selectedCategory, title.trim(), content.trim(), user.cadetId);
      alert('Тема успешно создана');
      navigate(`/forum/topic/${newTopic.id}`);
    } catch (err) {
      console.error('Error creating topic:', err);
      alert('Ошибка создания темы');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Требуется авторизация</h2>
          <p className="text-blue-200 mb-4">Войдите в систему, чтобы создать тему</p>
          <Link to="/login" className="btn-primary">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Загрузка..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ошибка</h2>
          <p className="text-blue-200 mb-4">{error}</p>
          <Link to="/forum" className="btn-primary">
            Вернуться к форуму
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <AnimatedSVGBackground />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-800/95 z-10"></div>
      
      <div className="relative z-20 section-padding">
        <div className="container-custom max-w-4xl">
          {/* Back Button */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <Link 
              to="/forum"
              className="inline-flex items-center space-x-2 text-blue-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Вернуться к форуму</span>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center space-x-3 mb-6">
              <MessageSquare className="h-12 w-12 text-blue-400" />
              <h1 className="text-5xl font-display font-black text-white text-shadow">
                Создать тему
              </h1>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </motion.div>

          {/* Create Topic Form */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="card-hover p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Category Selection */}
              <div>
                <label className="block text-white font-bold text-lg mb-4">
                  Категория <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input text-lg"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-white font-bold text-lg mb-4">
                  Заголовок темы <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите заголовок темы..."
                  className="input text-lg"
                  maxLength={200}
                  required
                />
                <div className="text-right text-blue-300 text-sm mt-2">
                  {title.length}/200
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-white font-bold text-lg mb-4">
                  Содержание <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Опишите вашу тему подробно..."
                  rows={12}
                  className="input resize-none text-lg"
                  maxLength={5000}
                  required
                />
                <div className="text-right text-blue-300 text-sm mt-2">
                  {content.length}/5000
                </div>
              </div>

              {/* Preview */}
              {(title.trim() || content.trim()) && (
                <div className="border-t border-white/20 pt-8">
                  <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
                  <div className="glass-effect p-6 rounded-2xl">
                    {title.trim() && (
                      <h4 className="text-2xl font-bold text-white mb-4">{title}</h4>
                    )}
                    {content.trim() && (
                      <div className="prose prose-invert max-w-none">
                        <p className="text-blue-100 whitespace-pre-wrap">{content}</p>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-blue-300 text-sm mt-4 pt-4 border-t border-white/20">
                      <span>Автор: {user.name}</span>
                      <span>Сейчас</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link to="/forum" className="btn-ghost">
                  Отмена
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !selectedCategory || !title.trim() || !content.trim()}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Создать тему</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateTopicPage;