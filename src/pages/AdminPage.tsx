import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminStats from '../components/admin/AdminStats';
import AdminQuickActions from '../components/admin/AdminQuickActions';
import AdminTabs from '../components/admin/AdminTabs';
import AchievementModal from '../components/admin/modals/AchievementModal';
import ScoreModal from '../components/admin/modals/ScoreModal';
import CadetModal from '../components/admin/modals/CadetModal';
import { 
  getCadets,
  getAchievements,
  getAutoAchievements,
  addAchievement,
  updateAchievement,
  deleteAchievement,
  awardAchievement,
  addScoreHistory,
  updateCadetScores,
  getAnalytics,
  addNews,
  updateNews,
  deleteNews,
  getNews,
  getTasks,
  updateTask,
  type Cadet,
  type Achievement,
  type AutoAchievement,
  type News,
  type Task
} from '../lib/supabase';
import { createCadetWithAuth, updateCadetData, deleteCadet } from '../lib/admin';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';
interface AchievementForm {
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
}

interface ScoreForm {
  cadetId: string;
  category: 'study' | 'discipline' | 'events';
  points: number;
  description: string;
}

interface NewsForm {
  title: string;
  content: string;
  author: string;
  is_main: boolean;
  background_image_url: string;
  images: string[];
}

interface CadetForm {
  name: string;
  email: string;
  phone: string;
  platoon: string;
  squad: number;
  password: string;
  avatar_url: string;
}

