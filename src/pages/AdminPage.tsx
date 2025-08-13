import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Trophy, 
  Target, 
  FileText, 
  CheckSquare,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  Gift,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminTabs from '../components/admin/AdminTabs';
import AdminStats from '../components/admin/AdminStats';
import AdminQuickActions from '../components/admin/AdminQuickActions';
import { ScoreManagement } from '../components/admin/ScoreManagement';
import AdminManagement from '../components/admin/AdminManagement';
import TaskManagement from '../components/admin/TaskManagement';
import AchievementModal from '../components/admin/modals/AchievementModal';
import CadetModal from '../components/admin/modals/CadetModal';
import EventModal from '../components/admin/modals/EventModal';
import ScoreModal from '../components/admin/modals/ScoreModal';
import AdminResetMenu from '../components/admin/AdminResetMenu';
import { 
  getCadets, 
  getAchievements, 
  addAchievement, 
  updateAchievement, 
  deleteAchievement,
  awardAchievement,
  addScoreHistory,
  updateCadetScores,
  addNews,
  updateNews,
  deleteNews,
  getNews,
  getAnalytics,
  type Cadet,
  type Achievement,
  type News
} from '../lib/supabase';
import { 
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type Event
} from '../lib/events';
import { 
  createCadetWithAuth, 
  updateCadetData, 
  deleteCadet 
} from '../lib/admin';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

