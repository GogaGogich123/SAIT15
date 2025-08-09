import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Award, 
  BookOpen, 
  Target,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  Star,
  Trophy,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';
import ModernBackground from '../components/ModernBackground';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getCadets,
  getTasks,
  getNews,
  type Cadet,
  type Task,
  type News
} from '../lib/supabase';
import { addCadetByAdmin } from '../lib/supabase';
import AddEditCadetModal from '../components/Admin/AddEditCadetModal';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

interface AdminStats {
  totalCadets: number;
  totalTasks: number;
  totalNews: number;
  averageScore: number;
}

const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'cadets' | 'tasks' | 'news' | 'analytics'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalCadets: 0,
    totalTasks: 0,
    totalNews: 0,
    averageScore: 0
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'cadet' | 'task' | 'news'>('cadet');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [cadetsData, tasksData, newsData] = await Promise.all([
        getCadets(),
        getTasks(),
        getNews()
      ]);

      setCadets(cadetsData);
      setTasks(tasksData);
      setNews(newsData);

      // Calculate stats
      const averageScore = cadetsData.length > 0 
        ? cadetsData.reduce((sum, cadet) => sum + cadet.total_score, 0) / cadetsData.length
        : 0;

      setStats({
        totalCadets: cadetsData.length,
        totalTasks: tasksData.length,
        totalNews: newsData.length,
        averageScore: Math.round(averageScore)
      });

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (type: 'cadet' | 'task' | 'news') => {
    setModalType(type);
    setEditingItem(null);
    setShowAddModal(true);
  };

  const openEditModal = (item: any, type: 'cadet' | 'task' | 'news') => {
    setModalType(type);
    setEditingItem(item);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleSaveCadet = async (cadetData: any) => {
    try {
      setIsSubmitting(true);
      await addCadetByAdmin(cadetData);
      await fetchAllData(); // Обновляем список кадетов
      closeModal();
    } catch (error) {
      console.error('Error saving cadet:', error);
      throw error; // Пробрасываем ошибку для обработки в модальном окне
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h2>
          <p className="text-blue-200">У вас нет прав администратора</p>
        </div>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          variants={staggerItem}
          className="card-gradient from-blue-600 to-blue-800 p-6 rounded-2xl shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-semibold">Всего кадетов</p>
              <p className="text-3xl font-black text-white">{stats.totalCadets}</p>
            </div>
            <Users className="h-12 w-12 text-blue-300" />
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="card-gradient from-green-600 to-green-800 p-6 rounded-2xl shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-semibold">Активных заданий</p>
              <p className="text-3xl font-black text-white">{stats.totalTasks}</p>
            </div>
            <BookOpen className="h-12 w-12 text-green-300" />
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="card-gradient from-purple-600 to-purple-800 p-6 rounded-2xl shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-semibold">Новостей</p>
              <p className="text-3xl font-black text-white">{stats.totalNews}</p>
            </div>
            <Award className="h-12 w-12 text-purple-300" />
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="card-gradient from-yellow-600 to-yellow-800 p-6 rounded-2xl shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-200 text-sm font-semibold">Средний балл</p>
              <p className="text-3xl font-black text-white">{stats.averageScore}</p>
            </div>
            <Trophy className="h-12 w-12 text-yellow-300" />
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Cadet Modal */}
      <AddEditCadetModal
        isOpen={showAddModal && modalType === 'cadet'}
        onClose={closeModal}
        onSave={handleSaveCadet}
        cadetData={editingItem}
        isEditing={!!editingItem}
      />

      {/* Temporary modals for other types - TODO: implement proper modals */}
      {showAddModal && modalType === 'task' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass-effect rounded-3xl max-w-2xl w-full p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 className="text-3xl font-display font-black text-white mb-4">
                Добавление заданий
              </h2>
              <p className="text-blue-200 mb-6">
                Функция добавления заданий будет реализована в следующих обновлениях
              </p>
              <button
                onClick={closeModal}
                className="btn-primary"
              >
                Понятно
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showAddModal && modalType === 'news' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass-effect rounded-3xl max-w-2xl w-full p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 className="text-3xl font-display font-black text-white mb-4">
                Добавление новостей
              </h2>
              <p className="text-blue-200 mb-6">
                Функция добавления новостей будет реализована в следующих обновлениях
              </p>
              <button
                onClick={closeModal}
                className="btn-primary"
              >
                Понятно
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <div className="card-hover p-8">
        <h3 className="text-2xl font-bold text-white mb-6">Последняя активность</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <div>
              <p className="text-white font-semibold">Новый кадет зарегистрирован</p>
              <p className="text-blue-300 text-sm">2 часа назад</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl">
            <Star className="h-6 w-6 text-yellow-400" />
            <div>
              <p className="text-white font-semibold">Задание выполнено</p>
              <p className="text-blue-300 text-sm">4 часа назад</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl">
            <Award className="h-6 w-6 text-purple-400" />
            <div>
              <p className="text-white font-semibold">Новость опубликована</p>
              <p className="text-blue-300 text-sm">1 день назад</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCadetsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white">Управление кадетами</h3>
        <button
          onClick={() => openAddModal('cadet')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить кадета
        </button>
      </div>

      <div className="card-hover p-6">
        <div className="space-y-4">
          {cadets.map((cadet) => (
            <div key={cadet.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-4">
                <img
                  src={cadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=100'}
                  alt={cadet.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-white font-semibold">{cadet.name}</p>
                  <p className="text-blue-300 text-sm">{cadet.platoon} взвод, {cadet.squad} отделение</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-yellow-400 font-bold">{cadet.total_score} баллов</span>
                <button
                  onClick={() => openEditModal(cadet, 'cadet')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTasksTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white">Управление заданиями</h3>
        <button
          onClick={() => openAddModal('task')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить задание
        </button>
      </div>

      <div className="card-hover p-6">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white font-semibold">{task.title}</p>
                <p className="text-blue-300 text-sm">{task.category} • {task.difficulty}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-yellow-400 font-bold">{task.points} баллов</span>
                <span className="text-blue-300 text-sm">
                  До {new Date(task.deadline).toLocaleDateString('ru-RU')}
                </span>
                <button
                  onClick={() => openEditModal(task, 'task')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNewsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white">Управление новостями</h3>
        <button
          onClick={() => openAddModal('news')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить новость
        </button>
      </div>

      <div className="card-hover p-6">
        <div className="space-y-4">
          {news.map((newsItem) => (
            <div key={newsItem.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white font-semibold">{newsItem.title}</p>
                <p className="text-blue-300 text-sm">Автор: {newsItem.author}</p>
              </div>
              <div className="flex items-center space-x-4">
                {newsItem.is_main && (
                  <span className="bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                    ГЛАВНАЯ
                  </span>
                )}
                <span className="text-blue-300 text-sm">
                  {new Date(newsItem.created_at).toLocaleDateString('ru-RU')}
                </span>
                <button
                  onClick={() => openEditModal(newsItem, 'news')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-white">Аналитика</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-hover p-6">
          <h4 className="text-xl font-bold text-white mb-4">Топ кадетов по баллам</h4>
          <div className="space-y-3">
            {cadets
              .sort((a, b) => b.total_score - a.total_score)
              .slice(0, 5)
              .map((cadet, index) => (
                <div key={cadet.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-yellow-400 font-bold">#{index + 1}</span>
                    <span className="text-white">{cadet.name}</span>
                  </div>
                  <span className="text-blue-300 font-semibold">{cadet.total_score}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="card-hover p-6">
          <h4 className="text-xl font-bold text-white mb-4">Статистика по взводам</h4>
          <div className="space-y-3">
            {Array.from(new Set(cadets.map(c => c.platoon)))
              .map(platoon => {
                const platoonCadets = cadets.filter(c => c.platoon === platoon);
                const avgScore = platoonCadets.reduce((sum, c) => sum + c.total_score, 0) / platoonCadets.length;
                return (
                  <div key={platoon} className="flex items-center justify-between">
                    <span className="text-white">{platoon} взвод</span>
                    <div className="text-right">
                      <div className="text-blue-300 font-semibold">{Math.round(avgScore)} ср. балл</div>
                      <div className="text-blue-400 text-sm">{platoonCadets.length} кадетов</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'cadets': return renderCadetsTab();
      case 'tasks': return renderTasksTab();
      case 'news': return renderNewsTab();
      case 'analytics': return renderAnalyticsTab();
      default: return renderOverviewTab();
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
        <AnimatedSVGBackground />
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
              Панель администратора
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
            <p className="text-2xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
              Управление системой рейтинга кадетов
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div>
              <LoadingSpinner message="Загрузка данных..." />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={fetchAllData}
                className="btn-primary"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* Tabs */}
          {!loading && !error && (
            <>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center gap-4 mb-12"
              >
                {[
                  { key: 'overview', name: 'Обзор', icon: TrendingUp },
                  { key: 'cadets', name: 'Кадеты', icon: Users },
                  { key: 'tasks', name: 'Задания', icon: BookOpen },
                  { key: 'news', name: 'Новости', icon: Award },
                  { key: 'analytics', name: 'Аналитика', icon: Target },
                ].map(({ key, name, icon: Icon }) => (
                  <motion.button
                    key={key}
                    variants={staggerItem}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(key as any)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === key
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'bg-white/10 text-blue-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{name}</span>
                  </motion.button>
                ))}
              </motion.div>

              {/* Tab Content */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {renderTabContent()}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;