const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { success, error: showError } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'cadets' | 'achievements' | 'scores' | 'news' | 'tasks'>('overview');
  const [loading, setLoading] = useState(true);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [autoAchievements, setAutoAchievements] = useState<AutoAchievement[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Modal states
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showCadetModal, setShowCadetModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [editingCadet, setEditingCadet] = useState<Cadet | null>(null);
  const [cadetModalLoading, setCadetModalLoading] = useState(false);
  
  // Form states  
  const [achievementForm, setAchievementForm] = useState<AchievementForm>({
    title: '',
    description: '',
    category: 'general',
    icon: 'Star',
    color: 'from-blue-500 to-blue-700'
  });

  const [scoreForm, setScoreForm] = useState<ScoreForm>({
    cadetId: '',
    category: 'study',
    points: 0,
    description: ''
  });
  
  const [newsForm] = useState<NewsForm>({
    title: '',
    content: '',
    author: '',
    is_main: false,
    background_image_url: '',
    images: []
  });

  const [cadetForm, setCadetForm] = useState<CadetForm>({
    name: '',
    email: '',
    phone: '',
    platoon: '',
    squad: 0,
    password: '',
    avatar_url: ''
  });

  const [selectedCadetForAward, setSelectedCadetForAward] = useState<string>('');
  const [selectedAchievementForAward, setSelectedAchievementForAward] = useState<string>('');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatoon, setFilterPlatoon] = useState('all');

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cadetsData, achievementsData, autoAchievementsData, newsData, tasksData, analyticsData] = await Promise.all([
          getCadets(),
          getAchievements(),
          getAutoAchievements(),
          getNews(),
          getTasks(),
          getAnalytics()
        ]);
        
        setCadets(cadetsData);
        setAchievements(achievementsData);
        setAutoAchievements(autoAchievementsData);
        setNews(newsData);
        setTasks(tasksData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        showError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, showError]);

  const handleCreateAchievement = async () => {
    try {
      if (!achievementForm.title || !achievementForm.description) {
        showError('Заполните все обязательные поля');
        return;
      }
      
      const newAchievement = await addAchievement(achievementForm);
      setAchievements([...achievements, newAchievement]);
      setShowAchievementModal(false);
      setAchievementForm({
        title: '',
        description: '',
        category: 'general',
        icon: 'Star',
        color: 'from-blue-500 to-blue-700'
      });
      success('Достижение создано');
    } catch (err) {
      showError('Ошибка создания достижения');
    }
  };
  
  const handleUpdateAchievement = async () => {
    if (!editingAchievement) return;
    
    try {
      await updateAchievement(editingAchievement.id, achievementForm);
      setAchievements(achievements.map(a => 
        a.id === editingAchievement.id ? { ...a, ...achievementForm } : a
      ));
      setShowAchievementModal(false);
      setEditingAchievement(null);
      success('Достижение обновлено');
    } catch (err) {
      showError('Ошибка обновления достижения');
    }
  };
  
  const handleDeleteAchievement = async (id: string) => {
    if (!confirm('Удалить достижение?')) return;
    
    try {
      await deleteAchievement(id);
      setAchievements(achievements.filter(a => a.id !== id));
      success('Достижение удалено');
    } catch (err) {
      showError('Ошибка удаления достижения');
    }
  };
  
  const handleAwardAchievement = async () => {
    if (!selectedCadetForAward || !selectedAchievementForAward || !user) return;
    
    try {
      await awardAchievement(selectedCadetForAward, selectedAchievementForAward, user.id);
      setShowAwardModal(false);
      setSelectedCadetForAward('');
      setSelectedAchievementForAward('');
      success('Достижение присуждено');
    } catch (err) {
      showError('Ошибка присуждения достижения');
    }
  };
  
  const handleAddScore = async () => {
    if (!user) return;
    
    try {
      if (!scoreForm.cadetId || !scoreForm.description || scoreForm.points === 0) {
        showError('Заполните все поля');
        return;
      }
      
      await addScoreHistory({
        cadet_id: scoreForm.cadetId,
        category: scoreForm.category,
        points: scoreForm.points,
        description: scoreForm.description,
        awarded_by: user.id
      });
      
      await updateCadetScores(scoreForm.cadetId, scoreForm.category, scoreForm.points);
      
      setShowScoreModal(false);
      setScoreForm({
        cadetId: '',
        category: 'study',
        points: 0,
        description: ''
      });
      success('Баллы начислены');
    } catch (err) {
      showError('Ошибка начисления баллов');
    }
  };
  
  const handleCreateNews = async () => {
    try {
      if (!newsForm.title || !newsForm.content || !newsForm.author) {
        showError('Заполните все обязательные поля');
        return;
      }
      
      const newNews = await addNews(newsForm);
      setNews([newNews, ...news]);
      setShowNewsModal(false);
      setNewsForm({
        title: '',
        content: '',
        author: '',
        is_main: false,
        background_image_url: '',
        images: []
      });
      success('Новость создана');
    } catch (err) {
      showError('Ошибка создания новости');
    }
  };
  
  const handleUpdateNews = async () => {
    if (!editingNews) return;
    
    try {
      await updateNews(editingNews.id, newsForm);
      setNews(news.map(n => 
        n.id === editingNews.id ? { ...n, ...newsForm } : n
      ));
      setShowNewsModal(false);
      setEditingNews(null);
      success('Новость обновлена');
    } catch (err) {
      showError('Ошибка обновления новости');
    }
  };
  
  const handleDeleteNews = async (id: string) => {
    if (!confirm('Удалить новость?')) return;
    
    try {
      await deleteNews(id);
      setNews(news.filter(n => n.id !== id));
      success('Новость удалена');
    } catch (err) {
      showError('Ошибка удаления новости');
    }
  };
  
  const handleCreateCadet = async () => {
    try {
      setCadetModalLoading(true);
      
      if (!cadetForm.name || !cadetForm.email || !cadetForm.platoon || !cadetForm.squad || !cadetForm.password) {
        showError('Заполните все обязательные поля');
        return;
      }
      
      const newCadet = await createCadetWithAuth(cadetForm);
      setCadets([...cadets, newCadet]);
      setShowCadetModal(false);
      setCadetForm({
        name: '',
        email: '',
        phone: '',
        platoon: '',
        squad: 0,
        password: '',
        avatar_url: ''
      });
      success('Кадет успешно создан');
    } catch (err: any) {
      showError(err.message || 'Ошибка создания кадета');
    } finally {
      setCadetModalLoading(false);
    }
  };
  
  const handleUpdateCadet = async () => {
    if (!editingCadet) return;
    
    try {
      setCadetModalLoading(true);
      
      const updates = {
        name: cadetForm.name,
        email: cadetForm.email,
        phone: cadetForm.phone || null,
        platoon: cadetForm.platoon,
        squad: cadetForm.squad,
        avatar_url: cadetForm.avatar_url || null
      };
      
      const updatedCadet = await updateCadetData(editingCadet.id, updates);
      setCadets(cadets.map(c => 
        c.id === editingCadet.id ? { ...c, ...updatedCadet } : c
      ));
      setShowCadetModal(false);
      setEditingCadet(null);
      success('Кадет обновлен');
    } catch (err: any) {
      showError(err.message || 'Ошибка обновления кадета');
    } finally {
      setCadetModalLoading(false);
    }
  };
  
  const handleDeleteCadet = async (cadetId: string, cadetName: string) => {
    if (!confirm(`Удалить кадета "${cadetName}"? Это также удалит его учетную запись для входа в систему.`)) return;
    
    try {
      await deleteCadet(cadetId);
      setCadets(cadets.filter(c => c.id !== cadetId));
      success('Кадет удален');
    } catch (err: any) {
      showError(err.message || 'Ошибка удаления кадета');
    }
  };
  
  const openEditAchievement = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setAchievementForm({
      title: achievement.title,
      description: achievement.description,
      category: achievement.category,
      icon: achievement.icon,
      color: achievement.color
    });
    setShowAchievementModal(true);
  };
  
  const openEditNews = (newsItem: News) => {
    setEditingNews(newsItem);
    setNewsForm({
      title: newsItem.title,
      content: newsItem.content,
      author: newsItem.author,
      is_main: newsItem.is_main,
      background_image_url: newsItem.background_image_url || '',
      images: newsItem.images || []
    });
    setShowNewsModal(true);
  };
  
  const openEditCadet = (cadet: Cadet) => {
    setEditingCadet(cadet);
    setCadetForm({
      name: cadet.name,
      email: cadet.email,
      phone: cadet.phone || '',
      platoon: cadet.platoon,
      squad: cadet.squad,
      password: '', // Пароль не редактируется
      avatar_url: cadet.avatar_url || ''
    });
    setShowCadetModal(true);
  };
  
  const filteredCadets = cadets.filter(cadet => {
    const matchesSearch = cadet.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatoon = filterPlatoon === 'all' || cadet.platoon === filterPlatoon;
    return matchesSearch && matchesPlatoon;
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Доступ запрещён</h2>
          <p className="text-blue-200">У вас нет прав администратора</p>
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
        <div className="container-custom">
          {/* Header */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-center mb-12"
          >
            <h1 className="text-6xl md:text-7xl font-display font-black mb-6 text-gradient text-glow">
              Админ-панель
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
            <p className="text-2xl text-white/90 max-w-3xl mx-auto text-shadow">
              Управление системой рейтинга кадетов
            </p>
          </motion.div>

          {loading && <LoadingSpinner message="Загрузка данных..." />}

          {!loading && (
            <>
              {/* Tabs */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />
              </motion.div>

              {/* Overview Tab */}
              {activeTab === 'overview' && analytics && (
                <div className="space-y-8">
                  <AdminStats analytics={analytics} />
                  <AdminQuickActions
                    onCreateAchievement={() => setShowAchievementModal(true)}
                    onAwardAchievement={() => setShowAwardModal(true)}
                    onAddScore={() => setShowScoreModal(true)}
                    onCreateNews={() => setShowNewsModal(true)}
                    onCreateCadet={() => setShowCadetModal(true)}
                  />
                </div>
              )}

              {/* Cadets Tab */}
              {activeTab === 'cadets' && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-8"
                >
                  {/* Header */}
                  <motion.div variants={staggerItem} className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">Кадеты</h2>
                    <button
                      onClick={() => setShowCadetModal(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <span>Добавить кадета</span>
                    </button>
                  </motion.div>

                  {/* Filters */}
                  <div className="card-hover p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Поиск кадета..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="input pl-10"
                        />
                      </div>
                      <div className="relative">
                        <select
                          value={filterPlatoon}
                          onChange={(e) => setFilterPlatoon(e.target.value)}
                          className="input pl-10"
                        >
                          <option value="all">Все взводы</option>
                          {Array.from(new Set(cadets.map(c => c.platoon))).map(platoon => (
                            <option key={platoon} value={platoon}>{platoon} взвод</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Cadets List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCadets.map((cadet, index) => (
                      <motion.div
                        key={cadet.id}
                        variants={staggerItem}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="card-hover p-6"
                      >
                        <div className="flex items-center space-x-4 mb-4">
                          <img
                            src={cadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                            alt={cadet.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-blue-400"
                          />
                          <div>
                            <h3 className="text-xl font-bold text-white">{cadet.name}</h3>
                            <p className="text-blue-300">{cadet.platoon} взвод, {cadet.squad} отделение</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-blue-200">Рейтинг:</span>
                          <span className="text-2xl font-bold text-yellow-400">#{cadet.rank}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-blue-200">Баллы:</span>
                          <span className="text-2xl font-bold text-white">{cadet.total_score}</span>
                        </div>
                        
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => openEditCadet(cadet)}
                            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDeleteCadet(cadet.id, cadet.name)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Удалить
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Achievements Tab */}
              {activeTab === 'achievements' && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-8"
                >
                  <motion.div variants={staggerItem} className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">Достижения</h2>
                    <button
                      onClick={() => setShowAchievementModal(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <span>Создать достижение</span>
                    </button>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {achievements.map((achievement, index) => {
                      const IconComponent = Star; // Simplified for now
                      
                      return (
                        <motion.div
                          key={achievement.id}
                          variants={staggerItem}
                          whileHover={{ scale: 1.02, y: -5 }}
                          className={`card-gradient ${achievement.color} p-6 rounded-2xl relative group`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <IconComponent className="h-8 w-8 text-white" />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditAchievement(achievement)}
                                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteAchievement(achievement.id)}
                                className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-white mb-2">{achievement.title}</h3>
                          <p className="text-white/90 mb-4">{achievement.description}</p>
                          <span className="text-white/70 text-sm">{achievement.category}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* News Tab */}
              {activeTab === 'news' && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-8"
                >
                  <motion.div variants={staggerItem} className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">Новости</h2>
                    <button
                      onClick={() => setShowNewsModal(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <span>Создать новость</span>
                    </button>
                  </motion.div>

                  <div className="space-y-6">
                    {news.map((newsItem, index) => (
                      <motion.div
                        key={newsItem.id}
                        variants={staggerItem}
                        whileHover={{ scale: 1.01, y: -2 }}
                        className="card-hover p-6 group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-2xl font-bold text-white">{newsItem.title}</h3>
                              {newsItem.is_main && (
                                <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                                  ГЛАВНАЯ
                                </span>
                              )}
                            </div>
                            <p className="text-blue-200 mb-4 line-clamp-2">{newsItem.content}</p>
                            <div className="flex items-center space-x-4 text-blue-300 text-sm">
                              <span>Автор: {newsItem.author}</span>
                              <span>{new Date(newsItem.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditNews(newsItem)}
                              className="p-2 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteNews(newsItem.id)}
                              className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Achievement Modal */}
          <AchievementModal
            isOpen={showAchievementModal}
            onClose={() => {
              setShowAchievementModal(false);
              setEditingAchievement(null);
            }}
            onSubmit={editingAchievement ? handleUpdateAchievement : handleCreateAchievement}
            form={achievementForm}
            setForm={setAchievementForm}
            isEditing={!!editingAchievement}
          />

          {/* Award Achievement Modal */}
          {showAwardModal && (
            <div>Award Modal Placeholder</div>
          )}

          {/* Score Modal */}
          <ScoreModal
            isOpen={showScoreModal}
            onClose={() => setShowScoreModal(false)}
            onSubmit={handleAddScore}
            form={scoreForm}
            setForm={setScoreForm}
            cadets={cadets}
          />

          {/* News Modal */}
          {showNewsModal && (
            <div>News Modal Placeholder</div>
          )}

          {/* Cadet Modal */}
          <CadetModal
            isOpen={showCadetModal}
            onClose={() => {
              setShowCadetModal(false);
              setEditingCadet(null);
              setCadetForm({
                name: '',
                email: '',
                phone: '',
                platoon: '',
                squad: 0,
                password: '',
                avatar_url: ''
              });
            }}
            onSubmit={editingCadet ? handleUpdateCadet : handleCreateCadet}
            form={cadetForm}
            setForm={setCadetForm}
            isEditing={!!editingCadet}
            loading={cadetModalLoading}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;