import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Pin, 
  Lock, 
  Eye, 
  MessageCircle,
  Clock,
  User,
  BookOpen,
  Trophy,
  Shield,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemedBackground from '../components/ThemedBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getForumCategories, 
  getTopicsByCategory,
  type ForumCategory,
  type ForumTopic
} from '../lib/forum';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

const ForumPage: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getForumCategories();
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
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
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const fetchTopics = async () => {
        try {
          setTopicsLoading(true);
          const topicsData = await getTopicsByCategory(selectedCategory);
          setTopics(topicsData);
        } catch (err) {
          console.error('Error fetching topics:', err);
          setError('Ошибка загрузки тем');
        } finally {
          setTopicsLoading(false);
        }
      };

      fetchTopics();
    }
  }, [selectedCategory]);

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      MessageSquare, BookOpen, Trophy, Shield, Lightbulb
    };
    return icons[iconName] || MessageSquare;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Только что';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ч. назад`;
    } else if (diffInHours < 48) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <ThemedBackground />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-800/95 z-10"></div>
      
      <div className="relative z-20 section-padding">
        <div className="container-custom">
          {/* Header */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-center mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-display font-black mb-6 text-gradient text-glow">
              Форум кадетов
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
            <p className="text-2xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
              Общайтесь, делитесь опытом и находите ответы на вопросы
            </p>
          </motion.div>

          {loading && <LoadingSpinner message="Загрузка форума..." />}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Categories Sidebar */}
              <div className="lg:col-span-1">
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  className="card-hover p-6 sticky top-8"
                >
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <MessageSquare className="h-6 w-6 mr-2" />
                    Категории
                  </h2>
                  <div className="space-y-3">
                    {categories.map((category) => {
                      const IconComponent = getIconComponent(category.icon);
                      return (
                        <motion.button
                          key={category.id}
                          whileHover={{ scale: 1.02, x: 5 }}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                            selectedCategory === category.id
                              ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                              : 'bg-white/5 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <IconComponent className="h-5 w-5" />
                            <div>
                              <div className="font-semibold">{category.name}</div>
                              {category.description && (
                                <div className="text-sm opacity-80">{category.description}</div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Topics List */}
              <div className="lg:col-span-3">
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  className="card-hover p-8"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-white">
                      {categories.find(c => c.id === selectedCategory)?.name || 'Темы'}
                    </h2>
                    {user && (
                      <Link to={`/forum/create-topic?category=${selectedCategory}`}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Plus className="h-5 w-5" />
                          <span>Создать тему</span>
                        </motion.button>
                      </Link>
                    )}
                  </div>

                  {topicsLoading && (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <p className="text-blue-300">Загрузка тем...</p>
                    </div>
                  )}

                  {!topicsLoading && topics.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
                      <p className="text-blue-300 text-lg">В этой категории пока нет тем</p>
                      {user && (
                        <Link to={`/forum/create-topic?category=${selectedCategory}`}>
                          <button className="btn-primary mt-4">
                            Создать первую тему
                          </button>
                        </Link>
                      )}
                    </div>
                  )}

                  {!topicsLoading && topics.length > 0 && (
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {topics.map((topic) => (
                        <motion.div
                          key={topic.id}
                          variants={staggerItem}
                          whileHover={{ scale: 1.01, y: -2 }}
                        >
                          <Link to={`/forum/topic/${topic.id}`}>
                            <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/30 rounded-xl p-6 transition-all duration-300">
                              <div className="flex items-start justify-between">
                                <div className="flex-grow">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {topic.is_pinned && (
                                      <Pin className="h-4 w-4 text-yellow-400" />
                                    )}
                                    {topic.is_locked && (
                                      <Lock className="h-4 w-4 text-red-400" />
                                    )}
                                    <h3 className="text-xl font-bold text-white hover:text-blue-300 transition-colors">
                                      {topic.title}
                                    </h3>
                                  </div>
                                  
                                  <p className="text-blue-200 mb-4 line-clamp-2">
                                    {topic.content}
                                  </p>
                                  
                                  <div className="flex items-center space-x-6 text-sm text-blue-300">
                                    <div className="flex items-center space-x-1">
                                      <User className="h-4 w-4" />
                                      <span>{topic.author?.name}</span>
                                      <span className="text-blue-400">({topic.author?.platoon})</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{formatDate(topic.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-end space-y-2 ml-6">
                                  <div className="flex items-center space-x-4 text-blue-300">
                                    <div className="flex items-center space-x-1">
                                      <Eye className="h-4 w-4" />
                                      <span className="font-semibold">{topic.views_count}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <MessageCircle className="h-4 w-4" />
                                      <span className="font-semibold">{topic.posts_count}</span>
                                    </div>
                                  </div>
                                  
                                  {topic.last_post_author && (
                                    <div className="text-right text-sm text-blue-400">
                                      <div>Последний ответ:</div>
                                      <div className="font-semibold">{topic.last_post_author.name}</div>
                                      <div>{formatDate(topic.last_post_at)}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ForumPage;