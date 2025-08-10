import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  UserPlus,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminTabs from '../components/admin/AdminTabs';
import AdminStats from '../components/admin/AdminStats';
import AdminQuickActions from '../components/admin/AdminQuickActions';
import AchievementModal from '../components/admin/modals/AchievementModal';
import CadetModal from '../components/admin/modals/CadetModal';
import EventModal from '../components/admin/modals/EventModal';
import ScoreModal from '../components/admin/modals/ScoreModal';
import { useToast } from '../hooks/useToast';
import { 
  getCadets, 
  getAchievements, 
  addAchievement, 
  updateAchievement, 
  deleteAchievement,
  awardAchievement,
  addScoreHistory,
  updateCadetScores,
  getNews,
  addNews,
  updateNews,
  deleteNews,
  getTasks,
  getAnalytics,
  type Cadet,
  type Achievement,
  type News,
  type Task
} from '../lib/supabase';
import { 
  getEvents, 
  getEventParticipants, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  type Event,
  type EventParticipant
} from '../lib/events';
import { 
  createCadetWithAuth, 
  updateCadetData, 
  deleteCadet,
  getCadetsStats
} from '../lib/admin';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventParticipants, setEventParticipants] = useState<{ [eventId: string]: EventParticipant[] }>({});
  const [analytics, setAnalytics] = useState<any>(null);

  // Modal states
  const [achievementModal, setAchievementModal] = useState({ isOpen: false, isEditing: false, achievement: null });
  const [cadetModal, setCadetModal] = useState({ isOpen: false, isEditing: false, cadet: null });
  const [eventModal, setEventModal] = useState({ isOpen: false, isEditing: false, event: null });
  const [scoreModal, setScoreModal] = useState({ isOpen: false });

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

  // Check admin access
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cadetsData, achievementsData, newsData, tasksData, eventsData, analyticsData] = await Promise.all([
          getCadets(),
          getAchievements(),
          getNews(),
          getTasks(),
          getEvents(),
          getAnalytics()
        ]);

        setCadets(cadetsData);
        setAchievements(achievementsData);
        setNews(newsData);
        setTasks(tasksData);
        setEvents(eventsData);
        setAnalytics(analyticsData);

        // Загружаем участников для каждого события
        const participantsData: { [eventId: string]: EventParticipant[] } = {};
        for (const event of eventsData) {
          try {
            const participants = await getEventParticipants(event.id);
            participantsData[event.id] = participants;
          } catch (error) {
            console.error(`Error fetching participants for event ${event.id}:`, error);
            participantsData[event.id] = [];
          }
        }
        setEventParticipants(participantsData);

      } catch (error) {
        console.error('Error fetching admin data:', error);
        showError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, showError]);

  // Achievement handlers
  const handleCreateAchievement = async () => {
    try {
      const newAchievement = await addAchievement(achievementForm);
      setAchievements([...achievements, newAchievement]);
      setAchievementModal({ isOpen: false, isEditing: false, achievement: null });
      setAchievementForm({ title: '', description: '', category: '', icon: 'Star', color: 'from-blue-500 to-blue-700' });
      success('Достижение создано');
    } catch (error) {
      showError('Ошибка создания достижения');
    }
  };

  // Cadet handlers
  const handleCreateCadet = async () => {
    try {
      const newCadet = await createCadetWithAuth(cadetForm);
      setCadets([...cadets, newCadet]);
      setCadetModal({ isOpen: false, isEditing: false, cadet: null });
      setCadetForm({ name: '', email: '', phone: '', platoon: '', squad: 0, password: '', avatar_url: '' });
      success('Кадет создан');
    } catch (error) {
      showError('Ошибка создания кадета');
    }
  };

  // Event handlers
  const handleCreateEvent = async () => {
    try {
      const newEvent = await createEvent({
        ...eventForm,
        status: 'active',
        participants_count: 0
      });
      setEvents([...events, newEvent]);
      setEventParticipants({ ...eventParticipants, [newEvent.id]: [] });
      setEventModal({ isOpen: false, isEditing: false, event: null });
      setEventForm({
        title: '', description: '', content: '', event_date: '', event_time: '',
        location: '', max_participants: 0, registration_deadline: '',
        background_image_url: '', images: [], category: 'general'
      });
      success('Событие создано');
    } catch (error) {
      showError('Ошибка создания события');
    }
  };

  // Score handlers
  const handleAddScore = async () => {
    try {
      await addScoreHistory({
        cadet_id: scoreForm.cadetId,
        category: scoreForm.category,
        points: scoreForm.points,
        description: scoreForm.description
      });
      
      await updateCadetScores(scoreForm.cadetId, scoreForm.category, scoreForm.points);
      
      // Обновляем список кадетов
      const updatedCadets = await getCadets();
      setCadets(updatedCadets);
      
      setScoreModal({ isOpen: false });
      setScoreForm({ cadetId: '', category: 'study', points: 0, description: '' });
      success('Баллы начислены');
    } catch (error) {
      showError('Ошибка начисления баллов');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Загрузка панели администратора..." size="lg" />
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
              Панель администратора
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
            <p className="text-2xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
              Управление кадетами, событиями и достижениями
            </p>
          </motion.div>

          {/* Quick Actions */}
          <AdminQuickActions
            onCreateAchievement={() => setAchievementModal({ isOpen: true, isEditing: false, achievement: null })}
            onAwardAchievement={() => {}}
            onAddScore={() => setScoreModal({ isOpen: true })}
            onCreateNews={() => {}}
            onCreateCadet={() => setCadetModal({ isOpen: true, isEditing: false, cadet: null })}
            onCreateEvent={() => setEventModal({ isOpen: true, isEditing: false, event: null })}
          />

          {/* Stats */}
          {analytics && <AdminStats analytics={analytics} />}

          {/* Tabs */}
          <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {activeTab === 'events' && (
              <motion.div variants={staggerItem} className="card-hover p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Управление событиями</h2>
                <div className="space-y-6">
                  {events.map((event) => (
                    <div key={event.id} className="glass-effect p-6 rounded-2xl">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                          <p className="text-blue-200 mb-2">{event.description}</p>
                          <div className="flex items-center space-x-4 text-blue-300 text-sm">
                            <span>📅 {new Date(event.event_date).toLocaleDateString('ru-RU')}</span>
                            <span>👥 {event.participants_count} участников</span>
                            <span>📍 {event.location}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              // Показать участников
                              const participants = eventParticipants[event.id] || [];
                              alert(`Участники события "${event.title}":\n\n${
                                participants.length > 0 
                                  ? participants.map(p => `• ${p.cadet?.name} (${p.cadet?.platoon} взвод)`).join('\n')
                                  : 'Пока нет участников'
                              }`);
                            }}
                            className="btn-icon text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="btn-icon text-yellow-400 hover:text-yellow-300">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="btn-icon text-red-400 hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Список участников */}
                      {eventParticipants[event.id] && eventParticipants[event.id].length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                          <h4 className="text-white font-semibold mb-2">Участники ({eventParticipants[event.id].length}):</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {eventParticipants[event.id].map((participant) => (
                              <div key={participant.id} className="flex items-center space-x-2 text-blue-200 text-sm">
                                <span>•</span>
                                <span>{participant.cadet?.name}</span>
                                <span className="text-blue-400">({participant.cadet?.platoon})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'cadets' && (
              <motion.div variants={staggerItem} className="card-hover p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Управление кадетами</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cadets.map((cadet) => (
                    <div key={cadet.id} className="glass-effect p-6 rounded-2xl">
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={cadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                          alt={cadet.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-white font-bold">{cadet.name}</h3>
                          <p className="text-blue-300 text-sm">{cadet.platoon} взвод, {cadet.squad} отделение</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-400 font-bold">{cadet.total_score} баллов</span>
                        <div className="flex space-x-2">
                          <button className="btn-icon text-yellow-400 hover:text-yellow-300">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="btn-icon text-red-400 hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Modals */}
          <AchievementModal
            isOpen={achievementModal.isOpen}
            onClose={() => setAchievementModal({ isOpen: false, isEditing: false, achievement: null })}
            onSubmit={handleCreateAchievement}
            form={achievementForm}
            setForm={setAchievementForm}
            isEditing={achievementModal.isEditing}
          />

          <CadetModal
            isOpen={cadetModal.isOpen}
            onClose={() => setCadetModal({ isOpen: false, isEditing: false, cadet: null })}
            onSubmit={handleCreateCadet}
            form={cadetForm}
            setForm={setCadetForm}
            isEditing={cadetModal.isEditing}
            loading={false}
          />

          <EventModal
            isOpen={eventModal.isOpen}
            onClose={() => setEventModal({ isOpen: false, isEditing: false, event: null })}
            onSubmit={handleCreateEvent}
            form={eventForm}
            setForm={setEventForm}
            isEditing={eventModal.isEditing}
          />

          <ScoreModal
            isOpen={scoreModal.isOpen}
            onClose={() => setScoreModal({ isOpen: false })}
            onSubmit={handleAddScore}
            form={scoreForm}
            setForm={setScoreForm}
            cadets={cadets}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;