const AdminPage: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Modal states
  const [achievementModal, setAchievementModal] = useState({ isOpen: false, isEditing: false, achievement: null as Achievement | null });
  const [cadetModal, setCadetModal] = useState({ isOpen: false, isEditing: false, cadet: null as Cadet | null });
  const [eventModal, setEventModal] = useState({ 
    isOpen: false, 
    isEditing: false, 
    event: null as Event | null,
    viewMode: 'edit' as 'edit' | 'participants'
  });
  const [scoreModal, setScoreModal] = useState({ isOpen: false });
  const [newsModal, setNewsModal] = useState({ isOpen: false, isEditing: false, newsItem: null as News | null });

  // Form states
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    category: '',
    icon: 'Star',
    color: 'from-blue-500 to-blue-700'
  });

  const [cadetForm, setCadetForm] = useState({
    name: '',
    email: '',
    phone: '',
    platoon: '',
    squad: 0,
    password: '',
    avatar_url: ''
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    content: '',
    event_date: '',
    event_time: '',
    location: '',
    max_participants: 0,
    registration_deadline: '',
    background_image_url: '',
    images: [] as string[],
    category: 'general'
  });

  const [scoreForm, setScoreForm] = useState({
    cadetId: '',
    category: 'study' as 'study' | 'discipline' | 'events',
    points: 0,
    description: ''
  });

  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    author: user?.name || '',
    is_main: false,
    background_image_url: '',
    images: [] as string[]
  });

  // Load data
  useEffect(() => {
    if (!isAdmin) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [cadetsData, achievementsData, newsData, eventsData, analyticsData] = await Promise.all([
          getCadets(),
          getAchievements(),
          getNews(),
          getEvents(),
          getAnalytics()
        ]);
        
        setCadets(cadetsData);
        setAchievements(achievementsData);
        setNews(newsData);
        setEvents(eventsData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error loading admin data:', error);
        showError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin]);

  // Achievement handlers
  const handleCreateAchievement = () => {
    setAchievementForm({
      title: '',
      description: '',
      category: '',
      icon: 'Star',
      color: 'from-blue-500 to-blue-700'
    });
    setAchievementModal({ isOpen: true, isEditing: false, achievement: null });
  };

  const handleEditAchievement = (achievement: Achievement) => {
    setAchievementForm({
      title: achievement.title,
      description: achievement.description,
      category: achievement.category,
      icon: achievement.icon,
      color: achievement.color
    });
    setAchievementModal({ isOpen: true, isEditing: true, achievement });
  };

  const handleSubmitAchievement = async () => {
    try {
      if (achievementModal.isEditing && achievementModal.achievement) {
        await updateAchievement(achievementModal.achievement.id, achievementForm);
        setAchievements(achievements.map(a => 
          a.id === achievementModal.achievement!.id ? { ...a, ...achievementForm } : a
        ));
        success('Достижение обновлено');
      } else {
        const newAchievement = await addAchievement(achievementForm);
        setAchievements([...achievements, newAchievement]);
        success('Достижение создано');
      }
      setAchievementModal({ isOpen: false, isEditing: false, achievement: null });
    } catch (error) {
      console.error('Error with achievement:', error);
      showError('Ошибка при работе с достижением');
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это достижение?')) return;
    
    try {
      await deleteAchievement(id);
      setAchievements(achievements.filter(a => a.id !== id));
      success('Достижение удалено');
    } catch (error) {
      console.error('Error deleting achievement:', error);
      showError('Ошибка удаления достижения');
    }
  };

  // Cadet handlers
  const handleCreateCadet = () => {
    setCadetForm({
      name: '',
      email: '',
      phone: '',
      platoon: '',
      squad: 0,
      password: '',
      avatar_url: ''
    });
    setCadetModal({ isOpen: true, isEditing: false, cadet: null });
  };

  const handleEditCadet = (cadet: Cadet) => {
    setCadetForm({
      name: cadet.name,
      email: cadet.email || '',
      phone: cadet.phone || '',
      platoon: cadet.platoon,
      squad: cadet.squad,
      password: '',
      avatar_url: cadet.avatar_url || ''
    });
    setCadetModal({ isOpen: true, isEditing: true, cadet });
  };

  const handleSubmitCadet = async () => {
    try {
      if (cadetModal.isEditing && cadetModal.cadet) {
        const updatedCadet = await updateCadetData(cadetModal.cadet.id, {
          name: cadetForm.name,
          email: cadetForm.email,
          phone: cadetForm.phone,
          platoon: cadetForm.platoon,
          squad: cadetForm.squad,
          avatar_url: cadetForm.avatar_url
        });
        setCadets(cadets.map(c => c.id === cadetModal.cadet!.id ? updatedCadet : c));
        success('Кадет обновлен');
      } else {
        const newCadet = await createCadetWithAuth(cadetForm);
        setCadets([...cadets, newCadet]);
        success('Кадет создан');
      }
      setCadetModal({ isOpen: false, isEditing: false, cadet: null });
    } catch (error) {
      console.error('Error with cadet:', error);
      showError('Ошибка при работе с кадетом');
    }
  };

  const handleDeleteCadet = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого кадета?')) return;
    
    try {
      await deleteCadet(id);
      setCadets(cadets.filter(c => c.id !== id));
      success('Кадет удален');
    } catch (error) {
      console.error('Error deleting cadet:', error);
      showError('Ошибка удаления кадета');
    }
  };

  // Event handlers
  const handleCreateEvent = () => {
    setEventForm({
      title: '',
      description: '',
      content: '',
      event_date: '',
      event_time: '',
      location: '',
      max_participants: 0,
      registration_deadline: '',
      background_image_url: '',
      images: [],
      category: 'general'
    });
    setEventModal({ isOpen: true, isEditing: false, event: null, viewMode: 'edit' });
  };

  const handleEditEvent = (event: Event) => {
    setEventForm({
      title: event.title,
      description: event.description,
      content: event.content || '',
      event_date: event.event_date,
      event_time: event.event_time || '',
      location: event.location || '',
      max_participants: event.max_participants || 0,
      registration_deadline: event.registration_deadline || '',
      background_image_url: event.background_image_url || '',
      images: event.images || [],
      category: event.category
    });
    setEventModal({ isOpen: true, isEditing: true, event, viewMode: 'edit' });
  };

  const handleViewEventParticipants = (event: Event) => {
    setEventForm({
      title: event.title,
      description: event.description,
      content: event.content || '',
      event_date: event.event_date,
      event_time: event.event_time || '',
      location: event.location || '',
      max_participants: event.max_participants || 0,
      registration_deadline: event.registration_deadline || '',
      background_image_url: event.background_image_url || '',
      images: event.images || [],
      category: event.category
    });
    setEventModal({ isOpen: true, isEditing: true, event, viewMode: 'participants' });
  };

  const handleSubmitEvent = async () => {
    try {
      if (eventModal.isEditing && eventModal.event) {
        await updateEvent(eventModal.event.id, eventForm);
        setEvents(events.map(e => 
          e.id === eventModal.event!.id ? { ...e, ...eventForm } : e
        ));
        success('Событие обновлено');
      } else {
        const newEvent = await createEvent({
          ...eventForm,
          status: 'active',
          participants_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setEvents([...events, newEvent]);
        success('Событие создано');
      }
      setEventModal({ isOpen: false, isEditing: false, event: null, viewMode: 'edit' });
    } catch (error) {
      console.error('Error with event:', error);
      showError('Ошибка при работе с событием');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) return;
    
    try {
      await deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
      success('Событие удалено');
    } catch (error) {
      console.error('Error deleting event:', error);
      showError('Ошибка удаления события');
    }
  };

  // Score handlers
  const handleAddScore = () => {
    setActiveTab('scores');
  };

  // News handlers
  const handleCreateNews = () => {
    setNewsForm({
      title: '',
      content: '',
      author: user?.name || '',
      is_main: false,
      background_image_url: '',
      images: []
    });
    setNewsModal({ isOpen: true, isEditing: false, newsItem: null });
  };

  const handleEditNews = (newsItem: News) => {
    setNewsForm({
      title: newsItem.title,
      content: newsItem.content,
      author: newsItem.author,
      is_main: newsItem.is_main,
      background_image_url: newsItem.background_image_url || '',
      images: newsItem.images || []
    });
    setNewsModal({ isOpen: true, isEditing: true, newsItem });
  };

  const handleSubmitNews = async () => {
    try {
      if (newsModal.isEditing && newsModal.newsItem) {
        await updateNews(newsModal.newsItem.id, newsForm);
        setNews(news.map(n => 
          n.id === newsModal.newsItem!.id ? { ...n, ...newsForm } : n
        ));
        success('Новость обновлена');
      } else {
        const newNews = await addNews(newsForm);
        setNews([newNews, ...news]);
        success('Новость создана');
      }
      setNewsModal({ isOpen: false, isEditing: false, newsItem: null });
    } catch (error) {
      console.error('Error with news:', error);
      showError('Ошибка при работе с новостью');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) return;
    
    try {
      await deleteNews(id);
      setNews(news.filter(n => n.id !== id));
      success('Новость удалена');
    } catch (error) {
      console.error('Error deleting news:', error);
      showError('Ошибка удаления новости');
    }
  };

  const handleAwardAchievement = () => {
    // Implementation for awarding achievements
    console.log('Award achievement clicked');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h2>
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
            className="text-center mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-display font-black mb-6 text-gradient text-glow">
              Админ-панель
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
            <p className="text-2xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
              Управление системой кадетского корпуса
            </p>
          </motion.div>

          {loading && <LoadingSpinner message="Загрузка данных..." />}

          {!loading && (
            <>
              {/* Quick Actions */}
              <div className="mb-12">
                <AdminQuickActions
                onCreateAchievement={handleCreateAchievement}
                onAwardAchievement={handleAwardAchievement}
                onAddScore={handleAddScore}
                onCreateNews={handleCreateNews}
                onCreateCadet={handleCreateCadet}
                onCreateEvent={handleCreateEvent}
              />
              </div>

              {/* Tabs */}
              <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Content */}
              {activeTab === 'overview' && analytics && (
                <AdminStats analytics={analytics} />
              )}

              {activeTab === 'admins' && (
                <AdminManagement 
                  currentUserId={user?.id || ''} 
                  isSuperAdmin={isSuperAdmin} 
                />
              )}

              {activeTab === 'cadets' && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">Управление кадетами</h2>
                    {hasPermission('manage_cadets') && (
                      <button onClick={handleCreateCadet} className="btn-primary">
                        <UserPlus className="h-5 w-5 mr-2" />
                        Добавить кадета
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cadets.map((cadet) => (
                      <motion.div
                        key={cadet.id}
                        variants={staggerItem}
                        className="card-hover p-6"
                      >
                        <div className="flex items-center space-x-4 mb-4">
                          <img
                            src={cadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                            alt={cadet.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="text-lg font-bold text-white">{cadet.name}</h3>
                            <p className="text-blue-300">{cadet.platoon} взвод</p>
                          </div>
                        </div>
                        {hasPermission('manage_cadets') && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditCadet(cadet)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-1 inline" />
                              Изменить
                            </button>
                            <button
                              onClick={() => handleDeleteCadet(cadet.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'achievements' && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">Управление достижениями</h2>
                    {hasPermission('manage_achievements') && (
                      <button onClick={handleCreateAchievement} className="btn-primary">
                        <Plus className="h-5 w-5 mr-2" />
                        Создать достижение
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {achievements.map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        variants={staggerItem}
                        className={`card-gradient ${achievement.color} p-6`}
                      >
                        <h3 className="text-xl font-bold text-white mb-2">{achievement.title}</h3>
                        <p className="text-white/90 mb-4">{achievement.description}</p>
                        {hasPermission('manage_achievements') && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditAchievement(achievement)}
                              className="flex-1 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-1 inline" />
                              Изменить
                            </button>
                            <button
                              onClick={() => handleDeleteAchievement(achievement.id)}
                              className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'events' && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">Управление событиями</h2>
                    {hasPermission('manage_events') && (
                      <button onClick={handleCreateEvent} className="btn-primary">
                        <Plus className="h-5 w-5 mr-2" />
                        Создать событие
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                      <motion.div
                        key={event.id}
                        variants={staggerItem}
                        className="card-hover p-6"
                      >
                        <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                        <p className="text-blue-300 mb-2">{new Date(event.event_date).toLocaleDateString('ru-RU')}</p>
                        <p className="text-blue-200 mb-4 line-clamp-2">{event.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-green-400 font-semibold">
                            {event.participants_count} участников
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            event.status === 'active' ? 'bg-green-500/20 text-green-300' :
                            event.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {event.status === 'active' ? 'Активно' :
                             event.status === 'completed' ? 'Завершено' : 'Отменено'}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {hasPermission('view_event_participants') && (
                            <button
                              onClick={() => handleViewEventParticipants(event)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Users className="h-4 w-4 mr-1 inline" />
                              Участники
                            </button>
                          )}
                          {hasPermission('manage_events') && (
                            <>
                              <button
                                onClick={() => handleEditEvent(event)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'news' && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">Управление новостями</h2>
                    {hasPermission('manage_news') && (
                      <button onClick={handleCreateNews} className="btn-primary">
                        <Plus className="h-5 w-5 mr-2" />
                        Создать новость
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {news.map((newsItem) => (
                      <motion.div
                        key={newsItem.id}
                        variants={staggerItem}
                        className="card-hover p-6"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-xl font-bold text-white">{newsItem.title}</h3>
                              {newsItem.is_main && (
                                <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs font-bold">
                                  ГЛАВНАЯ
                                </span>
                              )}
                            </div>
                            <p className="text-blue-300 mb-2">Автор: {newsItem.author}</p>
                            <p className="text-blue-200 line-clamp-2">{newsItem.content}</p>
                          </div>
                          {hasPermission('manage_news') && (
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handleEditNews(newsItem)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteNews(newsItem.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'data-management' && hasPermission('system_reset') && (
                <AdminResetMenu />
              )}

              {activeTab === 'scores' && (hasPermission('manage_scores_study') || hasPermission('manage_scores_discipline') || hasPermission('manage_scores_events') || hasPermission('manage_scores')) && (
                <ScoreManagement />
              )}

              {activeTab === 'tasks' && hasPermission('manage_tasks') && (
                <TaskManagement />
              )}

              {activeTab === 'tasks' && !hasPermission('manage_tasks') && (
                <div className="text-center py-12">
                  <CheckSquare className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h3>
                  <p className="text-blue-200">У вас нет прав для управления заданиями</p>
                </div>
              )}
            </>
          )}

          {/* Modals */}
          <AchievementModal
            isOpen={achievementModal.isOpen}
            onClose={() => setAchievementModal({ isOpen: false, isEditing: false, achievement: null })}
            onSubmit={handleSubmitAchievement}
            form={achievementForm}
            setForm={setAchievementForm}
            isEditing={achievementModal.isEditing}
          />

          <CadetModal
            isOpen={cadetModal.isOpen}
            onClose={() => setCadetModal({ isOpen: false, isEditing: false, cadet: null })}
            onSubmit={handleSubmitCadet}
            form={cadetForm}
            setForm={setCadetForm}
            isEditing={cadetModal.isEditing}
            loading={false}
          />

          <EventModal
            isOpen={eventModal.isOpen}
            onClose={() => setEventModal({ isOpen: false, isEditing: false, event: null, viewMode: 'edit' })}
            onSubmit={handleSubmitEvent}
            form={eventForm}
            setForm={setEventForm}
            isEditing={eventModal.isEditing}
            selectedEventId={eventModal.event?.id}
            viewMode={eventModal.viewMode}
          />

          <ScoreModal
            isOpen={scoreModal.isOpen}
            onClose={() => setScoreModal({ isOpen: false })}
            form={scoreForm}
            setForm={setScoreForm}
            cadets={cadets}
            onSuccess={() => {
              // Обновляем данные после успешного начисления баллов
              const loadData = async () => {
                try {
                  const [cadetsData, analyticsData] = await Promise.all([
                    getCadets(),
                    getAnalytics()
                  ]);
                  setCadets(cadetsData);
                  setAnalytics(analyticsData);
                } catch (error) {
                  console.error('Error reloading data:', error);
                }
              };
              loadData();
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;